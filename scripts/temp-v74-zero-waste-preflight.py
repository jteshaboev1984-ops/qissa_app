from pathlib import Path
import re


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def replace_once(path, old, new, label):
    text = read(path)
    if old not in text:
        raise SystemExit(f'{label}: exact fragment missing')
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, replacement, label, flags=0):
    text = read(path)
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: regex replacement count={count}')
    write(path, updated)


# 1) Series identity is authoritative. A language/settings change must not rename an existing hero,
# and any meaningful compact series state must disable first-session fixed-cast fallbacks.
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "  const customName = heroType === 'custom' ? safeName(selections.customHeroName) : null\n  const stateName = safeName(seriesState.mainCharacter)\n  const heroName = customName ?? stateName ?? defaultHeroNames[language][heroType]\n",
    "  const customName = heroType === 'custom' ? safeName(selections.customHeroName) : null\n  const stateName = safeName(seriesState.mainCharacter)\n  // seriesState.mainCharacter is canonical once a series exists; UI language/name selections must not silently rename it.\n  const heroName = stateName ?? customName ?? defaultHeroNames[language][heroType]\n",
    'canonical hero precedence',
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "  const recurringCharacters = Array.isArray(seriesState.recurringCharacters)\n    ? seriesState.recurringCharacters\n        .map((item) => redactHeroName(compactText(item, 48), heroName))\n        .filter(Boolean)\n        .slice(0, 8)\n    : []\n\n  return {\n",
    "  const recurringCharacters = Array.isArray(seriesState.recurringCharacters)\n    ? seriesState.recurringCharacters\n        .map((item) => redactHeroName(compactText(item, 48), heroName))\n        .filter(Boolean)\n        .slice(0, 8)\n    : []\n  const lastEpisodeSummary = redactHeroName(compactText(seriesState.lastEpisodeSummary, 300), heroName)\n  const activeArc = redactHeroName(compactText(seriesState.activeArc, 240), heroName)\n  const relationshipState = compactStringRecord(seriesState.relationshipState, heroName)\n  const canonState = compactStringRecord(seriesState.canonState, heroName)\n  const hasSeriesMemory =\n    choiceHistory.length > 0 ||\n    recurringCharacters.length > 0 ||\n    Boolean(lastEpisodeSummary) ||\n    Boolean(activeArc) ||\n    Object.keys(canonState).length > 0 ||\n    Object.keys(relationshipState).length > 0\n\n  return {\n",
    'series memory derivation',
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "    hasSeriesMemory: choiceHistory.length > 0 || Object.keys(compactStringRecord(seriesState.canonState, heroName)).length > 0 || Object.keys(compactStringRecord(seriesState.relationshipState, heroName)).length > 0,\n    recurringCharacters,\n    lastEpisodeSummary: redactHeroName(compactText(seriesState.lastEpisodeSummary, 300), heroName),\n    activeArc: redactHeroName(compactText(seriesState.activeArc, 240), heroName),\n    relationshipState: compactStringRecord(seriesState.relationshipState, heroName),\n    canonState: compactStringRecord(seriesState.canonState, heroName),\n",
    "    hasSeriesMemory,\n    recurringCharacters,\n    lastEpisodeSummary,\n    activeArc,\n    relationshipState,\n    canonState,\n",
    'normalized memory fields',
)

# 2) Fixed closed-beta reference casts are only valid for a genuinely fresh first session.
replace_once(
    'supabase/functions/story-generate/storyCoreReference.ts',
    "  if (context.stylePackId !== stylePackId) return null\n  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null\n  return context.language === 'ru' || context.language === 'uz' ? context.language : null\n",
    "  if (context.stylePackId !== stylePackId) return null\n  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null\n  if (context.hasSeriesMemory || context.sessionIndex !== 1 || context.recurringCharacters.length > 0) return null\n  return context.language === 'ru' || context.language === 'uz' ? context.language : null\n",
    'closed beta fresh-session guard',
)

