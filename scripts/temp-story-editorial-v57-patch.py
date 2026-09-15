from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly 1 match, got {count}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))


# Episode 1 should fit the proven full-session duration without requiring padding.
for path in [
    "supabase/functions/story-generate/prompt.ts",
    "supabase/functions/story-generate/story-architecture.ts",
    "supabase/functions/story-generate/safety.ts",
]:
    replace_once(path, "return context.episodeIndex === 1 ? [430, 560] : [340, 520]", "return context.episodeIndex === 1 ? [360, 500] : [340, 520]")

replace_once("supabase/functions/story-generate/prompt.ts", "return context.episodeIndex === 1 ? '515-545' : '430-490'", "return context.episodeIndex === 1 ? '400-440' : '430-490'")
replace_once("supabase/functions/story-generate/prompt.ts", "? '525-550'", "? '420-455'")
replace_once("supabase/functions/story-generate/prompt.ts", "const rewriteTargetMinimum = bedtimeEpisodeOne ? 500 : Math.min(maximumStoryWords - 10, minimumStoryWords + 40)", "const rewriteTargetMinimum = bedtimeEpisodeOne ? 400 : Math.min(maximumStoryWords - 10, minimumStoryWords + 40)")
replace_once("supabase/functions/story-generate/prompt.ts", "const rewriteTargetMaximum = bedtimeEpisodeOne ? 535 : Math.max(rewriteTargetMinimum, maximumStoryWords - 20)", "const rewriteTargetMaximum = bedtimeEpisodeOne ? 440 : Math.max(rewriteTargetMinimum, maximumStoryWords - 20)")
replace_once("supabase/functions/story-generate/prompt.ts", "const desiredExpandedTotal = Math.min(maximumStoryWords - 25, minimumStoryWords + 65)", "const desiredExpandedTotal = Math.min(maximumStoryWords - 25, minimumStoryWords + 45)")
replace_once(
    "supabase/functions/story-generate/prompt.ts",
    "'orientation: about 55-70 words — establish where the story is, who the hero is, and what the hero is doing in one compact paragraph; use only one or two concrete details and do not force a context-free cold open',\n        'early curiosity / desire / problem: about 55-70 words — introduce the unusual event, desire, question or small problem within roughly the first 60-120 words and make the central story question understandable by roughly the first 100-120 words',\n        'exploration / build-up: about 320-340 words — move through action, dialogue, reactions and discoveries that deepen the same goal; description must serve what is happening',\n        'choice setup: about 65-75 words — make both options understandable as two safe actions the HERO could take to pursue the SAME established goal, then stop for the child decision without another delay beat',",
    "'orientation: about 50-60 words — establish where the story is, who the hero is, and what the hero is doing in one compact paragraph; use only one or two concrete details and do not force a context-free cold open',\n        'early curiosity / desire / problem: about 50-60 words — introduce the unusual event, desire, question or small problem within roughly the first 60-120 words and make the central story question understandable by roughly the first 100-120 words',\n        'exploration / build-up: about 230-260 words — move through action, dialogue, reactions and discoveries that deepen the same goal; description must serve what is happening and avoid repeating the same inspection or explanation',\n        'choice setup: about 45-60 words — arrive at the decision naturally, end with one neutral decision cue or question, and keep the actual choice actions only in structured choices rather than listing or paraphrasing them in story_text',",
)

