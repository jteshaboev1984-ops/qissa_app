import { readFileSync } from 'node:fs'
import { fearAdjudicationConsistencyErrors } from '../supabase/functions/story-generate/fear-adjudication.ts'
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

const mildFear = { excessive_fear: false, category: 'none_or_mild', evidence: '' }
assert(fearAdjudicationConsistencyErrors(mildFear, 'O‘rmonda kech bo‘ldi, lekin do‘stlar birga kulishdi.').length === 0, 'mild fear adjudication must be valid without invented evidence')

const realFearText = 'Bo‘ri bolani uzoq vaqt quvladi va bola vahimaga tushdi.'
const realFear = { excessive_fear: true, category: 'threatening_pursuit', evidence: 'Bo‘ri bolani uzoq vaqt quvladi' }
assert(fearAdjudicationConsistencyErrors(realFear, realFearText).length === 0, 'severe fear must require a supported severe category and exact evidence')

const mismatchedFear = { excessive_fear: true, category: 'none_or_mild', evidence: '' }
assert(fearAdjudicationConsistencyErrors(mismatchedFear, realFearText).includes('fear_category_boolean_mismatch'), 'fear boolean/category mismatch must fail closed')

const inventedEvidence = { excessive_fear: true, category: 'trapping', evidence: 'eshik qulflanib qoldi' }
assert(fearAdjudicationConsistencyErrors(inventedEvidence, 'Do‘stlar ochiq ayvonda suhbatlashdi.').includes('fear_evidence_not_in_story'), 'severe fear evidence must be copied from the actual child-visible text')

const nonSevereEvidence = { excessive_fear: false, category: 'none_or_mild', evidence: 'qorong‘i edi' }
assert(fearAdjudicationConsistencyErrors(nonSevereEvidence, 'Kechasi qorong‘i edi.').includes('nonsevere_fear_must_not_invent_evidence'), 'non-severe adjudication must not manufacture fear evidence')

for (const fragment of [
  'safetyVerdictContract',
  'The safety flags are exhaustive for this classifier',
  'If every flag is false, approved MUST be true',
  'Previous structured verdict was internally inconsistent',
  'safetyEvaluationConsistencyErrors(first)',
  'safetyEvaluationConsistencyErrors(corrected)',
  "throw new Error('openai_safety_evaluation_inconsistent')",
  'needsInteractiveFearConfirmation',
  'requestFearAdjudication',
  'narrow child-bedtime fear adjudicator',
  'fearAdjudicationConsistencyErrors(adjudication',
  "throw new Error('openai_fear_adjudication_inconsistent')",
  'isolated excessive_fear was not confirmed by narrow fear adjudication',
]) {
  assert(provider.includes(fragment), `safety provider is missing bounded safety adjudication contract: ${fragment}`)
}

const firstRequest = provider.indexOf('const first = await requestSafetyEvaluation')
const firstValidation = provider.indexOf('safetyEvaluationConsistencyErrors(first)', firstRequest)
const correctedRequest = provider.indexOf('const corrected = await requestSafetyEvaluation', firstValidation)
const correctedValidation = provider.indexOf('safetyEvaluationConsistencyErrors(corrected)', correctedRequest)
const correctedReturn = provider.indexOf('return corrected', correctedValidation)
const fearGate = provider.indexOf('needsInteractiveFearConfirmation(context, first)', correctedReturn)
const adjudicationRequest = provider.indexOf('const adjudication = await requestFearAdjudication', fearGate)
const adjudicationValidation = provider.indexOf('fearAdjudicationConsistencyErrors(adjudication', adjudicationRequest)
const severeReturn = provider.indexOf('if (adjudication.excessive_fear) return first', adjudicationValidation)
const clearedReturn = provider.indexOf('return cleared', severeReturn)
assert(
  firstRequest >= 0 && firstValidation > firstRequest && correctedRequest > firstValidation && correctedValidation > correctedRequest && correctedReturn > correctedValidation,
  'semantic safety must keep the bounded one-shot consistency correction and return before any fear adjudication',
)
assert(
  fearGate > correctedReturn && adjudicationRequest > fearGate && adjudicationValidation > adjudicationRequest && severeReturn > adjudicationValidation && clearedReturn > severeReturn,
  'isolated Episode 1 excessive-fear verdict must use exactly one evidence-based narrow adjudication before it can be cleared',
)

if (failures.length > 0) {
  console.error('Story semantic safety verdict check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story semantic safety verdict check passed: general semantic safety remains fail-closed, isolated Episode 1 fear uses one evidence-based narrow adjudication, severe fear remains blocked, and malformed adjudication fails closed.')