# 3) Fallbacks must preserve canonical identities instead of injecting a language-specific fixed cast.
replace_once(
    'supabase/functions/story-generate/fallback.ts',
    "const genericOpeningTail = localized(\n  'Перед {{HERO}} было два спокойных пути. Рядом ждали друзья, а вокруг оставалось достаточно времени, чтобы подумать и выбрать один из них.',\n  '{{HERO}} oldida ikki sokin yo‘l bor edi. Yonida do‘stlari kutib turardi, o‘ylab, ulardan birini tanlash uchun yetarli vaqt bor edi.',\n  '{{HERO}} алдында екі тыныш жол тұрды. Қасында достары күтіп тұрды, ойланып, соның бірін таңдауға уақыт жеткілікті еді.',\n)\n\n",
    "const genericOpeningTail = localized(\n  'Перед {{HERO}} было два спокойных пути. Рядом ждали друзья, а вокруг оставалось достаточно времени, чтобы подумать и выбрать один из них.',\n  '{{HERO}} oldida ikki sokin yo‘l bor edi. Yonida do‘stlari kutib turardi, o‘ylab, ulardan birini tanlash uchun yetarli vaqt bor edi.',\n  '{{HERO}} алдында екі тыныш жол тұрды. Қасында достары күтіп тұрды, ойланып, соның бірін таңдауға уақыт жеткілікті еді.',\n)\n\nconst recurringCharacterLine = (context: NormalizedStoryContext): string => {\n  const names = context.recurringCharacters.slice(0, 3).join(', ')\n  if (!names) return ''\n  if (context.language === 'ru') return `Рядом снова были знакомые друзья: ${names}.`\n  if (context.language === 'uz') return `Tanish do‘stlar ham yana shu yerda edi: ${names}.`\n  return `Таныс достар да қайтадан осында еді: ${names}.`\n}\n\nconst identitySafeContinuationText = (context: NormalizedStoryContext): string => {\n  const names = context.recurringCharacters.slice(0, 3).join(', ')\n  if (context.language === 'ru') {\n    return `{{HERO}} продолжает вечернюю историю с того же места. ${names ? `Рядом остаются знакомые друзья: ${names}.` : 'Рядом остаются уже знакомые друзья.'} Сделанный несколько минут назад выбор уже дал первый результат, поэтому никто не начинает новое приключение и не меняет общее дело.\\n\\nДрузья спокойно доводят начатое до конца. Один помогает держать нужную вещь, другой замечает маленькую деталь, а {{HERO}} следит, чтобы никто не спешил. Всё происходит рядом, в знакомом месте, и каждый шаг связан с тем, что уже было начато раньше этим вечером.\\n\\nКогда главное дело закончено, компания ещё немного остаётся вместе. Друзья проверяют, что всё на месте, тихо радуются результату и убирают лишние вещи. Никакой новой загадки не появляется.\\n\\n{{HERO}} смотрит на друзей и понимает, что вечер можно завершать. Вокруг становится тише, голоса звучат всё мягче, и знакомое место готовится ко сну. Друзья прощаются до следующей встречи, сохраняя именно ту общую историю, которую уже начали.`\n  }\n  if (context.language === 'uz') {\n    return `{{HERO}} kechki hikoyani aynan to‘xtagan joyidan davom ettirdi. ${names ? `Tanish do‘stlar ham shu yerda edi: ${names}.` : 'Oldindan tanish do‘stlar ham shu yerda edi.'} Bir necha daqiqa oldin qilingan tanlov allaqachon natija bera boshlagan, shuning uchun hech kim yangi sarguzasht boshlamadi.\\n\\nDo‘stlar boshlangan ishni birga va shoshmasdan tugatdi. Biri kerakli narsani ushlab turdi, boshqasi mayda bir detalni ko‘rdi, {{HERO}} esa hamma birga qolishiga e’tibor berdi. Har bir qadam shu oqshom avval boshlangan voqeaga bog‘liq edi.\\n\\nAsosiy ish tugagach, ular yana bir oz birga qoldi. Hamma narsa joyida ekanini tekshirdi, natijadan sekin quvondi va ortiqcha narsalarni yig‘ishtirdi. Yangi muammo ham, yangi sir ham paydo bo‘lmadi.\\n\\n{{HERO}} do‘stlariga qarab, oqshomni endi tinch yakunlash mumkinligini bildi. Atrof asta jimidi, ovozlar mayinlashdi. Do‘stlar keyingi uchrashuvgacha xayrlashdi va shu kecha boshlangan tanish hikoya xotirada qoldi.`\n  }\n  return `{{HERO}} кешкі оқиғаны дәл тоқтаған жерінен жалғастырды. ${names ? `Таныс достар да осында еді: ${names}.` : 'Бұрыннан таныс достар да осында еді.'} Бірнеше минут бұрын жасалған таңдау алғашқы нәтижесін берген, сондықтан ешкім жаңа оқиға бастамады.\\n\\nДостар басталған істі асықпай бірге аяқтады. Біреуі керек затты ұстап тұрды, екіншісі кішкентай бөлшекті байқады, ал {{HERO}} бәрінің бірге болғанын қадағалады. Әр қадам осы кеште бұрын басталған іске байланысты болды.\\n\\nНегізгі іс біткен соң, олар тағы біраз бірге отырды. Бәрінің орнында екенін тексеріп, нәтижеге тыныш қуанды. Жаңа мәселе де, жаңа жұмбақ та пайда болмады.\\n\\n{{HERO}} достарына қарап, кешті енді тыныш аяқтауға болатынын түсінді. Айнала біртіндеп тынды, дауыстар бәсеңдеді. Достар келесі кездесуге дейін қоштасып, осы кеште басталған таныс оқиғаны есте сақтады.`\n}\n\nconst identitySafeContinuationPatch = (): CandidatePatch => ({\n  last_event: 'continued_saved_choice',\n  new_friend: null,\n  hero_trait: 'kind_and_attentive',\n  open_arc: null,\n  relationship_updates: [],\n  canon_updates: [],\n})\n\n",
    'identity-safe fallback helpers',
)
replace_once(
    'supabase/functions/story-generate/fallback.ts',
    "  if (context.isContinuation) {\n    const choiceId = context.choiceHistory[context.choiceHistory.length - 1]?.choice_id ?? ''\n",
    "  if (context.isContinuation && context.hasSeriesMemory) {\n    const candidate: StoryCandidate = {\n      title: referenceEpisodeTitle(context, world.titleTwo[language]),\n      story_text: identitySafeContinuationText(context),\n      choices: [],\n      state_patch: identitySafeContinuationPatch(),\n      vocabulary: [],\n      nextEpisodePreview: '',\n    }\n    return buildFinalEpisode(context, candidate, {\n      approved: true,\n      risk_level: 'low',\n      flags: emptySafetyFlags(),\n      required_action: 'fallback',\n    })\n  }\n\n  if (context.isContinuation) {\n    const choiceId = context.choiceHistory[context.choiceHistory.length - 1]?.choice_id ?? ''\n",
    'identity-safe continuation route',
)
replace_once(
    'supabase/functions/story-generate/fallback.ts',
    "  const genericOpening = `${world.opening[language]} ${genericOpeningTail[language]}`\n",
    "  const genericOpening = `${world.opening[language]} ${recurringCharacterLine(context)} ${genericOpeningTail[language]}`.replace(/\\s+/gu, ' ').trim()\n",
    'recurring cast in generic opening',
)

