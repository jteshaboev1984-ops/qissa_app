import { readFileSync } from 'node:fs'
import { safetyEvaluationConsistencyErrors } from '../supabase/functions/story-generate/safety-verdict.ts'

const provider = readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')
const failures = []
const assert = (condition, message) => { if (!condition) failures.push(message) }

const flags = (overrides = {}) => ({
  discrimination: false,
  humiliation: false,
  religious_push: false,
  political_push: false,
  gender_stereotype: false,
  nationality_stereotype: false,
  conditional_love: false,
  bedtime_overstimulation: false,
  adult_theme: false,
  excessive_fear: false,
  ...overrides,
})

const cleanPublish = {
  approved: true,
  risk_level: 'low',
  flags: flags(),
  required_action: 'publish',
  notes: [],
}
assert(safetyEvaluationConsistencyErrors(cleanPublish).length === 0, 'clean all-false safety verdict must be internally consistent')

const productionFailureShape = {
  approved: false,
  risk_level: 'medium',
  flags: flags(),
  required_action: 'regenerate',
  notes: ['recheck'],
}
const productionErrors = safetyEvaluationConsistencyErrors(productionFailureShape)
assert(productionErrors.includes('unflagged_verdict_not_approved'), 'all-false rejected verdict must be detected')
assert(productionErrors.includes('unflagged_verdict_not_low_risk'), 'all-false medium-risk verdict must be detected')
assert(productionErrors.includes('unflagged_verdict_not_publish'), 'all-false regenerate verdict must be detected')

const flaggedReject = {
  approved: false,
  risk_level: 'medium',
  flags: flags({ humiliation: true }),
  required_action: 'regenerate',
  notes: [],
}
assert(safetyEvaluationConsistencyErrors(flaggedReject).length === 0, 'named-flag rejection must remain valid')

const flaggedPublish = {
  approved: true,
  risk_level: 'low',
  flags: flags({ discrimination: true }),
  required_action: 'publish',
  notes: [],
}
const flaggedPublishErrors = safetyEvaluationConsistencyErrors(flaggedPublish)
assert(flaggedPublishErrors.includes('flagged_verdict_approved'), 'flagged approved verdict must be rejected')
assert(flaggedPublishErrors.includes('flagged_verdict_publish'), 'flagged publish action must be rejected')

for (const fragment of [
  'safetyVerdictContract',
  'The safety flags are exhaustive for this classifier',
  'If every flag is false, approved MUST be true',
  'Previous structured verdict was internally inconsistent',
  'safetyEvaluationConsistencyErrors(first)',
  'safetyEvaluationConsistencyErrors(corrected)',
  "throw new Error('openai_safety_evaluation_inconsistent')",
  'needsInteractiveFearConfirmation',
  'previous internally consistent verdict flagged only excessive_fear',
  'safetyEvaluationConsistencyErrors(confirmed)',
]) {
  assert(provider.includes(fragment), `safety provider is missing bounded safety recheck contract: ${fragment}`)
}

const firstRequest = provider.indexOf('const first = await requestSafetyEvaluation')
const firstValidation = provider.indexOf('safetyEvaluationConsistencyErrors(first)', firstRequest)
const correctedRequest = provider.indexOf('const corrected = await requestSafetyEvaluation', firstValidation)
const correctedValidation = provider.indexOf('safetyEvaluationConsistencyErrors(corrected)', correctedRequest)
const correctedReturn = provider.indexOf('return corrected', correctedValidation)
const fearGate = provider.indexOf('needsInteractiveFearConfirmation(context, first)', correctedReturn)
const confirmedRequest = provider.indexOf('const confirmed = await requestSafetyEvaluation', fearGate)
const confirmedValidation = provider.indexOf('safetyEvaluationConsistencyErrors(confirmed)', confirmedRequest)
const confirmedReturn = provider.indexOf('return confirmed', confirmedValidation)
assert(
  firstRequest >= 0 && firstValidation > firstRequest && correctedRequest > firstValidation && correctedValidation > correctedRequest && correctedReturn > correctedValidation,
  'semantic safety must keep the bounded one-shot consistency correction and return before any fear confirmation',
)
assert(
  fearGate > correctedReturn && confirmedRequest > fearGate && confirmedValidation > confirmedRequest && confirmedReturn > confirmedValidation,
  'isolated Episode 1 excessive-fear verdict may receive exactly one independent confirmation',
)

if (failures.length > 0) {
  console.error('Story semantic safety verdict check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story semantic safety verdict check passed: all-false rejection is treated as inconsistent, named-flag rejection remains valid, one safety-only recheck is bounded, and repeated inconsistency fails closed.')
