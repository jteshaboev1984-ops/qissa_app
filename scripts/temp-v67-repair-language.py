from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

# 1) Language guard must preserve canonical recurring names across language changes, without allowing arbitrary foreign prose.
lang = 'supabase/functions/story-generate/language.ts'
replace_once(
    lang,
    """const wordCount = (value: string): number => value.trim().split(/\\s+/u).filter(Boolean).length

export const hasSingleLanguageMismatch = (language: StoryLanguage, values: string[]): boolean => {
  const text = stripMachineTokens(values.filter(Boolean).join(' '))
""",
    """const wordCount = (value: string): number => value.trim().split(/\\s+/u).filter(Boolean).length

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\\]\\\\]/gu, '\\\\$&')

const stripAllowedForeignTerms = (value: string, allowedTerms: string[]): string => {
  let result = value
  for (const term of allowedTerms) {
    const normalized = term.trim()
    if (!normalized) continue
    result = result.replace(new RegExp(escapeRegExp(normalized), 'gu'), ' ')
  }
  return result
}

export const hasSingleLanguageMismatch = (
  language: StoryLanguage,
  values: string[],
  allowedForeignTerms: string[] = [],
): boolean => {
  const text = stripMachineTokens(stripAllowedForeignTerms(values.filter(Boolean).join(' '), allowedForeignTerms))
""",
)

safety = 'supabase/functions/story-generate/safety.ts'
replace_once(
    safety,
    """  if (hasSingleLanguageMismatch(context.language, candidateLanguageValues(value))) errors.push('story_language_mismatch')""",
    """  if (hasSingleLanguageMismatch(context.language, candidateLanguageValues(value), context.recurringCharacters)) errors.push('story_language_mismatch')""",
)

arch = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(
    arch,
    """  if (hasSingleLanguageMismatch(context.language, blueprintNaturalLanguageValues(value))) errors.push('blueprint_language_mismatch')""",
    """  if (hasSingleLanguageMismatch(context.language, blueprintNaturalLanguageValues(value), context.recurringCharacters)) errors.push('blueprint_language_mismatch')""",
)

# 2) Text repair accepts one explicit bounded retry instruction.
prompt = 'supabase/functions/story-generate/prompt.ts'
replace_once(
    prompt,
    """export const buildTextLengthRepairPrompts = (
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  validationErrors: string[],
) => {""",
    """export const buildTextLengthRepairPrompts = (
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  validationErrors: string[],
  retryFeedback = '',
) => {""",
)
replace_once(
    prompt,
    """    immutable_candidate_context: {
      title: candidate.title,""",
    """    retry_feedback: retryFeedback,
    immutable_candidate_context: {
      title: candidate.title,""",
)
replace_once(
    prompt,
    """    'For Episode 1 resolution repair, keep the selected consequence in the same evening immediately after the choice. Do not move it to tomorrow or the next morning; tomorrow_seed is future-session metadata only.',
    'Write only in the requested language and preserve bedtime tone and age fit.',""",
    """    'For Episode 1 resolution repair, keep the selected consequence in the same evening immediately after the choice. Do not move it to tomorrow or the next morning; tomorrow_seed is future-session metadata only.',
    'If retry_feedback is non-empty, the previous text repair failed deterministic validation. Rebuild the requested repair fields from the original immutable candidate and correct every listed repair-output failure. Do not preserve faulty wording from the rejected repair.',
    context.language === 'uz'
      ? 'For Uzbek repair prose, use natural Uzbek Latin script. Do not introduce Cyrillic text. Existing recurring-character identity labels supplied by immutable context remain unchanged.'
      : 'Keep repair prose strictly in the requested language while preserving established character identity labels.',
    'Write only in the requested language and preserve bedtime tone and age fit.',""",
)