# 4) Blueprint deterministic safety runs before Narrator, avoiding a paid narration call for already-unsafe architecture.
replace_once(
    'supabase/functions/story-generate/safety.ts',
    "  return flags\n}\n\nexport const newFriendIsAtomic",
    "  return flags\n}\n\nexport const scanRuleBasedSafetyValues = (\n  context: NormalizedStoryContext,\n  values: Array<string | null | undefined>,\n): SafetyFlags => scanRuleBasedSafety(context, {\n  title: '',\n  story_text: values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(' '),\n  choices: [],\n  state_patch: { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] },\n  vocabulary: [],\n  nextEpisodePreview: '',\n})\n\nexport const newFriendIsAtomic",
    'rule safety value projection',
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "import { branchingPreviewNeedsRewrite, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'\n",
    "import { branchingPreviewNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'\n",
    'blueprint safety import',
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "  if (hasSingleLanguageMismatch(context.language, blueprintNaturalLanguageValues(value), context.recurringCharacters)) errors.push('blueprint_language_mismatch')\n  const childVisibleBlueprint = blueprintChildVisibleValues(value)\n",
    "  const naturalLanguageBlueprint = blueprintNaturalLanguageValues(value)\n  if (hasSingleLanguageMismatch(context.language, naturalLanguageBlueprint, context.recurringCharacters)) errors.push('blueprint_language_mismatch')\n  if (Object.values(scanRuleBasedSafetyValues(context, naturalLanguageBlueprint)).some(Boolean)) errors.push('blueprint_rule_safety')\n  const childVisibleBlueprint = blueprintChildVisibleValues(value)\n",
    'blueprint pre-narrator safety',
)