# Split Narrator follows the same range and must not duplicate the structured choice menu.
replace_once("supabase/functions/story-generate/story-architecture.ts", "? context.episodeIndex === 1 ? '485-525' : '400-470'", "? context.episodeIndex === 1 ? '400-440' : '400-470'")
replace_once("supabase/functions/story-generate/story-architecture.ts", "? { target_paragraphs: 7, average_words_per_paragraph: '65-75', final_choice_setup_words: '55-75' }", "? { target_paragraphs: 7, average_words_per_paragraph: '55-65', final_choice_setup_words: '45-60' }")
replace_once(
    "supabase/functions/story-generate/story-architecture.ts",
    "'For Episode 1, end story_text at the blueprint decision point before either branch happens. Do not print the two choices inside story_text.',",
    "'For Episode 1, end story_text at the blueprint decision point before either branch happens. End with one neutral decision cue or question. Never restate, list, paraphrase, preview, or name either choice action inside story_text; the two actions belong only in the structured choices supplied by the blueprint.',",
)
replace_once(
    "supabase/functions/story-generate/story-architecture.ts",
    "'Choice display text must be in the requested story language. Do not use the {{HERO}} token in architect output; phrase choices without the hero name.',",
    "'Choice display text must be in the requested story language. Do not use the {{HERO}} token in architect output; phrase choices without the hero name.',\n    'next_episode_preview is child-facing story copy. Never mention confirmation, selection mechanics, an episode, segment, pipeline, or a story branch. Write one natural in-world sentence about what the hero may notice or do after the immediate chosen action.',",
)

# Cover common Russian prepositions that force HERO declension, including v56's "на {{HERO}}".
replace_once(
    "supabase/functions/story-generate/safety.ts",
    "(?:у|к|ко|с|со|от|до|для|без|про|о|об|обо|около|возле|вокруг|перед|за|под|над|между|рядом\\\\s+с)",
    "(?:у|к|ко|с|со|от|до|для|без|про|о|об|обо|около|возле|вокруг|перед|за|под|над|между|на|в|во|из|из-за|из-под|по|через|после|мимо|среди|напротив|вместо|при|благодаря|вопреки|согласно|навстречу|рядом\\\\s+с|вместе\\\\s+с)",
)

safety_path = Path("supabase/functions/story-generate/safety.ts")
safety = safety_path.read_text()
marker = "export const validateCandidate = (context: NormalizedStoryContext, candidate: unknown): string[] => {"
if safety.count(marker) != 1:
    raise SystemExit("safety.ts validateCandidate marker mismatch")
helpers = r'''const choiceMenuStopWords = new Set([
  'можно', 'нужно', 'чтобы', 'вместе', 'помочь', 'герой', 'героиня', 'потом', 'сначала',
  'bilan', 'uchun', 'qahramon', 'mumkin', 'kerak', 'keyin',
  'бірге', 'үшін', 'кейіпкер', 'мүмкін', 'керек', 'кейін',
])

const significantChoiceWords = (text: string): Set<string> => new Set(
  (text.toLocaleLowerCase().match(/[\p{L}\p{M}]{4,}/gu) ?? [])
    .filter((word) => !choiceMenuStopWords.has(word)),
)

export const storyRepeatsChoiceMenu = (context: NormalizedStoryContext, candidate: StoryCandidate): boolean => {
  if (context.episodeIndex !== 1 || !Array.isArray(candidate.choices) || candidate.choices.length < 2 || typeof candidate.story_text !== 'string') return false
  const finalParagraph = paragraphs(candidate.story_text).at(-1) ?? ''
  const finalWords = significantChoiceWords(finalParagraph)
  if (finalWords.size < 4) return false

  return candidate.choices.every((choice) => {
    if (!isRecord(choice) || typeof choice.text !== 'string') return false
    const choiceWords = significantChoiceWords(choice.text)
    if (choiceWords.size < 3) return false
    const overlap = [...choiceWords].filter((word) => finalWords.has(word)).length
    return overlap >= Math.max(3, Math.ceil(choiceWords.size * 0.35))
  })
}

export const technicalPreviewLanguageNeedsRewrite = (language: string, text: string): boolean => {
  const normalized = text.replace(/[\u2018\u2019\u02BB`]/g, "'").toLocaleLowerCase()
  const patterns: Record<string, RegExp[]> = {
    ru: [/подтвержд(?:е|ё)нн[\p{L}\p{M}-]*\s+выбор/iu, /после\s+подтверждения\s+выбора/iu, /эпизод/iu, /сегмент/iu, /сюжетн[\p{L}\p{M}-]*\s+ветк/iu],
    uz: [/tasdiqlangan\s+tanlov/iu, /tanlov\s+tasdiqlangach/iu, /epizod/iu, /segment/iu],
    kz: [/расталған\s+таңдау/iu, /таңдау\s+расталғаннан/iu, /эпизод/iu, /сегмент/iu],
  }
  return (patterns[language] ?? []).some((pattern) => pattern.test(normalized))
}

'''
safety_path.write_text(safety.replace(marker, helpers + marker, 1))
replace_once(
    "supabase/functions/story-generate/safety.ts",
    "  if (typeof value.nextEpisodePreview !== 'string') errors.push('invalid_preview')\n  if (context.storyMode === 'series' && context.episodeIndex === 1 && !value.nextEpisodePreview.trim()) errors.push('missing_preview')",
    "  if (storyRepeatsChoiceMenu(context, value)) errors.push('story_repeats_choice_menu')\n\n  if (typeof value.nextEpisodePreview !== 'string') errors.push('invalid_preview')\n  if (context.storyMode === 'series' && context.episodeIndex === 1 && !value.nextEpisodePreview.trim()) errors.push('missing_preview')\n  if (typeof value.nextEpisodePreview === 'string' && technicalPreviewLanguageNeedsRewrite(context.language, value.nextEpisodePreview)) errors.push('technical_preview_language')",
)

