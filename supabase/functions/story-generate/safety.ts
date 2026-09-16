import {
  emptySafetyFlags,
  isRecord,
  positiveValues,
  type NormalizedStoryContext,
  type SafetyEvaluation,
  type SafetyFlags,
  type SafetyResult,
  type StoryCandidate,
} from './contracts.ts'
import type { ModerationResult } from './openai.ts'
import { hasSingleLanguageMismatch } from './language.ts'

const allFalse = (flags: SafetyFlags) => Object.values(flags).every((value) => value === false)

const mergeFlags = (...sets: SafetyFlags[]): SafetyFlags => {
  const merged = emptySafetyFlags()
  for (const flags of sets) {
    for (const key of Object.keys(merged) as Array<keyof SafetyFlags>) merged[key] ||= flags[key]
  }
  return merged
}

const includesAny = (text: string, phrases: string[]) => phrases.some((phrase) => text.includes(phrase))

const matchesAny = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text))

export const scanRuleBasedSafety = (context: NormalizedStoryContext, candidate: StoryCandidate): SafetyFlags => {
  const flags = emptySafetyFlags()
  const normalizeApostrophes = (value: string) => value.replace(/[\u2018\u2019\u02BB`]/g, "'")
  const choices = Array.isArray(candidate.choices) ? candidate.choices : []
  const text = normalizeApostrophes(
    `${candidate.title ?? ''} ${candidate.story_text ?? ''} ${choices.map((choice) => `${choice.text ?? ''} ${choice.effect_summary ?? ''} ${choice.resolution_text ?? ''} ${choice.tomorrow_seed ?? ''}`).join(' ')}`,
  ).toLocaleLowerCase()

  flags.political_push = includesAny(text, [
    'голосуй за', 'политическая партия', 'наш лидер всегда прав',
    'ovoz ber', 'siyosiy partiya', 'bizning rahbar doim haq',
    'дауыс бер', 'саяси партия', 'біздің көшбасшы әрқашан дұрыс',
  ])
  flags.religious_push = includesAny(text, [
    'единственная правильная религия', 'ты обязан верить',
    "yagona to'g'ri din", 'ishonishing shart',
    'жалғыз дұрыс дін', 'сенуің міндетті',
  ])
  flags.conditional_love = includesAny(text, [
    'буду любить тебя только если', 'мама полюбит тебя, если',
    'faqat shunda seni sevaman', 'onang seni sevadi, agar',
    'сені тек сонда жақсы көремін', 'анаң сені жақсы көреді, егер',
  ])
  flags.humiliation = includesAny(text, [
    'ты глупый', 'ты никчёмный', 'все смеялись над ним',
    'sen ahmoqsan', 'hamma uning ustidan kuldi',
    'сен ақымақсың', 'бәрі оны мазақ етті',
  ])
  flags.gender_stereotype = includesAny(text, [
    'девочки не могут', 'мальчики не плачут',
    'qizlar qila olmaydi', "o'g'il bolalar yig'lamaydi",
    'қыздар істей алмайды', 'ұлдар жыламайды',
  ])
  flags.nationality_stereotype = includesAny(text, [
    'все люди этой национальности',
    'bu millatning hamma odamlari',
    'бұл ұлттың барлық адамдары',
  ])
  flags.bedtime_overstimulation = context.storyMood === 'bedtime' && includesAny(text, [
    'продолжение следует', 'вдруг раздался страшный крик', 'но за дверью кто-то ждал',
    'davomi bor', 'birdan dahshatli qichqiriq',
    'жалғасы бар', 'кенет қорқынышты айқай',
  ])
  flags.excessive_fear = matchesAny(text, [
    /(?<![\p{L}\p{M}\p{N}_])ужас\s+охватил(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])кровь(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])убить(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])погиб[\p{L}\p{M}-]*(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])dahshat[\p{L}\p{M}-]*(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])qon(?:i|ni|ga|dan|li)?(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])o'ldir[\p{L}\p{M}-]*(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])қорқыныш\s+биледі(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])қан(?![\p{L}\p{M}\p{N}_])/u,
    /(?<![\p{L}\p{M}\p{N}_])өлтіру(?![\p{L}\p{M}\p{N}_])/u,
  ])
  flags.adult_theme = includesAny(text, ['сексуаль', 'алкогол', 'наркотик', 'sexual', 'alcohol', 'drug'])
  flags.discrimination = includesAny(text, [
    'хуже из-за своего языка', 'хуже из-за внешности',
    'tili sababli yomonroq', "ko'rinishi sababli yomonroq",
    'тілі үшін төмен', 'сырт келбеті үшін төмен',
  ])

  return flags
}

export const scanRuleBasedSafetyValues = (
  context: NormalizedStoryContext,
  values: Array<string | null | undefined>,
): SafetyFlags => scanRuleBasedSafety(context, {
  title: '',
  story_text: values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(' '),
  choices: [],
  state_patch: { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] },
  vocabulary: [],
  nextEpisodePreview: '',
})

export const newFriendIsAtomic = (value: unknown): boolean => {
  if (value === null) return true
  if (typeof value !== 'string') return false
  const normalized = value.trim()
  if (!normalized || normalized.length > 48) return false
  if (/[;,/|]/u.test(normalized)) return false
  return !/\s(?:va|and|и|және)\s/iu.test(normalized)
}

const validatePatch = (patch: unknown): boolean =>
  isRecord(patch) &&
  typeof patch.last_event === 'string' &&
  newFriendIsAtomic(patch.new_friend) &&
  (patch.hero_trait === null || typeof patch.hero_trait === 'string') &&
  (patch.open_arc === null || typeof patch.open_arc === 'string') &&
  Array.isArray(patch.relationship_updates) &&
  patch.relationship_updates.every((item) => isRecord(item) && typeof item.key === 'string' && typeof item.value === 'string') &&
  Array.isArray(patch.canon_updates) &&
  patch.canon_updates.every((item) => isRecord(item) && typeof item.key === 'string' && typeof item.value === 'string')

const wordCount = (text: string) => text.trim().split(/\s+/u).filter(Boolean).length
const paragraphs = (text: string) => text.trim().split(/\n\s*\n/u).map((item) => item.trim()).filter(Boolean)

const isFiveToSevenBedtimeSeries = (context: NormalizedStoryContext) =>
  context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime'

const storyWordRange = (context: NormalizedStoryContext): [number, number] => {
  if (isFiveToSevenBedtimeSeries(context)) {
    return context.episodeIndex === 1 ? [320, 470] : [355, 520]
  }
  if (context.ageGroup === '3-4') return [80, 260]
  if (context.ageGroup === '5-7') return [120, 390]
  return [170, 540]
}

const futureSessionPatterns: Record<string, RegExp[]> = {
  ru: [
    /(?<![\p{L}\p{M}\p{N}_])завтра(?![\p{L}\p{M}\p{N}_])/iu,
    /(?<![\p{L}\p{M}\p{N}_])утром(?![\p{L}\p{M}\p{N}_])/iu,
    /(?<![\p{L}\p{M}\p{N}_])на\s+следующ(?:ий|ее)\s+(?:день|утро)(?![\p{L}\p{M}\p{N}_])/iu,
  ],
  uz: [
    /(?<![\p{L}\p{M}\p{N}_])ertaga(?![\p{L}\p{M}\p{N}_])/iu,
    /(?<![\p{L}\p{M}\p{N}_])ertalab(?![\p{L}\p{M}\p{N}_])/iu,
    /(?<![\p{L}\p{M}\p{N}_])ertasi\s+(?:kuni|tongda)(?![\p{L}\p{M}\p{N}_])/iu,
    /(?<![\p{L}\p{M}\p{N}_])keyingi\s+kuni(?![\p{L}\p{M}\p{N}_])/iu,
  ],
  kz: [
    /(?<![\p{L}\p{M}\p{N}_])ертең(?![\p{L}\p{M}\p{N}_])/iu,
    /(?<![\p{L}\p{M}\p{N}_])таңертең(?![\p{L}\p{M}\p{N}_])/iu,
    /(?<![\p{L}\p{M}\p{N}_])келесі\s+күні(?![\p{L}\p{M}\p{N}_])/iu,
  ],
}

export const choiceResolutionDefersToFutureSession = (language: string, text: string): boolean =>
  (futureSessionPatterns[language] ?? []).some((pattern) => pattern.test(text))

const startsWithNextDayReset = (context: NormalizedStoryContext, text: string) => {
  if (!isFiveToSevenBedtimeSeries(context) || context.episodeIndex !== 2) return false
  const firstParagraph = paragraphs(text)[0] ?? ''
  return choiceResolutionDefersToFutureSession(context.language, firstParagraph)
}

const patchLanguageValues = (patch: unknown): string[] => {
  if (!isRecord(patch)) return []
  const values: string[] = []
  for (const field of ['last_event', 'new_friend', 'hero_trait', 'open_arc'] as const) {
    if (typeof patch[field] === 'string') values.push(patch[field] as string)
  }
  for (const field of ['relationship_updates', 'canon_updates'] as const) {
    const entries = patch[field]
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      if (isRecord(entry) && typeof entry.value === 'string') values.push(entry.value)
    }
  }
  return values
}

const candidateLanguageValues = (candidate: StoryCandidate): string[] => {
  const values = [candidate.title, candidate.story_text, candidate.nextEpisodePreview]
    .filter((item): item is string => typeof item === 'string')
  values.push(...patchLanguageValues(candidate.state_patch))
  if (Array.isArray(candidate.choices)) {
    for (const choice of candidate.choices) {
      if (!isRecord(choice)) continue
      for (const field of ['text', 'effect_summary', 'resolution_text', 'tomorrow_seed'] as const) {
        if (typeof choice[field] === 'string') values.push(choice[field] as string)
      }
      values.push(...patchLanguageValues(choice.state_patch))
    }
  }
  if (Array.isArray(candidate.vocabulary)) {
    for (const item of candidate.vocabulary) {
      if (!isRecord(item)) continue
      if (typeof item.word === 'string') values.push(item.word)
      if (typeof item.example === 'string') values.push(item.example)
    }
  }
  return values
}

const candidateChildVisibleValues = (candidate: StoryCandidate): string[] => {
  const values = [candidate.title, candidate.story_text, candidate.nextEpisodePreview]
    .filter((item): item is string => typeof item === 'string')
  if (Array.isArray(candidate.choices)) {
    for (const choice of candidate.choices) {
      if (!isRecord(choice)) continue
      for (const field of ['text', 'resolution_text', 'tomorrow_seed'] as const) {
        if (typeof choice[field] === 'string') values.push(choice[field] as string)
      }
    }
  }
  if (Array.isArray(candidate.vocabulary)) {
    for (const item of candidate.vocabulary) {
      if (!isRecord(item)) continue
      if (typeof item.example === 'string') values.push(item.example)
    }
  }
  return values
}

const uzbekYoungChildAvoidPatterns = [
  /(?<![\p{L}\p{M}\p{N}_])(?:ritm|pauza|sincap|mox|paporotnik|kapyushon|spiral|tantanali|chorraha|naqadar|minnatdor|mamnun|sukunat|hissa)[\p{L}\p{M}-]*(?![\p{L}\p{M}\p{N}_])/iu,
]

export const uzbekYoungChildValuesNeedRewrite = (
  context: Pick<NormalizedStoryContext, 'language' | 'ageGroup'>,
  values: Array<string | null | undefined>,
): boolean => {
  if (context.language !== 'uz' || context.ageGroup !== '5-7') return false
  const visibleText = values
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join(' ')
    .replace(/[\u2018\u2019\u02BB`]/g, "'")
    .toLocaleLowerCase()
  return uzbekYoungChildAvoidPatterns.some((pattern) => pattern.test(visibleText))
}