# 5) Repair routing covers all Narrator-owned validator outcomes we can deterministically repair.
replace_once(
    'supabase/functions/story-generate/repair-routing.ts',
    "export const textRewriteValidationErrors = new Set([\n  'story_language_mismatch',\n",
    "export const textRewriteValidationErrors = new Set([\n  'invalid_title',\n  'invalid_resolution_text',\n  'invalid_vocabulary_count',\n  'unexpected_vocabulary',\n  'story_language_mismatch',\n",
    'repairable narrator validation coverage',
)
replace_once(
    'supabase/functions/story-generate/repair-routing.ts',
    "const fullStoryRewriteErrors = new Set([\n  'story_language_mismatch',\n",
    "const fullStoryRewriteErrors = new Set([\n  'invalid_title',\n  'invalid_vocabulary_count',\n  'unexpected_vocabulary',\n  'story_language_mismatch',\n",
    'full rewrite narrator coverage',
)
replace_once(
    'supabase/functions/story-generate/repair-routing.ts',
    "  if (errors.some((error) => fullStoryRewriteErrors.has(error))) return true\n  if (context.episodeIndex === 2 && errors.some((error) =>\n",
    "  if (errors.some((error) => fullStoryRewriteErrors.has(error))) return true\n  // Short Episode 1 can use bounded insertion. Long prose must always be rewritten; insertion cannot shorten it.\n  if (errors.includes('story_too_long')) return true\n  if (context.episodeIndex === 2 && errors.some((error) =>\n",
    'Episode 1 too-long rewrite routing',
)

