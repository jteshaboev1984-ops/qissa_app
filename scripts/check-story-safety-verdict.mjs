import { readFileSync } from 'node:fs'
import { fearAdjudicationConsistencyErrors } from '../supabase/functions/story-generate/fear-adjudication.ts'
import { childVisibleStorySafetyProjection, childVisibleStorySafetyText } from '../supabase/functions/story-generate/story-safety-projection.ts'
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

const projectionCandidate = {
  title: 'Do‘stlarning sovg‘asi',
  story_text: '{{HERO}} do‘stlari bilan barglardan rasm tayyorladi.',
  choices: [{
    choice_id: 'choice-a',
    text: 'Rasmni tugatish',
    effect_summary: 'Do‘stlar rasmni birga tugatdi.',
    resolution_text: 'Ular rasmni kulib tugatib, bir-biriga ko‘rsatdi.',
    tomorrow_seed: 'HIDDEN_SCARY_TOMORROW_SEED',
    choice_icon: '🎁',
    state_patch: {
      last_event: 'HIDDEN_SCARY_STATE', new_friend: null, hero_trait: null, open_arc: null,
      relationship_updates: [{ key: 'friend', value: 'HIDDEN_SCARY_RELATIONSHIP' }],
      canon_updates: [{ key: 'secret', value: 'HIDDEN_SCARY_CANON' }],
    },
    value_alignment: ['kindness'],
  }],
  state_patch: {
    last_event: 'HIDDEN_TOP_STATE', new_friend: null, hero_trait: null, open_arc: null,
    relationship_updates: [], canon_updates: [],
  },
  vocabulary: [{ word: 'barg', translation: 'leaf', example: 'Barg yerga tushdi.' }],
  nextEpisodePreview: 'Sovg‘ani ko‘rsatish vaqti yaqin edi.',
}
const safetyProjectionJson = JSON.stringify(childVisibleStorySafetyProjection(projectionCandidate))
for (const visible of ['Do‘stlarning sovg‘asi', 'Rasmni tugatish', 'Do‘stlar rasmni birga tugatdi.', 'barg', 'Sovg‘ani ko‘rsatish vaqti yaqin edi.']) {
  assert(safetyProjectionJson.includes(visible), `child-visible safety projection must preserve visible material: ${visible}`)
}
for (const hidden of ['HIDDEN_SCARY_TOMORROW_SEED', 'HIDDEN_SCARY_STATE', 'HIDDEN_SCARY_RELATIONSHIP', 'HIDDEN_SCARY_CANON', 'HIDDEN_TOP_STATE', 'state_patch', 'tomorrow_seed', 'value_alignment', 'choice_icon']) {
  assert(!safetyProjectionJson.includes(hidden), `child-visible safety projection must exclude hidden machine metadata: ${hidden}`)
}
const safetyProjectionText = childVisibleStorySafetyText(projectionCandidate)
assert(safetyProjectionText.includes('Barg yerga tushdi.'), 'child-visible safety text must include visible vocabulary examples')
assert(!safetyProjectionText.includes('HIDDEN_SCARY_TOMORROW_SEED') && !safetyProjectionText.includes('HIDDEN_SCARY_CANON'), 'child-visible safety text must exclude hidden future-session and canon metadata')

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
  'fear_adjudication:${adjudication.category}',
  'childVisibleStorySafetyText(candidate)',
  'childVisibleStorySafetyProjection(candidate)',
]) {
  assert(provider.includes(fragment), `safety provider is missing bounded safety adjudication contract: ${fragment}`)
}

const firstRequest = provider.indexOf('const first = await requestSafetyEvaluation')
const firstValidation = provider.indexOf('safetyEvaluationConsistencyErrors(first)', firstRequest)
const correctedRequest = provider.indexOf('const corrected = await requestSafetyEvaluation', firstValidation)
const correctedValidation = provider.indexOf('safetyEvaluationConsistencyErrors(corrected)', correctedRequest)
const correctedAssignment = provider.indexOf('evaluation = corrected', correctedValidation)
const fearGate = provider.indexOf('needsInteractiveFearConfirmation(context, evaluation)', correctedAssignment)
const adjudicationRequest = provider.indexOf('const adjudication = await requestFearAdjudication', fearGate)
const adjudicationValidation = provider.indexOf('fearAdjudicationConsistencyErrors(adjudication', adjudicationRequest)
const severeReturn = provider.indexOf('if (adjudication.excessive_fear) {', adjudicationValidation)
const clearedReturn = provider.indexOf('return cleared', severeReturn)
assert(
  firstRequest >= 0 && firstValidation > firstRequest && correctedRequest > firstValidation && correctedValidation > correctedRequest && correctedAssignment > correctedValidation,
  'semantic safety must keep the bounded one-shot consistency correction and retain the corrected verdict for downstream adjudication',
)
assert(
  fearGate > correctedAssignment && adjudicationRequest > fearGate && adjudicationValidation > adjudicationRequest && severeReturn > adjudicationValidation && clearedReturn > severeReturn,
  'both initially consistent and consistency-corrected isolated Episode 1 excessive-fear verdicts must use one evidence-based narrow adjudication before they can be cleared',
)

if (failures.length > 0) {
  console.error('Story semantic safety verdict check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story semantic safety verdict check passed: general semantic safety remains fail-closed, consistency-corrected isolated Episode 1 fear still reaches one evidence-based narrow adjudication, severe fear remains blocked, and malformed adjudication fails closed.')