replace_once(
    "supabase/functions/story-generate/split-index.ts",
    "        'For story_language_mismatch, rewrite every natural-language field strictly in the requested story language. Do not translate machine keys or the {{HERO}} token.',",
    "        'For story_language_mismatch, rewrite every natural-language field strictly in the requested story language. Do not translate machine keys or the {{HERO}} token.',\n        'For story_repeats_choice_menu, end story_text with one neutral decision cue or question and remove every listing or paraphrase of the two structured choice actions from story_text.',\n        'For technical_preview_language, rewrite the preview as one natural child-facing in-world sentence. Do not mention confirmation, selection mechanics, episodes, segments, pipelines, or story branches.',",
)

# Keep compact memory useful for the next session; never cut it mid-word.
contracts_path = Path("supabase/functions/story-generate/contracts.ts")
contracts = contracts_path.read_text()
marker = "const entriesToRecord = (entries: unknown): Record<string, string> => {"
if contracts.count(marker) != 1:
    raise SystemExit("contracts.ts entriesToRecord marker mismatch")
helper = r'''const compactMemoryText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return ''
  const normalized = normalizeSpace(value)
  if (normalized.length <= maxLength) return normalized
  const clipped = normalized.slice(0, maxLength + 1)
  const boundary = clipped.lastIndexOf(' ')
  return (boundary >= Math.floor(maxLength * 0.6) ? clipped.slice(0, boundary) : normalized.slice(0, maxLength)).trim()
}

'''
contracts_path.write_text(contracts.replace(marker, helper + marker, 1))
replace_once("supabase/functions/story-generate/contracts.ts", "const value = compactText(item.value, 120)", "const value = compactMemoryText(item.value, 120)")
replace_once("supabase/functions/story-generate/contracts.ts", "const lastEvent = compactText(patch.last_event, 96)", "const lastEvent = compactMemoryText(patch.last_event, 96)")
replace_once("supabase/functions/story-generate/contracts.ts", "const newFriend = compactText(patch.new_friend, 64)", "const newFriend = compactMemoryText(patch.new_friend, 64)")
replace_once("supabase/functions/story-generate/contracts.ts", "const heroTrait = compactText(patch.hero_trait, 64)", "const heroTrait = compactMemoryText(patch.hero_trait, 64)")
replace_once("supabase/functions/story-generate/contracts.ts", "const openArc = patch.open_arc === null ? null : compactText(patch.open_arc, 120)", "const openArc = patch.open_arc === null ? null : compactMemoryText(patch.open_arc, 120)")