# 6) Do cheap deterministic safety immediately after Narrator and route repair directly.
replace_once(
    'supabase/functions/story-generate/split-index.ts',
    "import { isTextLengthOnlyFailure, isTextRepairCorrectionEligible, isTextRepairEligibleFailure } from './repair-routing.ts'\n",
    "import { isTextRepairCorrectionEligible, isTextRepairEligibleFailure } from './repair-routing.ts'\n",
    'remove obsolete length-only routing import',
)
replace_once(
    'supabase/functions/story-generate/split-index.ts',
    "  let validationErrors = validateCandidate(context, candidate)\n",
    "  const initialRuleFlags = scanRuleBasedSafety(context, candidate)\n  if (hasRuleViolation(initialRuleFlags)) {\n    lastFailureClass = 'deterministic-safety'\n    const flags = Object.entries(initialRuleFlags).filter(([, value]) => value).map(([key]) => key)\n    trace.push(`deterministic-safety-pre-repair:${flags.join(',') || 'flagged'}`)\n    return safeFallback(context, origin, 'generation-or-safety-failed', {\n      ...runtimeProviderMetadata,\n      ...claimMetadata(claim),\n      'X-QISSA-Generation-Failure-Class': lastFailureClass,\n      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),\n      'X-QISSA-Generation-Repair': 'none',\n      'X-QISSA-Narrator-Retry-Used': 'false',\n      'X-QISSA-Provider-Calls': String(providerCalls),\n      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n    })\n  }\n\n  let validationErrors = validateCandidate(context, candidate)\n",
    'pre-repair deterministic safety',
)
regex_once(
    'supabase/functions/story-generate/split-index.ts',
    r"  // One prose-only Luna retry is safe because the immutable Architect blueprint owns all canon,\n  // branch consequences and choices\. This retry cannot mutate state; it only rewrites narration\.\n  if \(validationErrors\.length > 0 && !isTextLengthOnlyFailure\(validationErrors\)\) \{[\s\S]*?\n  \}\n\n  if \(validationErrors\.length > 0 && isTextRepairEligibleFailure\(validationErrors\)\) \{",
    "  // v74: every known Narrator-owned deterministic defect goes straight to the bounded repair agent.\n  // Architect/schema-owned defects cannot be corrected by another prose generation, so fail closed without paying for a futile retry.\n  if (validationErrors.length > 0 && !isTextRepairEligibleFailure(validationErrors)) {\n    lastFailureClass = 'validation'\n    trace.push(`nonrepairable-validation:${validationErrors.join(',')}`)\n    return safeFallback(context, origin, 'generation-or-safety-failed', {\n      ...runtimeProviderMetadata,\n      ...claimMetadata(claim),\n      'X-QISSA-Generation-Failure-Class': lastFailureClass,\n      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),\n      'X-QISSA-Generation-Repair': 'none',\n      'X-QISSA-Repair-Retry-Used': 'false',\n      'X-QISSA-Narrator-Retry-Used': 'false',\n      'X-QISSA-Escalation-Used': 'false',\n      'X-QISSA-Narrator-Model-Used': narratorModelUsed,\n      'X-QISSA-Provider-Calls': String(providerCalls),\n      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n    })\n  }\n\n  if (validationErrors.length > 0 && isTextRepairEligibleFailure(validationErrors)) {",
    'remove redundant narrator retry',
    flags=re.MULTILINE,
)

