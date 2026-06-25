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

const allFalse = (flags: SafetyFlags) => Object.values(flags).every((value) => value === false)

const mergeFlags = (...sets: SafetyFlags[]): SafetyFlags => {
  const merged = emptySafetyFlags()
  for (const flags of sets) {
    for (const key of Object.keys(merged) as Array<keyof SafetyFlags>) merged[key] ||= flags[key]
  }
  return merged
}

const includesAny = (text: string, phrases: string[]) => phrases.some((phrase) => text.includes(phrase))

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
  flags.excessive_fear = includesAny(text, [
    'ужас охватил', 'кровь', 'убить', 'погиб',
    'dahshat', 'qon', "o'ldirish",
    'қорқыныш биледі', 'қан', 'өлтіру',
  ])
  flags.adult_theme = includesAny(text, ['сексуаль', 'алкогол', 'наркотик', 'sexual', 'alcohol', 'drug'])
  flags.discrimination = includesAny(text, [
    'хуже из-за своего языка', 'хуже из-за внешности',
    'tili sababli yomonroq', "ko'rinishi sababli yomonroq",
    'тілі үшін төмен', 'сырт келбеті үшін төмен',
  ])

  return flags
}

const validatePatch = (patch: unknown): boolean =>
  isRecord(patch) &&
  typeof patch.last_event === 'string' &&
  (patch.new_friend === null || typeof patch.new_friend === 'string') &&
  (patch.hero_trait === null || typeof patch.hero_trait === 'string') &&
  (patch.open_arc === null || typeof patch.open_arc === 'string') &&
  Array.isArray(patch.relationship_updates) &&
  patch.relationship_updates.every((item) => isRecord(item) && typeof item.key === 'string' && typeof item.value === 'string') &&
  Array.isArray(patch.canon_updates) &&
  patch.canon_updates.every((item) => isRecord(item) && typeof item.key === 'string' && typeof item.value === 'string')

const wordCount = (text: string) => text.trim().split(/\s+/u).filter(Boolean).length

export const validateCandidate = (context: NormalizedStoryContext, candidate: unknown): string[] => {
  const errors: string[] = []
  if (!isRecord(candidate)) return ['candidate_not_object']
  const value = candidate as StoryCandidate

  if (typeof value.title !== 'string' || value.title.trim().length < 2) errors.push('invalid_title')
  if (typeof value.story_text !== 'string') errors.push('invalid_story_text')
  else {
    const words = wordCount(value.story_text)
    const [minWords, maxWords] = context.ageGroup === '3-4' ? [80, 260] : context.ageGroup === '5-7' ? [120, 390] : [170, 540]
    if (words < minWords) errors.push('story_too_short')
    if (words > maxWords) errors.push('story_too_long')
    if (!value.story_text.includes('{{HERO}}') && !value.story_text.includes('QISSA_HERO')) errors.push('missing_hero_token')
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
      if (typeof choice.resolution_text !== 'string' || choice.resolution_text.length < 12) errors.push('invalid_resolution_text')
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

  if (typeof value.nextEpisodePreview !== 'string') errors.push('invalid_preview')
  if (context.storyMode === 'series' && context.episodeIndex === 1 && !value.nextEpisodePreview.trim()) errors.push('missing_preview')
  if ((context.storyMode === 'one_time' || context.episodeIndex === 2) && value.nextEpisodePreview.trim()) errors.push('unexpected_preview')
  return [...new Set(errors)]
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
