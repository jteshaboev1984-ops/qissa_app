// Provider-free audit helpers. Do not read request payloads, secrets, installationAuth or tokens.
// Only the explicitly approved, non-secret response headers enter audit metadata.
export const STORY_EVIDENCE_HEADERS = Object.freeze([
  'x-qissa-generation-source',
  'x-qissa-fallback-reason',
  'x-qissa-runtime-ai',
  'x-qissa-story-pipeline',
  'x-qissa-architect-model',
  'x-qissa-narrator-model-used',
  'x-qissa-safety-model',
  'x-qissa-escalation-used',
  'x-qissa-provider-calls',
  'x-qissa-initial-story-words',
  'x-qissa-final-story-words',
  'x-qissa-generation-repair',
  'x-qissa-repair-retry-used',
  'x-qissa-narrator-retry-used',
  'x-qissa-blueprint-keys-normalized',
  'x-qissa-generation-failure-class',
  'x-qissa-generation-failure-trace',
])

const safeHeader = (value, name) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/gu, ' ').slice(0, name === 'x-qissa-generation-failure-trace' ? 480 : 160)
  : null

export function collectStoryLiveEvidence(headers) {
  if (!headers || typeof headers.get !== 'function') throw new TypeError('Expected response Headers')
  const metadata = Object.fromEntries(STORY_EVIDENCE_HEADERS.map((name) => [name, safeHeader(headers.get(name), name)]))
  const diagnosticErrors = []
  if (metadata['x-qissa-generation-source'] === 'safe-fallback' && metadata['x-qissa-fallback-reason'] === 'generation-or-safety-failed') {
    for (const name of ['x-qissa-generation-failure-class', 'x-qissa-generation-failure-trace']) {
      if (!metadata[name]?.trim()) diagnosticErrors.push(`Missing required server diagnostic: ${name}`)
    }
  }
  return { metadata, diagnosticErrors }
}

// Choice IDs are authored by Architect. Their literal values are NOT 'a'/'b' contracts.
export function selectActualStoryChoices(episode) {
  const choices = episode?.choices
  if (!Array.isArray(choices) || choices.length !== 2) throw new Error('E1 requires exactly two actual choices')
  const ids = new Set()
  for (const choice of choices) {
    if (!choice || typeof choice.choice_id !== 'string' || !choice.choice_id.trim() || ids.has(choice.choice_id)) {
      throw new Error('E1 has missing or duplicate choice_id')
    }
    if (typeof choice.resolution_text !== 'string' || !choice.resolution_text.trim()) throw new Error('E1 choice bridge is missing')
    ids.add(choice.choice_id)
  }
  return choices
}

// Caller must print the allowlisted metadata BEFORE asserting expected source or quality.
// Never promote safe-fallback to a provider-authored story or hide a diagnostic-capture failure.
export function requireUsableStoryResponse(evidence, expectedSource = 'openai-structured') {
  if (evidence.diagnosticErrors.length) throw new Error(evidence.diagnosticErrors.join('; '))
  const source = evidence.metadata['x-qissa-generation-source']
  if (source !== expectedSource) {
    throw new Error(`Expected ${expectedSource}; received ${source || 'missing'} (${evidence.metadata['x-qissa-fallback-reason'] || 'no fallback reason'})`)
  }
}