# 7) Regression suite: classify every candidate validator outcome, prove no wasted retry, prove series identity/fallback continuity.
replace_once(
    'scripts/check-story-ai-safety.mjs',
    "  'isTextLengthOnlyFailure',\n",
    "  'isTextRepairEligibleFailure',\n  'deterministic-safety-pre-repair',\n  'nonrepairable-validation',\n",
    'story AI safety contract routing',
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "import { isTextRepairEligibleFailure, textRepairRequiresFullStoryRewrite } from '../supabase/functions/story-generate/repair-routing.ts'\n",
    "import { isTextRepairEligibleFailure, textRepairRequiresFullStoryRewrite, textRepairableValidationErrors } from '../supabase/functions/story-generate/repair-routing.ts'\n",
    'repair routing test import',
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "  ['choice_resolution_too_short', 'choice_resolution_defers_to_future_session'],\n]) {\n",
    "  ['choice_resolution_too_short', 'choice_resolution_defers_to_future_session'],\n  ['invalid_title'],\n  ['invalid_resolution_text'],\n  ['invalid_vocabulary_count'],\n  ['unexpected_vocabulary'],\n]) {\n",
    'repair routing matrix expansion',
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "requireLanguageGuard(!textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_short']), 'pure Episode 1 short text should keep the cheaper insertion repair')\n",
    "requireLanguageGuard(!textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_short']), 'pure Episode 1 short text should keep the cheaper insertion repair')\nrequireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_long']), 'Episode 1 story_too_long must use full rewrite because insertion cannot shorten prose')\n",
    'too-long route regression',
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "requireLanguageGuard(!isTextRepairEligibleFailure(['invalid_choice_count', 'story_too_short']), 'structural/Architect-owned failures must not be sent to prose repair')\n\n\nconst memoryKeyRegression",
    "requireLanguageGuard(!isTextRepairEligibleFailure(['invalid_choice_count', 'story_too_short']), 'structural/Architect-owned failures must not be sent to prose repair')\n\nconst candidateValidatorErrors = new Set([\n  'candidate_not_object',\n  ...[...safety.matchAll(/errors\\.push\\('([^']+)'\\)/gu)].map((match) => match[1]),\n])\nconst architectOrSchemaOwnedCandidateErrors = new Set([\n  'candidate_not_object', 'invalid_story_text', 'invalid_choice_count', 'invalid_choice', 'invalid_choice_id',\n  'invalid_choice_text', 'invalid_effect_summary', 'invalid_tomorrow_seed', 'invalid_choice_icon',\n  'invalid_choice_state_patch', 'invalid_value_alignment', 'invalid_state_patch', 'invalid_vocabulary',\n  'invalid_preview', 'missing_preview', 'technical_preview_language', 'branching_preview_language', 'unexpected_preview',\n])\nconst unclassifiedCandidateErrors = [...candidateValidatorErrors].filter((error) =>\n  !textRepairableValidationErrors.has(error) && !architectOrSchemaOwnedCandidateErrors.has(error))\nrequireLanguageGuard(unclassifiedCandidateErrors.length === 0, `every candidate validator outcome must be classified before live AI; unclassified=${unclassifiedCandidateErrors.join(',')}`)\n\n\nconst memoryKeyRegression",
    'validator classification gate',
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "  'narratorRetryUsed = true',\n  'Previous narration failed deterministic validation',\n",
    "  'deterministic-safety-pre-repair',\n  'nonrepairable-validation',\n",
    'split orchestrator no redundant retry expectation',
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "if (orchestrator.includes(\"OPENAI_NARRATOR_ESCALATION_MODEL')?.trim() || 'gpt-5.6-sol'\")) {\n",
    "if (orchestrator.includes('narratorRetryUsed = true') || orchestrator.includes('Previous narration failed deterministic validation')) {\n  failures.push('Narrator deterministic defects must route directly to bounded repair; a redundant full Narrator retry wastes provider calls')\n}\n\nconst preRepairSafetyPosition = orchestrator.indexOf('const initialRuleFlags = scanRuleBasedSafety')\nconst repairCallPosition = orchestrator.indexOf('repairStoryCandidateTextLengths(', preRepairSafetyPosition)\nif (!(preRepairSafetyPosition >= 0 && repairCallPosition > preRepairSafetyPosition)) {\n  failures.push('deterministic safety must run before any paid text-repair call')\n}\n\nif (orchestrator.includes(\"OPENAI_NARRATOR_ESCALATION_MODEL')?.trim() || 'gpt-5.6-sol'\")) {\n",
    'provider-call preflight assertions',
)

# Add explicit blueprint safety regression using a standalone danger token.
replace_once(
    'scripts/check-story-ai-split.mjs',
    "requireLanguageGuard(badBlueprintErrors.includes('blueprint_technical_preview_language'), 'technical preview wording must fail at Architect validation before Narrator')\n\nif (!switchedLanguageContext) {\n",
    "requireLanguageGuard(badBlueprintErrors.includes('blueprint_technical_preview_language'), 'technical preview wording must fail at Architect validation before Narrator')\nconst unsafeBlueprint = structuredClone(badImmutableUzBlueprint)\nunsafeBlueprint.central_goal = 'Do‘stlar qon haqida gaplashadi'\nconst unsafeBlueprintErrors = validateStoryBlueprint({ language: 'uz', ageGroup: '5-7', episodeIndex: 1, storyMode: 'series', storyMood: 'bedtime', isFinalSeriesSession: false, recurringCharacters: [], canonState: {}, relationshipState: {} }, unsafeBlueprint)\nrequireLanguageGuard(unsafeBlueprintErrors.includes('blueprint_rule_safety'), 'deterministic safety present in Architect output must fail before the paid Narrator stage')\n\nif (!switchedLanguageContext) {\n",
    'blueprint deterministic safety regression',
)

