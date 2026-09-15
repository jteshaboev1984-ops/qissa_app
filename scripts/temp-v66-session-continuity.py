from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

# 1) Deterministic candidate validation: keep one new_friend, keep Episode 1 resolution in the same bedtime session.
safety = 'supabase/functions/story-generate/safety.ts'
replace_once(
    safety,
    """const validatePatch = (patch: unknown): boolean =>
  isRecord(patch) &&
  typeof patch.last_event === 'string' &&
  (patch.new_friend === null || typeof patch.new_friend === 'string') &&""",
    """export const newFriendIsAtomic = (value: unknown): boolean => {
  if (value === null) return true
  if (typeof value !== 'string') return false
  const normalized = value.trim()
  if (!normalized || normalized.length > 48) return false
  if (/[;,/|]/u.test(normalized)) return false
  return !/\\s(?:va|and|и|және)\\s/iu.test(normalized)
}

const validatePatch = (patch: unknown): boolean =>
  isRecord(patch) &&
  typeof patch.last_event === 'string' &&
  newFriendIsAtomic(patch.new_friend) &&""",
)
replace_once(
    safety,
    """const startsWithNextDayReset = (context: NormalizedStoryContext, text: string) => {
  if (!isFiveToSevenBedtimeSeries(context) || context.episodeIndex !== 2) return false
  const first = text.trim().slice(0, 80).toLocaleLowerCase()
  return /^утром\\b/u.test(first) || /^на следующее утро\\b/u.test(first) || /^tongda\\b/u.test(first) || /^ertasi tongda\\b/u.test(first) || /^таңертең\\b/u.test(first)
}
""",
    """const futureSessionPatterns: Record<string, RegExp[]> = {
  ru: [/\\bзавтра\\b/iu, /\\bутром\\b/iu, /\\bна\\s+следующ(?:ий|ее)\\s+(?:день|утро)\\b/iu],
  uz: [/\\bertaga\\b/iu, /\\bertalab\\b/iu, /\\bertasi\\s+(?:kuni|tongda)\\b/iu, /\\bkeyingi\\s+kuni\\b/iu],
  kz: [/\\bертең\\b/iu, /\\bтаңертең\\b/iu, /\\bкелесі\\s+күні\\b/iu],
}

export const choiceResolutionDefersToFutureSession = (language: string, text: string): boolean =>
  (futureSessionPatterns[language] ?? []).some((pattern) => pattern.test(text))

const startsWithNextDayReset = (context: NormalizedStoryContext, text: string) => {
  if (!isFiveToSevenBedtimeSeries(context) || context.episodeIndex !== 2) return false
  const firstParagraph = paragraphs(text)[0] ?? ''
  return choiceResolutionDefersToFutureSession(context.language, firstParagraph)
}
""",
)
replace_once(
    safety,
    """      } else if (isFiveToSevenBedtimeSeries(context) && context.episodeIndex === 1) {
        const resolutionWords = wordCount(choice.resolution_text)
        if (choice.resolution_text.length > 360) errors.push('choice_resolution_too_long')
        if (resolutionWords < 25) errors.push('choice_resolution_too_short')
        if (resolutionWords > 60) errors.push('choice_resolution_too_long')
      }
      if (typeof choice.tomorrow_seed !== 'string' || choice.tomorrow_seed.length < 8) errors.push('invalid_tomorrow_seed')""",
    """      } else if (isFiveToSevenBedtimeSeries(context) && context.episodeIndex === 1) {
        const resolutionWords = wordCount(choice.resolution_text)
        if (choice.resolution_text.length > 360) errors.push('choice_resolution_too_long')
        if (resolutionWords < 25) errors.push('choice_resolution_too_short')
        if (resolutionWords > 60) errors.push('choice_resolution_too_long')
        if (choiceResolutionDefersToFutureSession(context.language, choice.resolution_text)) {
          errors.push('choice_resolution_defers_to_future_session')
        }
      }
      if (typeof choice.tomorrow_seed !== 'string' || choice.tomorrow_seed.length < 8) errors.push('invalid_tomorrow_seed')""",
)

