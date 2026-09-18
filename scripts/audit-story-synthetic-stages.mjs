import { readFileSync } from 'node:fs'

// Diagnostic-only: accepts a PRIVATE, operator-authorized synthetic payload.
// Never prints raw text, names, memory, file paths, IDs, or validation prose.
// This is not a literary-quality validator or a live/provider test.
const KNOWN = new Set([
  'architect_raw', 'architect_validation', 'narrator_initial',
  'narrator_validation', 'repair_first', 'repair_retry',
  'escalation', 'semantic_verdict',
])
const CANDIDATES = new Set(['narrator_initial', 'repair_first', 'repair_retry', 'escalation'])
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const countWords = (value) => typeof value === 'string'
  ? value.trim().split(/\s+/u).filter(Boolean).length : null
const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('en-US')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/gu, ' ').trim()
const repeatedBeats = (value) => {
  if (!Array.isArray(value) || !value.every((beat) => typeof beat === 'string')) return null
  const beats = value.map(normalize)
  return beats.length - new Set(beats).size
}
const normalizedSame = (left, right) => typeof left === 'string' && typeof right === 'string'
  ? Boolean(normalize(left)) && normalize(left) === normalize(right) : null
const exactRepeatedSentences = (text) => {
  if (typeof text !== 'string') return null
  // Descriptive diagnostic only. A bedtime refrain can be intentional.
  const sentences = text.split(/[.!?。؟]+/u).map(normalize)
    .filter((item) => item.split(' ').filter(Boolean).length >= 8)
  return sentences.length - new Set(sentences).size
}
const candidateMetrics = (data) => {
  if (!isObject(data)) return null
  return {
    story_words: countWords(data.story_text),
    exact_repeated_long_sentences: exactRepeatedSentences(data.story_text),
  }
}

export function auditSyntheticStages(input) {
  const payload = isObject(input) && isObject(input.payload) ? input.payload : input
  if (!isObject(payload) || payload.schema !== 1 || !Array.isArray(payload.stages) || payload.stages.length > 12) {
    throw new Error('Invalid synthetic diagnostic envelope')
  }
  const byStage = new Map()
  for (const entry of payload.stages) {
    if (!isObject(entry) || !KNOWN.has(entry.stage) || !isObject(entry.data) || byStage.has(entry.stage)) {
      throw new Error('Invalid synthetic diagnostic stage')
    }
    byStage.set(entry.stage, entry.data)
  }
  const rawPlan = byStage.get('architect_raw')
  const validatedPlan = byStage.get('architect_validation')?.blueprint
  const blueprint = isObject(validatedPlan) ? validatedPlan : rawPlan
  const choices = Array.isArray(blueprint?.choices) ? blueprint.choices : []
  const normalizedChoices = choices.length === 2 && choices.every(isObject)
  const actionOverlap = normalizedChoices ? normalizedSame(choices[0].effect_summary, choices[1].effect_summary) : null
  const outcomeOverlap = normalizedChoices ? normalizedSame(choices[0].resolution_goal, choices[1].resolution_goal) : null
  const stages = [...byStage.keys()]
  const candidateStages = stages.filter((stage) => CANDIDATES.has(stage))
  const finalStage = candidateStages.at(-1) ?? null
  const initialWords = candidateMetrics(byStage.get('narrator_initial'))?.story_words ?? null
  const finalWords = finalStage ? candidateMetrics(byStage.get(finalStage))?.story_words ?? null : null
  const warnings = []
  for (const stage of ['architect_raw', 'architect_validation', 'narrator_initial', 'narrator_validation']) {
    if (!byStage.has(stage)) warnings.push(`stage_missing_${stage}`)
  }
  if (typeof initialWords === 'number' && initialWords < 320) warnings.push('initial_story_under_320_words')
  if (typeof finalWords === 'number' && finalWords < 320) warnings.push('final_story_under_320_words')
  if (repeatedBeats(blueprint?.beats) > 0) warnings.push('exact_repeated_plan_beats_review')
  if (actionOverlap === true) warnings.push('same_normalized_choice_action_review')
  if (outcomeOverlap === true) warnings.push('same_normalized_choice_outcome_review')
  // Never infer why a story is weak from these counts. Manual inspection required.
  return {
    schema: 1,
    stages_present: stages,
    architect: {
      beats_count: Array.isArray(blueprint?.beats) ? blueprint.beats.length : null,
      exact_repeated_beats: repeatedBeats(blueprint?.beats),
      identical_choice_actions: actionOverlap,
      identical_choice_resolution_goals: outcomeOverlap,
    },
    narration: {
      initial: candidateMetrics(byStage.get('narrator_initial')),
      final_stage: finalStage,
      final: finalStage ? candidateMetrics(byStage.get(finalStage)) : null,
      word_delta: initialWords !== null && finalWords !== null ? finalWords - initialWords : null,
      repair_observed: byStage.has('repair_first') || byStage.has('repair_retry'),
    },
    warnings,
    literary_quality_verified: false,
    root_cause_identified: false,
  }
}

if (process.argv[1]?.endsWith('/audit-story-synthetic-stages.mjs')) {
  // CLI only. Generic errors: neither parser details nor source paths may leak.
  try {
    if (process.argv.length !== 3) throw new Error('invalid_input')
    const privatePayload = JSON.parse(readFileSync(process.argv[2], 'utf8'))
    process.stdout.write(`${JSON.stringify(auditSyntheticStages(privatePayload), null, 2)}\n`)
  } catch {
    process.stderr.write('Synthetic diagnostic audit failed: use one authorized, private schema-1 payload.\n')
    process.exitCode = 1
  }
}