# Executable regressions and static contract expectations.
check_path = Path("scripts/check-story-ai-safety.mjs")
check = check_path.read_text()
check = check.replace(
    "import { russianHeroTokenNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'",
    "import { russianHeroTokenNeedsRewrite, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'",
)
check = check.replace("return context.episodeIndex === 1 ? '515-545' : '430-490'", "return context.episodeIndex === 1 ? '400-440' : '430-490'")
check = check.replace("return context.episodeIndex === 1 ? [430, 560] : [340, 520]", "return context.episodeIndex === 1 ? [360, 500] : [340, 520]")
check = check.replace("? '525-550'", "? '420-455'")
check = check.replace("'orientation: about 55-70 words'", "'orientation: about 50-60 words'")
check = check.replace("'early curiosity / desire / problem: about 55-70 words'", "'early curiosity / desire / problem: about 50-60 words'")
check = check.replace("'exploration / build-up: about 320-340 words'", "'exploration / build-up: about 230-260 words'")
check = check.replace("'choice setup: about 65-75 words'", "'choice setup: about 45-60 words'")
check = check.replace("  'export const compactStoryText',", "  'export const compactStoryText',\n  'const compactMemoryText = (value: unknown, maxLength: number)',")
insertion = r'''requireRegression(
  russianHeroTokenNeedsRewrite('Рыжик посмотрел на {{HERO}} и улыбнулся.', 'girl_hero'),
  'Russian HERO token must be rejected after the preposition на',
)
requireRegression(
  technicalPreviewLanguageNeedsRewrite('ru', 'После подтверждённого выбора ручеёк начнёт снова журчать.'),
  'child-facing preview must reject technical confirmation language',
)
requireRegression(
  !technicalPreviewLanguageNeedsRewrite('ru', 'Ручеёк зажурчит, и под ивой покажется синий камешек.'),
  'natural in-world preview must remain allowed',
)
const duplicateChoiceContext = { episodeIndex: 1 }
requireRegression(
  storyRepeatsChoiceMenu(duplicateChoiceContext, {
    story_text: 'Рыжик прислушался к ручью. Можно осторожно разобрать лёгкие веточки вместе с Рыжиком. А можно позвать сову Ульяну и попросить показать первую веточку.',
    choices: [
      { text: 'Осторожно разобрать лёгкие веточки вместе с Рыжиком.' },
      { text: 'Позвать сову Ульяну и попросить показать первую веточку.' },
    ],
  }),
  'story_text must reject a duplicated structured choice menu',
)
requireRegression(
  !storyRepeatsChoiceMenu(duplicateChoiceContext, {
    story_text: 'Рыжик посмотрел на ручей и спросил: «Как лучше начать?»',
    choices: [
      { text: 'Осторожно разобрать лёгкие веточки вместе с Рыжиком.' },
      { text: 'Позвать сову Ульяну и попросить показать первую веточку.' },
    ],
  }),
  'neutral decision cue must not be mistaken for a duplicated choice menu',
)

'''
anchor = "requireRegression(\n  visibleSafetyLanguageNeedsRewrite('ru', 'Обе возможности были безопасными и добрыми.'),"
if check.count(anchor) != 1:
    raise SystemExit("check-story-ai-safety regression anchor mismatch")
check_path.write_text(check.replace(anchor, insertion + anchor, 1))

split_check_path = Path("scripts/check-story-ai-split.mjs")
split_check = split_check_path.read_text()
split_check = split_check.replace(
    "  \"target_paragraphs: 7\",",
    "  \"target_paragraphs: 7\",\n  \"context.episodeIndex === 1 ? '400-440' : '400-470'\",\n  'Never restate, list, paraphrase, preview, or name either choice action inside story_text',\n  'next_episode_preview is child-facing story copy',",
)
split_check = split_check.replace(
    "  'For story_language_mismatch',",
    "  'For story_language_mismatch',\n  'For story_repeats_choice_menu',\n  'For technical_preview_language',",
)
split_check_path.write_text(split_check)