openai = 'supabase/functions/story-generate/openai.ts'
replace_once(
    openai,
    """export const repairStoryCandidateTextLengths = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  validationErrors: string[],
): Promise<StoryCandidate> => {
  const prompts = buildTextLengthRepairPrompts(context, candidate, validationErrors)""",
    """export const repairStoryCandidateTextLengths = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  validationErrors: string[],
  retryFeedback = '',
): Promise<StoryCandidate> => {
  const prompts = buildTextLengthRepairPrompts(context, candidate, validationErrors, retryFeedback)""",
)

# 3) Orchestrator performs at most one explicit repair correction from the pre-repair candidate.
split = 'supabase/functions/story-generate/split-index.ts'
replace_once(
    split,
    """const isTextLengthRepairEligibleFailure = (errors: string[]): boolean =>
  errors.length > 0 &&
  errors.some((error) => textLengthValidationErrors.has(error)) &&
  errors.every((error) => textLengthValidationErrors.has(error) || error === 'missing_hero_token')

const compactFailureTrace""",
    """const isTextLengthRepairEligibleFailure = (errors: string[]): boolean =>
  errors.length > 0 &&
  errors.some((error) => textLengthValidationErrors.has(error)) &&
  errors.every((error) => textLengthValidationErrors.has(error) || error === 'missing_hero_token')

const textRepairCorrectionErrors = new Set([
  ...textLengthValidationErrors,
  'story_language_mismatch',
  'missing_hero_token',
  'choice_resolution_defers_to_future_session',
  'continuation_resets_before_resolution',
])

const isTextRepairCorrectionEligible = (errors: string[]): boolean =>
  errors.length > 0 && errors.every((error) => textRepairCorrectionErrors.has(error))

const compactFailureTrace""",
)
replace_once(
    split,
    """  let repairUsed = false
  let narratorRetryUsed = false
  let escalationUsed = false""",
    """  let repairUsed = false
  let repairRetryUsed = false
  let narratorRetryUsed = false
  let escalationUsed = false""",
)
old_block = """  if (validationErrors.length > 0 && isTextLengthRepairEligibleFailure(validationErrors)) {
    try {
      providerCalls += 1
      candidate = await repairStoryCandidateTextLengths(
        openAiApiKey,
        narratorModel,
        context,
        candidate,
        validationErrors,
      )
      repairUsed = true
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        lastFailureClass = 'validation'
        trace.push(`repair-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      lastFailureClass = providerFailureClass(reason)
      trace.push(`repair:${lastFailureClass}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': 'text-length',
        'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      })
    }
  }
"""
new_block = """  if (validationErrors.length > 0 && isTextLengthRepairEligibleFailure(validationErrors)) {
    const repairBaseCandidate = candidate
    const repairBaseErrors = [...validationErrors]
    try {
      providerCalls += 1
      candidate = await repairStoryCandidateTextLengths(
        openAiApiKey,
        narratorModel,
        context,
        repairBaseCandidate,
        repairBaseErrors,
      )
      repairUsed = true
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        lastFailureClass = 'validation'
        trace.push(`repair-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
      }

      if (validationErrors.length > 0 && isTextRepairCorrectionEligible(validationErrors)) {
        providerCalls += 1
        repairRetryUsed = true
        const repairRetryFeedback = [
          `Previous text repair failed deterministic validation: ${validationErrors.join(', ')}.`,
          `Rejected repair metrics: ${candidateValidationMetrics(candidate).join(', ')}.`,
          'Rebuild the repair from the ORIGINAL immutable candidate, not from the rejected repaired text.',
          'Keep every existing plot beat, character identity, choice, state patch and branch consequence unchanged.',
          context.language === 'uz'
            ? 'Use natural Uzbek Latin script in all newly written prose. Do not emit Cyrillic characters unless they are part of an already-established recurring-character name supplied by memory.'
            : 'Use only the requested story language in newly written prose, apart from immutable established recurring-character names.',
          'If missing_hero_token is listed, include literal {{HERO}} naturally in final story_text.',
          'If a future-session/reset error is listed, keep the repaired action in the current bedtime evening; tomorrow_seed is not Episode 2 material.',
        ].join(' ')
        candidate = await repairStoryCandidateTextLengths(
          openAiApiKey,
          narratorModel,
          context,
          repairBaseCandidate,
          repairBaseErrors,
          repairRetryFeedback,
        )
        validationErrors = validateCandidate(context, candidate)
        if (validationErrors.length > 0) {
          lastFailureClass = 'validation'
          trace.push(`repair-retry-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      lastFailureClass = providerFailureClass(reason)
      trace.push(`${repairRetryUsed ? 'repair-retry' : 'repair'}:${lastFailureClass}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': 'text-length',
        'X-QISSA-Repair-Retry-Used': repairRetryUsed ? 'true' : 'false',
        'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      })
    }
  }
"""
replace_once(split, old_block, new_block)
# Add repair retry metadata to post-repair validation fallback and success/safety paths by placing it beside generation repair headers.
p = Path(split)
text = p.read_text()
needle = "'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',"
count = text.count(needle)
if count < 3:
    raise SystemExit(f'expected multiple generation-repair metadata sites, got {count}')