export const uzbekChildLanguageNeedsRewrite = (
  context: Pick<NormalizedStoryContext, 'language' | 'ageGroup'>,
  candidate: StoryCandidate,
): boolean => uzbekYoungChildValuesNeedRewrite(context, [
  candidate.title,
  candidate.story_text,
  candidate.nextEpisodePreview,
  ...(Array.isArray(candidate.choices)
    ? candidate.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.resolution_text])
    : []),
  ...(Array.isArray(candidate.vocabulary)
    ? candidate.vocabulary.flatMap((item) => [item.word, item.translation, item.example])
    : []),
])

const genericHeroRoleAliasPattern = (
  language: NormalizedStoryContext['language'],
  heroType: NormalizedStoryContext['heroType'],
): RegExp | null => {
  const aliases: Partial<Record<NormalizedStoryContext['language'], Partial<Record<NormalizedStoryContext['heroType'], string>>>> = {
    ru: {
      girl_hero: 'девочк(?:а|и|е|у|ой|ою)',
      boy_hero: 'мальчик(?:а|у|ом|е|и)?',
    },
    uz: {
      girl_hero: 'qizaloq(?:ning|ni|ga|da|dan)?',
      boy_hero: "o'g'il\\s+bola(?:ning|ni|ga|da|dan)?",
    },
    kz: {
      girl_hero: 'қыз(?:дың|ға|ды|да|дан|бен)?',
      boy_hero: 'ұл(?:дың|ға|ды|да|дан|мен)?',
    },
  }
  const alias = aliases[language]?.[heroType]
  return alias
    ? new RegExp(`(?<![\\p{L}\\p{M}\\p{N}_])(?:${alias})(?![\\p{L}\\p{M}\\p{N}_])`, 'iu')
    : null
}