# 2) Architect/Narrator contracts: singular new_friend and same-night Episode 1 -> Episode 2 continuity.
arch = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(
    arch,
    """const patchIsValid = (patch: unknown): patch is CandidatePatch =>
  isRecord(patch) &&
  typeof patch.last_event === 'string' &&
  (patch.new_friend === null || typeof patch.new_friend === 'string') &&""",
    """const newFriendPatchValueIsValid = (value: unknown): boolean => {
  if (value === null) return true
  if (typeof value !== 'string') return false
  const normalized = value.trim()
  if (!normalized || normalized.length > 48) return false
  if (/[;,/|]/u.test(normalized)) return false
  return !/\\s(?:va|and|и|және)\\s/iu.test(normalized)
}

const patchIsValid = (patch: unknown): patch is CandidatePatch =>
  isRecord(patch) &&
  typeof patch.last_event === 'string' &&
  newFriendPatchValueIsValid(patch.new_friend) &&""",
)
replace_once(
    arch,
    """    'Keep state compact. Top-level state contains only durable facts true before the child choice. Choice state contains only the consequence of that specific branch.',
    'Never encode speculation, moral judgment, child identity labels, sensitive personal data, punishment or permanent negative traits in state.',""",
    """    'Keep state compact. Top-level state contains only durable facts true before the child choice. Choice state contains only the consequence of that specific branch.',
    'state_patch.new_friend is singular. It may contain exactly one newly introduced recurring character name or null. Never join multiple characters with commas, va, и, and, және or another list separator. If several characters appear, choose at most one character that truly needs to recur and represent other relationships through relationship_updates.',
    'Never encode speculation, moral judgment, child identity labels, sensitive personal data, punishment or permanent negative traits in state.',""",
)
replace_once(
    arch,
    """    'For Episode 1, plan 5-7 causal beats ending at one explicit decision point. Do not resolve either branch before the decision.',
    'When Episode 1 starts a later bedtime session in an existing series, use remembered canon, relationships and prior consequences as continuity callbacks, then introduce one fresh child-scale goal for tonight. Do not replay or reopen a problem that the previous bedtime session already solved.',""",
    """    'For Episode 1, plan 5-7 causal beats ending at one explicit decision point. Do not resolve either branch before the decision.',
    'Each Episode 1 resolution_goal is the immediate same-evening consequence shown right after the child chooses. Do not defer that selected action or its payoff to tomorrow, morning or the next day. tomorrow_seed is reserved only as a possible hook for a future bedtime session after tonight Episode 2 is fully complete; it is never an instruction for technical Episode 2.',
    'When Episode 1 starts a later bedtime session in an existing series, use remembered canon, relationships and prior consequences as continuity callbacks, then introduce one fresh child-scale goal for tonight. Do not replay or reopen a problem that the previous bedtime session already solved.',""",
)
replace_once(
    arch,
    """    'For Episode 2, continue after the already-confirmed resolution bridge, use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',""",
    """    'For Episode 2, continue immediately after the already-confirmed resolution bridge in the same bedtime session and same evening unless the established scene itself uses another same-session time. Never jump to tomorrow, morning or the next day. The latest confirmed choice tomorrow_seed belongs to a future bedtime session and must not become an Episode 2 opening beat. Use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',""",
)
replace_once(
    arch,
    """    'For Episode 2, begin after the confirmed choice resolution already happened. Do not replay that action. Resolve the same central goal and finish calmly without a cliffhanger.',""",
    """    'For Episode 2, begin immediately after the confirmed choice resolution already happened, in the same bedtime session. Do not replay that action and do not jump to tomorrow, morning or the next day. Treat any tomorrow_seed in memory as a deferred future-session hook, not as Episode 2 material. Resolve the same central goal and finish calmly without a cliffhanger.',""",
)
replace_once(
    arch,
    """    'For each Episode 1 choice, write exactly one resolution_text matching its resolution_goal and state consequence. Aim for 30-45 words and stay below 320 characters.',""",
    """    'For each Episode 1 choice, write exactly one resolution_text matching its resolution_goal and state consequence. The resolution happens immediately after the choice in the same evening; never say tomorrow, morning, next day, ertaga, ertalab, keyingi kuni, завтра, утром, ертең or таңертең in resolution_text. Aim for 30-45 words and stay below 320 characters.',""",
)

# 3) Bounded orchestration: narrator retry explicitly restores HERO; length repair may finish a retry that still has HERO+length failures.
split = 'supabase/functions/story-generate/split-index.ts'
replace_once(
    split,
    """const isTextLengthOnlyFailure = (errors: string[]): boolean =>
  errors.length > 0 && errors.every((error) => textLengthValidationErrors.has(error))
""",
    """const isTextLengthOnlyFailure = (errors: string[]): boolean =>
  errors.length > 0 && errors.every((error) => textLengthValidationErrors.has(error))

const isTextLengthRepairEligibleFailure = (errors: string[]): boolean =>
  errors.length > 0 &&
  errors.some((error) => textLengthValidationErrors.has(error)) &&
  errors.every((error) => textLengthValidationErrors.has(error) || error === 'missing_hero_token')
""",
)
replace_once(
    split,
    """        'For russian_hero_requires_rewrite, keep {{HERO}} only as nominative subject or direct address and rewrite every case/preposition or gendered-past-tense construction around the token.',
        'For visible_safety_language, remove any child-visible explanation that a choice, option or possibility is safe, good, calm, correct or morally preferred; show the story consequences without evaluating the menu.',""",
    """        'For russian_hero_requires_rewrite, keep {{HERO}} only as nominative subject or direct address and rewrite every case/preposition or gendered-past-tense construction around the token.',
        'For missing_hero_token, restore the literal {{HERO}} token naturally inside story_text as the in-world protagonist. Do not invent a real child name and do not leave the hero only in metadata.',
        'For choice_resolution_defers_to_future_session, keep each Episode 1 resolution in the same evening immediately after the child choice; remove tomorrow/morning/next-day transitions from resolution_text. tomorrow_seed remains separate future-session metadata.',
        'For visible_safety_language, remove any child-visible explanation that a choice, option or possibility is safe, good, calm, correct or morally preferred; show the story consequences without evaluating the menu.',""",
)
replace_once(
    split,
    """  if (validationErrors.length > 0 && isTextLengthOnlyFailure(validationErrors)) {""",
    """  if (validationErrors.length > 0 && isTextLengthRepairEligibleFailure(validationErrors)) {""",
)