text = text.replace(needle, needle + "\n      'X-QISSA-Repair-Retry-Used': repairRetryUsed ? 'true' : 'false',")
p.write_text(text)

# 4) Tests for canonical names and bounded repair retry.
test = Path('scripts/check-story-ai-split.mjs')
t = test.read_text()
anchor = "requireLanguageGuard(!hasSingleLanguageMismatch('uz', ['{{HERO}} o‘rmonda yurdi va mayin chiroqni ko‘rdi.']), 'UZ must accept Uzbek Latin prose')\n"
addition = anchor + """requireLanguageGuard(!hasSingleLanguageMismatch('uz', ['Рыжик Malika bilan o‘rmonda yurdi.'], ['Рыжик']), 'UZ must allow one established Cyrillic recurring-character identity label')
requireLanguageGuard(hasSingleLanguageMismatch('uz', ['Рыжик Malika bilan yurdi. Потом стало тихо.'], ['Рыжик']), 'UZ must still reject unrelated Cyrillic prose after stripping an allowed recurring name')
requireLanguageGuard(!hasSingleLanguageMismatch('kz', ['Momiq орманда жай жүрді.'], ['Momiq']), 'KZ must allow an established Latin recurring-character identity label')
"""
if t.count(anchor) != 1:
    raise SystemExit('language regression anchor mismatch')
t = t.replace(anchor, addition, 1)
frag = "  'isTextLengthRepairEligibleFailure',\n"
repl = frag + "  'isTextRepairCorrectionEligible',\n  'repairRetryUsed = true',\n  'Previous text repair failed deterministic validation',\n  \"'X-QISSA-Repair-Retry-Used'\",\n"
if t.count(frag) != 1:
    raise SystemExit('repair orchestration test marker mismatch')
t = t.replace(frag, repl, 1)
frag2 = "  'tomorrow_seed is future-session metadata only',\n"
repl2 = frag2 + "  'retry_feedback: retryFeedback',\n  'previous text repair failed deterministic validation',\n  'For Uzbek repair prose, use natural Uzbek Latin script',\n"
if t.count(frag2) != 1:
    raise SystemExit('repair prompt test marker mismatch')
t = t.replace(frag2, repl2, 1)
# Require context recurring names to be passed to both language validators.
frag3 = "  \"errors.push('story_language_mismatch')\",\n"
repl3 = frag3 + "  'context.recurringCharacters',\n"
if t.count(frag3) != 1:
    raise SystemExit('candidate language validation test marker mismatch')
t = t.replace(frag3, repl3, 1)
test.write_text(t)

# Story-AI safety static provider signature should acknowledge repair retry feedback.
safety_test = Path('scripts/check-story-ai-safety.mjs')
st = safety_test.read_text()
frag = "  'buildTextLengthRepairPrompts',\n"
repl = frag + "  'retryFeedback',\n"
if st.count(frag) != 1:
    raise SystemExit('story-ai safety provider marker mismatch')
st = st.replace(frag, repl, 1)
safety_test.write_text(st)
