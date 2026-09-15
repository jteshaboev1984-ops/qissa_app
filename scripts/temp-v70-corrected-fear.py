from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

openai = 'supabase/functions/story-generate/openai.ts'
replace_once(
    openai,
    """  const first = await requestSafetyEvaluation(apiKey, model, context, candidateJson)
  const firstErrors = safetyEvaluationConsistencyErrors(first)

  if (firstErrors.length > 0) {
    // This is a classifier-only consistency correction, not a new story generation. Keep it
    // shorter than the primary safety window so even the worst bounded Story path remains bounded.
    const corrected = await requestSafetyEvaluation(
      apiKey,
      model,
      context,
      candidateJson,
      `Previous structured verdict was internally inconsistent: ${firstErrors.join(',')}. Re-evaluate the exact same story from scratch and obey the verdict consistency contract.`,
      8_000,
    )
    const correctedErrors = safetyEvaluationConsistencyErrors(corrected)
    if (correctedErrors.length > 0) throw new Error('openai_safety_evaluation_inconsistent')
    return corrected
  }

  if (!needsInteractiveFearConfirmation(context, first)) return first
""",
    """  const first = await requestSafetyEvaluation(apiKey, model, context, candidateJson)
  const firstErrors = safetyEvaluationConsistencyErrors(first)
  let evaluation = first

  if (firstErrors.length > 0) {
    // This is a classifier-only consistency correction, not a new story generation. Keep it
    // shorter than the primary safety window so even the worst bounded Story path remains bounded.
    const corrected = await requestSafetyEvaluation(
      apiKey,
      model,
      context,
      candidateJson,
      `Previous structured verdict was internally inconsistent: ${firstErrors.join(',')}. Re-evaluate the exact same story from scratch and obey the verdict consistency contract.`,
      8_000,
    )
    const correctedErrors = safetyEvaluationConsistencyErrors(corrected)
    if (correctedErrors.length > 0) throw new Error('openai_safety_evaluation_inconsistent')
    evaluation = corrected
  }

  if (!needsInteractiveFearConfirmation(context, evaluation)) return evaluation
""",
)
replace_once(
    openai,
    """      ...first,
      notes: [`fear_adjudication:${adjudication.category}`],
""",
    """      ...evaluation,
      notes: [`fear_adjudication:${adjudication.category}`],
""",
)
replace_once(
    openai,
    "    flags: { ...first.flags, excessive_fear: false },\n",
    "    flags: { ...evaluation.flags, excessive_fear: false },\n",
)

# Static regression: a corrected isolated-fear verdict must flow through the same adjudication gate.
test = Path('scripts/check-story-safety-verdict.mjs')
t = test.read_text()
old = """const correctedValidation = provider.indexOf('safetyEvaluationConsistencyErrors(corrected)', correctedRequest)
const correctedReturn = provider.indexOf('return corrected', correctedValidation)
const fearGate = provider.indexOf('needsInteractiveFearConfirmation(context, first)', correctedReturn)
const adjudicationRequest = provider.indexOf('const adjudication = await requestFearAdjudication', fearGate)
const adjudicationValidation = provider.indexOf('fearAdjudicationConsistencyErrors(adjudication', adjudicationRequest)
const severeReturn = provider.indexOf('if (adjudication.excessive_fear) {', adjudicationValidation)
const clearedReturn = provider.indexOf('return cleared', severeReturn)
assert(
  firstRequest >= 0 && firstValidation > firstRequest && correctedRequest > firstValidation && correctedValidation > correctedRequest && correctedReturn > correctedValidation,
  'semantic safety must keep the bounded one-shot consistency correction and return before any fear adjudication',
)
assert(
  fearGate > correctedReturn && adjudicationRequest > fearGate && adjudicationValidation > adjudicationRequest && severeReturn > adjudicationValidation && clearedReturn > severeReturn,
  'isolated Episode 1 excessive-fear verdict must use exactly one evidence-based narrow adjudication before it can be cleared',
)
"""
new = """const correctedValidation = provider.indexOf('safetyEvaluationConsistencyErrors(corrected)', correctedRequest)
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
"""
if t.count(old) != 1:
    raise SystemExit(f'safety verdict ordering block mismatch: {t.count(old)}')
t = t.replace(old, new, 1)
t = t.replace(
    "console.log('Story semantic safety verdict check passed: general semantic safety remains fail-closed, isolated Episode 1 fear uses one evidence-based narrow adjudication, severe fear remains blocked, and malformed adjudication fails closed.')",
    "console.log('Story semantic safety verdict check passed: general semantic safety remains fail-closed, consistency-corrected isolated Episode 1 fear still reaches one evidence-based narrow adjudication, severe fear remains blocked, and malformed adjudication fails closed.')",
)
test.write_text(t)