# Stronger custom-hero and fallback identity continuity proof.
replace_once(
    'scripts/check-story-core-proof.mjs',
    "  const establishedUzSeries = buildSafeFallback({\n    ...uzForestContext,\n    sessionIndex: 2,\n    hasSeriesMemory: true,\n    recurringCharacters: ['Рыжик'],\n    activeArc: 'old_arc',\n    lastEpisodeSummary: 'Рыжик oldingi hikoyada qahramon bilan do‘stlashdi.',\n    canonState: { old_fact: 'saved' },\n  })\n  assert(!/Momiq|Oycha|Yong‘oqcha|Toshvoy/u.test(establishedUzSeries.story_text), 'Established Uzbek series fallback must not restart the fixed flagship cast after a language/session continuation.')\n\n",
    "  const recurringOnlyRequest = normalizeStoryRequest({\n    selections: {\n      ...baseSelections, language: 'uz', customHeroName: 'Malika', stylePackId: 'cozy_forest',\n    },\n    seriesState: {\n      id: 'identity-language-switch-series', sessionId: 'identity-language-switch-session', sessionIndex: 2,\n      mainCharacter: 'Алия', recurringCharacters: ['Рыжик'],\n      lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0,\n    },\n  })\n  assert(recurringOnlyRequest, 'Recurring-character-only series state must normalize.')\n  assert(recurringOnlyRequest.heroName === 'Алия', 'Existing series hero identity must outrank a changed custom-name selection.')\n  assert(recurringOnlyRequest.hasSeriesMemory, 'Recurring characters alone must count as series memory.')\n  assert(recurringOnlyRequest.recurringCharacters.join('|') === 'Рыжик', 'Recurring character identity must survive a language switch exactly.')\n\n  const establishedUzSeries = buildSafeFallback(recurringOnlyRequest)\n  assert(/Рыжик/u.test(establishedUzSeries.story_text), 'Established Uzbek series fallback must visibly preserve the canonical recurring character name.')\n  assert(!/Momiq|Oycha|Yong‘oqcha|Toshvoy|Nura|Topa|Puf|Lola|Toti/u.test(establishedUzSeries.story_text), 'Established Uzbek series fallback must not replace canonical characters with a fixed language-specific cast.')\n\n  const establishedUzContinuation = buildSafeFallback({\n    ...recurringOnlyRequest,\n    episodeIndex: 2,\n    isContinuation: true,\n    hasSeriesMemory: true,\n    choiceHistory: [{\n      episode_id: 'identity-e1', choice_id: 'choice-a', choice_text: 'Saqlangan tanlov',\n      effect_summary: 'Saqlangan natija', resolution_text: 'Tanlov shu oqshom bajarildi.', tomorrow_seed: 'Keyingi uchrashuv uchun iz.',\n    }],\n  })\n  assert(/Рыжик/u.test(establishedUzContinuation.story_text), 'Fallback continuation must keep the established recurring character identity.')\n  assert(!/Momiq|Oycha|Yong‘oqcha|Toshvoy|Nura|Topa|Puf|Lola|Toti/u.test(establishedUzContinuation.story_text), 'Fallback continuation must not inject a fixed cast when provider memory already exists.')\n  assert(establishedUzContinuation.choices.length === 0 && establishedUzContinuation.nextEpisodePreview === '', 'Identity-safe fallback continuation must stay closed and choice-free.')\n\n",
    'fallback identity continuity proof',
)

print('v74 zero-waste deterministic preflight patch applied')
