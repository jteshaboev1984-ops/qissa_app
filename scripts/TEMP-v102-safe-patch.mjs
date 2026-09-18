import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

// One-use patcher on an isolated branch. Never reads secrets, runs providers, or changes DB.
assert.equal(process.env.GITHUB_REF, 'refs/heads/fix/v102-architect-incomplete-diagnostics-budget-20260918')
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1')
assert.equal(readFileSync('audit/TEMP-v102-trigger.txt', 'utf8').trim(), 'APPLY-V102-PROVIDER-FREE-ONCE-20260918')
const changed = []
function modify(path, edit) {
  const old = readFileSync(path, 'utf8')
  const next = edit(old)
  assert.notEqual(next, old, `${path}: no change`)
  writeFileSync(path, next)
  changed.push(path)
}
function replaceOnce(source, from, to, label) {
  assert.equal(source.split(from).length, 2, `${label}: expected exactly one original anchor`)
  return source.replace(from, to)
}
function replaceWithin(source, start, end, from, to, label) {
  const first = source.indexOf(start)
  assert(first >= 0, `${label}: start missing`)
  const last = source.indexOf(end, first + start.length)
  assert(last > first, `${label}: end missing`)
  return source.slice(0, first) + replaceOnce(source.slice(first, last), from, to, label) + source.slice(last)
}
modify('supabase/functions/story-generate/split-openai.ts', old => {
  let s = replaceOnce(old,
    "  if (status === 'incomplete') throw new Error('openai_incomplete_response')",
    "  if (status === 'incomplete') throw new Error(`openai_incomplete_response:${structuredResponseIncompleteReason(payload)}`)", 'incomplete error')
  s = replaceOnce(s,
    "const requestStructured = async <T>(",
    `// Fixed categories only: provider prose, errors, identifiers, and partial JSON never enter headers.\nexport const structuredResponseIncompleteReason = (payload: unknown): 'max-output-tokens' | 'content-filter' | 'other' => {\n  if (!payload || typeof payload !== 'object') return 'other'\n  const details = (payload as { incomplete_details?: unknown }).incomplete_details\n  if (!details || typeof details !== 'object') return 'other'\n  const reason = (details as { reason?: unknown }).reason\n  if (reason === 'max_output_tokens' || reason === 'max_tokens') return 'max-output-tokens'\n  if (reason === 'content_filter') return 'content-filter'\n  return 'other'\n}\n\nconst requestStructured = async <T>(`, 'reason normalization')
  s = replaceOnce(s, "    timeoutMs,\n    1800,\n    'none',", "    timeoutMs,\n    // Bounded headroom hypothesis for E1's two complete choice patches. Not a proven root-cause fix.\n    2400,\n    'none',", 'architect cap')
  return s
})
modify('supabase/functions/story-generate/split-index.ts', old => {
  let s = replaceOnce(old,
    "  if (reason === 'openai_incomplete_response') return 'provider-incomplete'",
    "  if (reason === 'openai_incomplete_response' || reason.startsWith('openai_incomplete_response:')) return 'provider-incomplete'", 'provider failure class')
  s = replaceOnce(s, 'const repairContractFailureCodes = new Set([',
    `// Only report one of three fixed values, never provider response content.\nconst providerIncompleteReason = (reason: string): string => {\n  const value = reason.slice('openai_incomplete_response:'.length)\n  return value === 'max-output-tokens' || value === 'content-filter' ? value : 'other'\n}\n\nconst repairContractFailureCodes = new Set([`, 'safe reason helper')
  s = replaceWithin(s, "trace.push(`architect:${lastFailureClass}`)", "architectElapsedMs = Date.now() - architectCallStartedAt\n\n  blueprint =", "      'X-QISSA-Architect-Timeout-Ms': String(architectTimeoutMs),", "      'X-QISSA-Architect-Timeout-Ms': String(architectTimeoutMs),\n      'X-QISSA-Provider-Incomplete-Reason': lastFailureClass === 'provider-incomplete' ? providerIncompleteReason(reason) : 'none',", 'architect failure metadata')
  s = replaceWithin(s, "trace.push(`narrator:${lastFailureClass}`)", '  const initialRuleFlags =', "      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),", "      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n      'X-QISSA-Provider-Incomplete-Reason': lastFailureClass === 'provider-incomplete' ? providerIncompleteReason(reason) : 'none',", 'narrator failure metadata')
  return s
})
modify('scripts/check-story-cost-guard.mjs', old => replaceOnce(old, "*1800[\\s\\S]*'none'", "*2400[\\s\\S]*'none'", 'cost guard cap assertion'))
modify('scripts/check-story-ai-split.mjs', old => replaceOnce(old, "  '1800',", "  '2400',", 'split cap assertion'))
modify('package.json', old => replaceOnce(old, "&& node scripts/check-story-debut-orientation.mjs\"", "&& node scripts/check-story-debut-orientation.mjs && node scripts/check-story-provider-incomplete.mjs\"", 'register new provider-free test'))
console.log('V102_SAFE_PATCH_PASS:', changed.join(', '), 'only exact source anchors changed; no paid/network work.')