export const genericHeroAliasNeedsRewrite = (
  context: Pick<NormalizedStoryContext, 'language' | 'heroType'>,
  values: Array<string | null | undefined>,
): boolean => {
  const pattern = genericHeroRoleAliasPattern(context.language, context.heroType)
  if (!pattern) return false
  const text = values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .replace(/[\u2018\u2019\u02BB`]/g, "'")
    .toLocaleLowerCase()
  if (!text.includes('{{hero}}') && !text.includes('qissa_hero')) return false
  return pattern.test(text)
}

const unicodeWordStart = '(?<![\\p{L}\\p{N}_])'
const unicodeWordEnd = '(?![\\p{L}\\p{N}_])'

type RussianHeroAgreement = NormalizedStoryContext['heroType']

export const russianHeroTokenNeedsRewrite = (
  text: string,
  heroType: RussianHeroAgreement = 'custom',
) => {
  const token = '(?:\\{\\{HERO\\}\\}|QISSA_HERO)'
  const tokenBoundary = '(?=[\\s,.:;!?»”")—-]|$)'
  const preposition = new RegExp(
    `(?:^|[\\s(«„"—-])(?:у|к|ко|с|со|от|до|для|без|про|о|об|обо|около|возле|вокруг|перед|за|под|над|между|на|в|во|из|из-за|из-под|по|через|после|мимо|среди|напротив|вместо|при|благодаря|вопреки|согласно|навстречу|рядом\\s+с|вместе\\s+с)\\s+${token}${tokenBoundary}`,
    'iu',
  )
  const masculinePastWord = '[\\p{L}Ёё-]{2,}?(?:лся|л)'
  const femininePastWord = '[\\p{L}Ёё-]{2,}?(?:лась|ла)'
  const genderedPastWord = `(?:${masculinePastWord}|${femininePastWord})`
  const disallowedPastWord = heroType === 'girl_hero'
    ? masculinePastWord
    : heroType === 'boy_hero'
      ? femininePastWord
      : genderedPastWord
  const neutralModifier = '(?:вдруг|снова|уже|тихо|медленно|осторожно|бережно|быстро|спокойно|наконец|тоже|ещё|еще|чуть|немного|сразу|затем|потом|[\\p{L}-]+(?:о|е))'
  const optionalModifiers = `(?:\\s+${neutralModifier}){0,3}`
  const wrongAgreementAfter = new RegExp(
    `${token}${tokenBoundary}${optionalModifiers}\\s+${unicodeWordStart}${disallowedPastWord}${unicodeWordEnd}`,
    'iu',
  )
  const wrongAgreementBefore = new RegExp(
    `${unicodeWordStart}${disallowedPastWord}${unicodeWordEnd}${optionalModifiers}\\s+${token}${tokenBoundary}`,
    'iu',
  )
  return preposition.test(text) || wrongAgreementAfter.test(text) || wrongAgreementBefore.test(text)
}

const metaChoicePatterns = (
  choiceTerms: string,
  evaluationTerms: string,
): RegExp[] => [
  new RegExp(
    `${unicodeWordStart}(?:${choiceTerms})${unicodeWordEnd}[^.!?\\n]{0,80}${unicodeWordStart}(?:${evaluationTerms})${unicodeWordEnd}`,
    'iu',
  ),
  new RegExp(
    `${unicodeWordStart}(?:${evaluationTerms})${unicodeWordEnd}[^.!?\\n]{0,80}${unicodeWordStart}(?:${choiceTerms})${unicodeWordEnd}`,
    'iu',
  ),
]

export const visibleSafetyLanguageNeedsRewrite = (language: string, text: string) => {
  const normalized = text.replace(/[\u2018\u2019\u02BB`]/g, "'").toLocaleLowerCase()
  const patterns: Record<string, RegExp[]> = {
    ru: metaChoicePatterns(
      'вариант(?:а|ов)?|выбор(?:а|ов)?|возможност(?:ь|и|ей)',
      'безопасн[\\p{L}-]*|добр[\\p{L}-]*|правильн[\\p{L}-]*|хорош[\\p{L}-]*|спокойн[\\p{L}-]*|верн[\\p{L}-]*',
    ),
    uz: metaChoicePatterns(
      'tanlov|tanlovlar|variant|variantlar|imkoniyat|imkoniyatlar',
      "xavfsiz|yaxshi|to'g'ri|mehribon|sokin",
    ),
    kz: metaChoicePatterns(
      'таңдау|таңдаулар|нұсқа|нұсқалар|мүмкіндік|мүмкіндіктер',
      'қауіпсіз|жақсы|дұрыс|мейірімді|тыныш',
    ),
  }
  return (patterns[language] ?? []).some((pattern) => pattern.test(normalized))
}

const choiceMenuStopWords = new Set([
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

export const choiceMenuScaffoldingNeedsRewrite = (language: string, text: string): boolean => {
  const tail = paragraphs(text).slice(-4).join(' ').replace(/[\u2018\u2019\u02BB`]/g, "'").toLocaleLowerCase()
  const patterns: Record<string, RegExp[]> = {
    ru: [/можно[\s\S]{0,260}(?:а\s+можно|или\s+можно)/iu],
    uz: [/mumkin[\s\S]{0,260}(?:yoki[\s\S]{0,100}mumkin|yana[\s\S]{0,100}mumkin)/iu],
    kz: [/болады[\s\S]{0,260}(?:немесе[\s\S]{0,100}болады|тағы[\s\S]{0,100}болады)/iu],
  }
  return (patterns[language] ?? []).some((pattern) => pattern.test(tail))
}

export const branchingPreviewNeedsRewrite = (language: string, text: string): boolean => {
  const normalized = ` ${text.replace(/[\u2018\u2019\u02BB`]/g, "'").toLocaleLowerCase()} `
  if (language === 'ru') return /\sили\s/iu.test(normalized)
  if (language === 'uz') return /\syoki\s/iu.test(normalized)
  if (language === 'kz') return /\sнемесе\s/iu.test(normalized)
  return false
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

export const validateCandidate = (context: NormalizedStoryContext, candidate: unknown): string[] => {
  const errors: string[] = []
  if (!isRecord(candidate)) return ['candidate_not_object']
  const value = candidate as StoryCandidate

  if (hasSingleLanguageMismatch(context.language, candidateLanguageValues(value), context.recurringCharacters)) errors.push('story_language_mismatch')
  if (visibleSafetyLanguageNeedsRewrite(context.language, candidateChildVisibleValues(value).join(' '))) {
    errors.push('visible_safety_language')
  }
  if (uzbekChildLanguageNeedsRewrite(context, value)) errors.push('uzbek_child_language_requires_rewrite')
  if (genericHeroAliasNeedsRewrite(context, candidateLanguageValues(value))) errors.push('generic_hero_alias_requires_rewrite')

  if (context.language === 'ru') {
    const choiceText = Array.isArray(value.choices)
      ? value.choices.flatMap((choice) => isRecord(choice)
          ? [choice.text, choice.effect_summary, choice.resolution_text, choice.tomorrow_seed]
              .filter((item): item is string => typeof item === 'string')
          : []).join(' ')
      : ''
    const vocabularyText = Array.isArray(value.vocabulary)
      ? value.vocabulary.flatMap((item) => isRecord(item)
          ? [item.word, item.translation, item.example]
              .filter((entry): entry is string => typeof entry === 'string')
          : []).join(' ')
      : ''
    const heroGrammarText = [value.title, value.story_text, value.nextEpisodePreview, choiceText, vocabularyText]
      .filter((item): item is string => typeof item === 'string')
      .join(' ')
    if (russianHeroTokenNeedsRewrite(heroGrammarText, context.heroType)) errors.push('russian_hero_requires_rewrite')
  }

  if (typeof value.title !== 'string' || value.title.trim().length < 2) errors.push('invalid_title')
  if (typeof value.story_text !== 'string') errors.push('invalid_story_text')
  else {
    const words = wordCount(value.story_text)
    const storyParagraphs = paragraphs(value.story_text)
    const [minWords, maxWords] = storyWordRange(context)
    if (words < minWords) errors.push('story_too_short')
    if (words > maxWords) errors.push('story_too_long')
    if (!value.story_text.includes('{{HERO}}') && !value.story_text.includes('QISSA_HERO')) errors.push('missing_hero_token')

    if (isFiveToSevenBedtimeSeries(context)) {
      const minimumParagraphs = context.episodeIndex === 1 ? 5 : 4
      if (storyParagraphs.length < minimumParagraphs) errors.push('insufficient_narrative_beats')
      if (startsWithNextDayReset(context, value.story_text)) errors.push('continuation_resets_before_resolution')
      if (context.episodeIndex === 2) {
        const finalParagraphWords = wordCount(storyParagraphs[storyParagraphs.length - 1] ?? '')
        if (finalParagraphWords < 50) errors.push('bedtime_coda_too_short')
        if (finalParagraphWords > 170) errors.push('bedtime_coda_too_long')
      }
    }
  }

  const expectedChoices = context.episodeIndex === 1 ? 2 : 0
  if (!Array.isArray(value.choices) || value.choices.length !== expectedChoices) errors.push('invalid_choice_count')
  else {
    const ids = new Set<string>()
    for (const choice of value.choices) {
      if (!isRecord(choice)) { errors.push('invalid_choice'); continue }
      if (typeof choice.choice_id !== 'string' || ids.has(choice.choice_id)) errors.push('invalid_choice_id')
      else ids.add(choice.choice_id)
      if (typeof choice.text !== 'string' || choice.text.length < 3) errors.push('invalid_choice_text')
      if (typeof choice.effect_summary !== 'string' || choice.effect_summary.length < 8) errors.push('invalid_effect_summary')
      if (typeof choice.resolution_text !== 'string' || choice.resolution_text.length < 12) {
        errors.push('invalid_resolution_text')
      } else if (isFiveToSevenBedtimeSeries(context) && context.episodeIndex === 1) {
        const resolutionWords = wordCount(choice.resolution_text)
        if (choice.resolution_text.length > 360) errors.push('choice_resolution_too_long')
        if (resolutionWords < 25) errors.push('choice_resolution_too_short')
        if (resolutionWords > 60) errors.push('choice_resolution_too_long')
        if (choiceResolutionDefersToFutureSession(context.language, choice.resolution_text)) {
          errors.push('choice_resolution_defers_to_future_session')
        }
      }
      if (typeof choice.tomorrow_seed !== 'string' || choice.tomorrow_seed.length < 8) errors.push('invalid_tomorrow_seed')
      if (typeof choice.choice_icon !== 'string' || !choice.choice_icon.trim()) errors.push('invalid_choice_icon')
      if (!validatePatch(choice.state_patch)) errors.push('invalid_choice_state_patch')
      if (!Array.isArray(choice.value_alignment) || choice.value_alignment.length === 0 || choice.value_alignment.some((item) => !positiveValues.has(item))) {
        errors.push('invalid_value_alignment')
      }
    }
  }

  if (!validatePatch(value.state_patch)) errors.push('invalid_state_patch')
  if (!Array.isArray(value.vocabulary)) errors.push('invalid_vocabulary')
  else if (context.language === 'ru' && (value.vocabulary.length < 2 || value.vocabulary.length > 3)) errors.push('invalid_vocabulary_count')
  else if (context.language !== 'ru' && value.vocabulary.length !== 0) errors.push('unexpected_vocabulary')

  if (storyRepeatsChoiceMenu(context, value)) errors.push('story_repeats_choice_menu')
  if (context.episodeIndex === 1 && typeof value.story_text === 'string' && choiceMenuScaffoldingNeedsRewrite(context.language, value.story_text)) errors.push('story_choice_menu_scaffolding')

  if (typeof value.nextEpisodePreview !== 'string') errors.push('invalid_preview')
  if (context.storyMode === 'series' && context.episodeIndex === 1 && !value.nextEpisodePreview.trim()) errors.push('missing_preview')
  if (typeof value.nextEpisodePreview === 'string' && technicalPreviewLanguageNeedsRewrite(context.language, value.nextEpisodePreview)) errors.push('technical_preview_language')
  if (context.episodeIndex === 1 && typeof value.nextEpisodePreview === 'string' && branchingPreviewNeedsRewrite(context.language, value.nextEpisodePreview)) errors.push('branching_preview_language')
  if ((context.storyMode === 'one_time' || context.episodeIndex === 2) && value.nextEpisodePreview.trim()) errors.push('unexpected_preview')
  return [...new Set(errors)]
}

export const moderationNeedsFearAdjudication = (
  context: Pick<NormalizedStoryContext, 'ageGroup' | 'storyMode' | 'storyMood'>,
  ruleFlags: SafetyFlags,
  evaluation: SafetyEvaluation,
  moderation: ModerationResult,
): boolean => {
  if (!(context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime')) return false
  if (!allFalse(ruleFlags) || !evaluation.approved || !allFalse(evaluation.flags)) return false
  const activeCategories = Object.entries(moderation.categories)
    .filter(([, value]) => value)
    .map(([key]) => key)
  return moderation.flagged && activeCategories.length === 1 && activeCategories[0] === 'violence'
}

export const clearAdjudicatedNonSevereViolence = (moderation: ModerationResult): ModerationResult => {
  const categories = { ...moderation.categories, violence: false }
  return {
    flagged: Object.values(categories).some((value) => value === true),
    categories,
  }
}

export const moderationFlags = (moderation: ModerationResult): SafetyFlags => {
  const flags = emptySafetyFlags()
  const categories = moderation.categories
  const any = (prefixes: string[]) => Object.entries(categories).some(([key, value]) => value && prefixes.some((prefix) => key.startsWith(prefix)))

  flags.discrimination = any(['hate'])
  flags.humiliation = any(['harassment'])
  flags.adult_theme = any(['sexual'])
  flags.excessive_fear = any(['violence', 'self-harm'])
  if (moderation.flagged && allFalse(flags)) flags.excessive_fear = true
  return flags
}

export const combineSafety = (
  ruleFlags: SafetyFlags,
  evaluation: SafetyEvaluation,
  moderation: ModerationResult,
): SafetyResult => {
  const flags = mergeFlags(ruleFlags, evaluation.flags, moderationFlags(moderation))
  const approved = allFalse(flags) && evaluation.approved && !moderation.flagged
  const highRisk = flags.adult_theme || flags.discrimination || flags.excessive_fear || flags.religious_push || flags.political_push
  return {
    approved,
    risk_level: approved ? 'low' : highRisk ? 'high' : 'medium',
    flags,
    required_action: approved ? 'publish' : highRisk ? 'block' : 'regenerate',
  }
}