# 4) Text-length repair can restore HERO while repairing length/coda, without changing state.
prompt = 'supabase/functions/story-generate/prompt.ts'
replace_once(
    prompt,
    """    'The hero name remains the literal token {{HERO}}. Never invent or expose a real child name. In Russian, use {{HERO}} only as a nominative subject or direct address and use grammatically invariant phrasing such as present-tense action; never put the token after a preposition or directly before a gendered past-tense verb.',
    'Write only in the requested language and preserve bedtime tone and age fit.',""",
    """    'The hero name remains the literal token {{HERO}}. Never invent or expose a real child name. If validation_errors includes missing_hero_token, the repaired story_rewrite or story_expansion must naturally contain {{HERO}} as the in-world protagonist so the final story_text contains the token. In Russian, use {{HERO}} only as a nominative subject or direct address and use grammatically invariant phrasing such as present-tense action; never put the token after a preposition or directly before a gendered past-tense verb.',
    'For Episode 1 resolution repair, keep the selected consequence in the same evening immediately after the choice. Do not move it to tomorrow or the next morning; tomorrow_seed is future-session metadata only.',
    'Write only in the requested language and preserve bedtime tone and age fit.',""",
)

# 5) Regression coverage.
test = Path('scripts/check-story-ai-safety.mjs')
t = test.read_text()
old_import = "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, russianHeroTokenNeedsRewrite, scanRuleBasedSafety, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'"
new_import = "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, choiceResolutionDefersToFutureSession, newFriendIsAtomic, russianHeroTokenNeedsRewrite, scanRuleBasedSafety, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'"
if t.count(old_import) != 1:
    raise SystemExit('check-story-ai-safety.mjs import marker mismatch')
t = t.replace(old_import, new_import, 1)
anchor = "requireRegression(realUzFearScan.excessive_fear, 'real Uzbek blood/fear language must remain blocked')\n"
addition = anchor + """
requireRegression(newFriendIsAtomic('Momiq'), 'one new recurring character name must be allowed')
requireRegression(newFriendIsAtomic('Qizil Shapkacha'), 'one multi-word character name must be allowed')
requireRegression(!newFriendIsAtomic('Momiq, Chirqiroq va Tikan'), 'new_friend must reject a list of multiple characters')
requireRegression(!newFriendIsAtomic('Momiq va Tikan'), 'Uzbek va must not join multiple names inside singular new_friend')
requireRegression(choiceResolutionDefersToFutureSession('uz', 'Momiq tugunni topdi va ertaga uni do‘stlariga ko‘rsatmoqchi bo‘ldi.'), 'Uzbek Episode 1 resolution must reject an ertaga deferral')
requireRegression(choiceResolutionDefersToFutureSession('ru', 'Рыжик нашёл узелок и решил показать его завтра.'), 'Russian Episode 1 resolution must reject a tomorrow deferral')
requireRegression(!choiceResolutionDefersToFutureSession('uz', 'Malika va Momiq tugunni topib, bezakni shu yerning o‘zida tugatdi.'), 'same-evening Uzbek resolution must remain allowed')
"""
if t.count(anchor) != 1:
    raise SystemExit('check-story-ai-safety.mjs regression anchor mismatch')
t = t.replace(anchor, addition, 1)
test.write_text(t)

split_test = Path('scripts/check-story-ai-split.mjs')
s = split_test.read_text()
frag = "  'Character identity is immutable',\n"
repl = frag + "  'state_patch.new_friend is singular',\n  'tomorrow_seed is reserved only as a possible hook for a future bedtime session',\n  'same bedtime session and same evening',\n  'never say tomorrow, morning, next day, ertaga, ertalab, keyingi kuni',\n"
if s.count(frag) != 1:
    raise SystemExit('check-story-ai-split architecture marker mismatch')
s = s.replace(frag, repl, 1)
frag2 = "  'Previous narration failed deterministic validation',\n"
repl2 = frag2 + "  'For missing_hero_token',\n  'For choice_resolution_defers_to_future_session',\n  'isTextLengthRepairEligibleFailure',\n"
if s.count(frag2) != 1:
    raise SystemExit('check-story-ai-split orchestrator marker mismatch')
s = s.replace(frag2, repl2, 1)
frag3 = "  'same Episode 2 plot, same selected-choice consequence',\n"
repl3 = frag3 + "  'validation_errors includes missing_hero_token',\n  'tomorrow_seed is future-session metadata only',\n"
if s.count(frag3) != 1:
    raise SystemExit('check-story-ai-split repair marker mismatch')
s = s.replace(frag3, repl3, 1)
split_test.write_text(s)
