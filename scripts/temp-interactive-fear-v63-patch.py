from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:160]!r}')
    p.write_text(text.replace(old, new, 1))

openai = 'supabase/functions/story-generate/openai.ts'
replace_once(
    openai,
    "  retryFeedback = '',\n  timeoutMs = 12_000,\n): Promise<SafetyEvaluation> => {\n  const prompts = buildSafetyPrompts(context, candidateJson)\n  const retryInstruction = retryFeedback\n    ? ` Previous structured verdict was rejected as internally inconsistent: ${retryFeedback}. Re-evaluate the exact same story from scratch and obey the verdict consistency contract.`\n    : ''",
    "  additionalInstruction = '',\n  timeoutMs = 12_000,\n): Promise<SafetyEvaluation> => {\n  const prompts = buildSafetyPrompts(context, candidateJson)\n  const retryInstruction = additionalInstruction.trim()\n    ? ` ${additionalInstruction.trim()}`\n    : ''",
)

old = """export const evaluateStorySafety = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
): Promise<SafetyEvaluation> => {
  const candidateJson = JSON.stringify(candidate)
  const first = await requestSafetyEvaluation(apiKey, model, context, candidateJson)
  const firstErrors = safetyEvaluationConsistencyErrors(first)
  if (firstErrors.length === 0) return first

  // This is a classifier-only correction, not a new story generation. Keep it
  // shorter than the primary safety window so even the worst bounded Story path
  // remains inside the 130s browser timeout and the hosted Edge Function ceiling.
  const second = await requestSafetyEvaluation(
    apiKey,
    model,
    context,
    candidateJson,
    firstErrors.join(','),
    8_000,
  )
  const secondErrors = safetyEvaluationConsistencyErrors(second)
  if (secondErrors.length > 0) throw new Error('openai_safety_evaluation_inconsistent')
  return second
}
"""
new = """const needsInteractiveFearConfirmation = (
  context: NormalizedStoryContext,
  evaluation: SafetyEvaluation,
): boolean => {
  if (!(context.storyMood === 'bedtime' && context.storyMode === 'series' && context.episodeIndex === 1)) return false
  if (evaluation.flags.excessive_fear !== true) return false
  return Object.entries(evaluation.flags).every(([flag, value]) => flag === 'excessive_fear' || value !== true)
}

export const evaluateStorySafety = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
): Promise<SafetyEvaluation> => {
  const candidateJson = JSON.stringify(candidate)
  const first = await requestSafetyEvaluation(apiKey, model, context, candidateJson)
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

  // A single independent confirmation protects interactive Episode 1 from a false positive where
  // an unfinished low-stakes choice boundary is mistaken for excessive fear. It never auto-clears
  // the flag: the second classifier sees the exact same candidate and may confirm fear or flag any
  // other safety issue. Maximum semantic-safety calls on this path remain two.
  const confirmed = await requestSafetyEvaluation(
    apiKey,
    model,
    context,
    candidateJson,
    'The previous internally consistent verdict flagged only excessive_fear. Independently re-evaluate the exact same story from scratch. For this technical Episode 1, do not treat an unfinished low-stakes goal or child choice boundary as fear by itself. Keep excessive_fear=true if the content actually contains sustained panic, threatening pursuit, abandonment, trapping, serious injury, frightening danger, or comparable age-inappropriate distress. Do not clear any real safety issue.',
    8_000,
  )
  const confirmedErrors = safetyEvaluationConsistencyErrors(confirmed)
  if (confirmedErrors.length > 0) throw new Error('openai_safety_evaluation_inconsistent')
  return confirmed
}
"""
replace_once(openai, old, new)

split = 'supabase/functions/story-generate/split-index.ts'
replace_once(
    split,
    "        'X-QISSA-Narrator-Model-Used': narratorModelUsed,\n        'X-QISSA-Provider-Calls': String(providerCalls),\n      })\n    }\n\n    const episode = buildFinalEpisode(context, candidate, safety)",
    "        'X-QISSA-Narrator-Model-Used': narratorModelUsed,\n        'X-QISSA-Provider-Calls': String(providerCalls),\n        'X-QISSA-Initial-Story-Words': String(initialStoryWords),\n        'X-QISSA-Final-Story-Words': String(wordCount(candidate.story_text)),\n      })\n    }\n\n    const episode = buildFinalEpisode(context, candidate, safety)",
)

check = 'scripts/check-story-ai-split.mjs'
p = Path(check)
text = p.read_text()
marker = "requireFragments('split safety session contract', repairProvider, ["
addition = """requireFragments('interactive fear confirmation', repairProvider, [
  'needsInteractiveFearConfirmation',
  'previous internally consistent verdict flagged only excessive_fear',
  'Maximum semantic-safety calls on this path remain two',
  'Do not clear any real safety issue',
])

""" + marker
if text.count(marker) != 1:
    raise SystemExit('split fear-confirmation marker mismatch')
p.write_text(text.replace(marker, addition, 1))

verdict_check = 'scripts/check-story-safety-verdict.mjs'
p = Path(verdict_check)
text = p.read_text()
old_loop = """for (const fragment of [
  'safetyVerdictContract',
  'The safety flags are exhaustive for this classifier',
  'If every flag is false, approved MUST be true',
  'Previous structured verdict was rejected as internally inconsistent',
  'safetyEvaluationConsistencyErrors(first)',
  'safetyEvaluationConsistencyErrors(second)',
  \"throw new Error('openai_safety_evaluation_inconsistent')\",
]) {
  assert(provider.includes(fragment), `safety provider is missing bounded consistency retry contract: ${fragment}`)
}

const firstRequest = provider.indexOf('const first = await requestSafetyEvaluation')
const firstValidation = provider.indexOf('safetyEvaluationConsistencyErrors(first)', firstRequest)
const secondRequest = provider.indexOf('const second = await requestSafetyEvaluation', firstValidation)
const secondValidation = provider.indexOf('safetyEvaluationConsistencyErrors(second)', secondRequest)
const failClosed = provider.indexOf(\"throw new Error('openai_safety_evaluation_inconsistent')\", secondValidation)
assert(
  firstRequest >= 0 && firstValidation > firstRequest && secondRequest > firstValidation && secondValidation > secondRequest && failClosed > secondValidation,
  'semantic safety must do at most one consistency-only recheck and then fail closed',
)
"""
new_loop = """for (const fragment of [
  'safetyVerdictContract',
  'The safety flags are exhaustive for this classifier',
  'If every flag is false, approved MUST be true',
  'Previous structured verdict was internally inconsistent',
  'safetyEvaluationConsistencyErrors(first)',
  'safetyEvaluationConsistencyErrors(corrected)',
  \"throw new Error('openai_safety_evaluation_inconsistent')\",
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
"""
if text.count(old_loop) != 1:
    raise SystemExit('semantic safety verdict check marker mismatch')
p.write_text(text.replace(old_loop, new_loop, 1))
