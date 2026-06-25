export type Language = 'ru' | 'uz' | 'kz'
export type AgeGroup = '3-4' | '5-7' | '8-9'
export type HeroType = 'girl_hero' | 'boy_hero' | 'animal' | 'magical_hero' | 'custom'
export type StoryMode = 'one_time' | 'series'
export type StoryMood = 'bedtime' | 'kind_adventure'
export type StylePackId =
  | 'cozy_forest'
  | 'magic_garden'
  | 'brave_adventure'
  | 'stars_and_space'
  | 'silk_road'
  | 'animal_world'
  | 'castle_mystery'
  | 'sea_islands'

export type PositiveValue =
  | 'respect_for_elders'
  | 'kindness'
  | 'care_for_nature'
  | 'care_for_animals'
  | 'friendship'
  | 'honesty'
  | 'gratitude'
  | 'curiosity'
  | 'mutual_help'
  | 'calm_conflict_resolution'
  | 'human_dignity'

export type JsonRecord = Record<string, unknown>

export type StoryRequest = {
  selections?: {
    ageGroup?: string
    language?: string
    heroType?: string
    customHeroName?: string
    stylePackId?: string
    storyMode?: string
    storyMood?: string
  }
  seriesState?: {
    id?: string
    mainCharacter?: string
    recurringCharacters?: unknown
    lastEpisodeSummary?: string
    activeArc?: string
    relationshipState?: unknown
    choiceHistory?: unknown
    canonState?: unknown
    episodeCount?: number
  }
}

export type MemoryChoice = {
  episode_id: string
  choice_id: string
  choice_text: string
  effect_summary: string
  resolution_text: string
  tomorrow_seed: string
}

export type NormalizedStoryContext = {
  ageGroup: AgeGroup
  language: Language
  heroType: HeroType
  heroName: string
  stylePackId: StylePackId
  storyMode: StoryMode
  storyMood: StoryMood
  seriesId: string
  episodeIndex: 1 | 2
  isContinuation: boolean
  recurringCharacters: string[]
  lastEpisodeSummary: string
  activeArc: string
  relationshipState: Record<string, string>
  canonState: Record<string, string>
  choiceHistory: MemoryChoice[]
}

export type CandidateRecordEntry = { key: string; value: string }

export type CandidatePatch = {
  last_event: string
  new_friend: string | null
  hero_trait: string | null
  open_arc: string | null
  relationship_updates: CandidateRecordEntry[]
  canon_updates: CandidateRecordEntry[]
}

export type CandidateChoice = {
  choice_id: string
  text: string
  effect_summary: string
  resolution_text: string
  tomorrow_seed: string
  choice_icon: string
  state_patch: CandidatePatch
  value_alignment: PositiveValue[]
}

export type CandidateVocabulary = {
  word: string
  translation: string
  example: string
}

export type StoryCandidate = {
  title: string
  story_text: string
  choices: CandidateChoice[]
  state_patch: CandidatePatch
  vocabulary: CandidateVocabulary[]
  nextEpisodePreview: string
}

export type SafetyFlags = {
  discrimination: boolean
  humiliation: boolean
  religious_push: boolean
  political_push: boolean
  gender_stereotype: boolean
  nationality_stereotype: boolean
  conditional_love: boolean
  bedtime_overstimulation: boolean
  adult_theme: boolean
  excessive_fear: boolean
}

export type SafetyResult = {
  approved: boolean
  risk_level: 'low' | 'medium' | 'high'
  flags: SafetyFlags
  required_action: 'publish' | 'regenerate' | 'fallback' | 'block'
}

export type FinalStatePatch = {
  last_event?: string
  new_friend?: string
  hero_trait?: string
  open_arc?: string
  relationship_updates?: Record<string, string>
  canon_updates?: Record<string, string>
}

export type FinalChoice = {
  choice_id: string
  text: string
  effect_summary: string
  resolution_text: string
  tomorrow_seed: string
  choice_icon: string
  state_patch: FinalStatePatch
  value_alignment: PositiveValue[]
}

export type FinalEpisode = {
  episode_id: string
  series_id: string
  title: string
  story_text: string
  mode: StoryMode
  mood: StoryMood
  stylePackId: StylePackId
  choices: FinalChoice[]
  state_patch: FinalStatePatch
  vocabulary: Array<{
    word: string
    translation: string
    example: string
    sourceLanguage: 'ru'
    targetLanguage: 'en'
  }>
  nextEpisodePreview: string
  safety_self_check: SafetyResult
}

export type SafetyEvaluation = SafetyResult & { notes: string[] }

export const languages = new Set<Language>(['ru', 'uz', 'kz'])
export const ageGroups = new Set<AgeGroup>(['3-4', '5-7', '8-9'])
export const heroTypes = new Set<HeroType>(['girl_hero', 'boy_hero', 'animal', 'magical_hero', 'custom'])
export const storyModes = new Set<StoryMode>(['one_time', 'series'])
export const storyMoods = new Set<StoryMood>(['bedtime', 'kind_adventure'])
export const stylePackIds = new Set<StylePackId>([
  'cozy_forest',
  'magic_garden',
  'brave_adventure',
  'stars_and_space',
  'silk_road',
  'animal_world',
  'castle_mystery',
  'sea_islands',
])

export const positiveValues = new Set<PositiveValue>([
  'respect_for_elders',
  'kindness',
  'care_for_nature',
  'care_for_animals',
  'friendship',
  'honesty',
  'gratitude',
  'curiosity',
  'mutual_help',
  'calm_conflict_resolution',
  'human_dignity',
])

export const emptySafetyFlags = (): SafetyFlags => ({
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
})

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeSpace = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()

export const compactText = (value: unknown, maxLength: number): string =>
  typeof value === 'string' ? normalizeSpace(value).slice(0, maxLength) : ''

const safeName = (value: unknown): string | null => {
  const normalized = compactText(value, 32)
  if (!normalized) return null
  return /^[\p{L}\p{M}\s'’\-]{1,32}$/u.test(normalized) ? normalized : null
}

const defaultHeroNames: Record<Language, Record<HeroType, string>> = {
  ru: {
    girl_hero: 'Алия',
    boy_hero: 'Тимур',
    animal: 'Снежный Барсик',
    magical_hero: 'Звёздный Проводник',
    custom: 'Юный герой',
  },
  uz: {
    girl_hero: 'Aliya',
    boy_hero: 'Timur',
    animal: 'kichik qor barsi',
    magical_hero: 'mehribon yulduz yo‘lboshchi',
    custom: 'kichik qahramon',
  },
  kz: {
    girl_hero: 'Алия',
    boy_hero: 'Тимур',
    animal: 'кішкентай қар барысы',
    magical_hero: 'мейірімді жұлдыз жетекші',
    custom: 'жас кейіпкер',
  },
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const redactHeroName = (value: string, heroName: string): string => {
  if (!heroName.trim()) return value
  return value.replace(new RegExp(escapeRegExp(heroName), 'giu'), '{{HERO}}')
}

const compactStringRecord = (value: unknown, heroName: string, maxEntries = 20): Record<string, string> => {
  if (!isRecord(value)) return {}
  const result: Record<string, string> = {}
  for (const [rawKey, rawValue] of Object.entries(value).slice(0, maxEntries)) {
    const key = redactHeroName(compactText(rawKey, 48), heroName)
    const text = redactHeroName(compactText(rawValue, 160), heroName)
    if (key && text) result[key] = text
  }
  return result
}

const compactChoiceHistory = (value: unknown, heroName: string): MemoryChoice[] => {
  if (!Array.isArray(value)) return []
  const items = value.slice(-6)
  return items.flatMap((item): MemoryChoice[] => {
    if (!isRecord(item)) return []
    const choiceId = compactText(item.choice_id, 64)
    if (!choiceId) return []
    return [{
      episode_id: compactText(item.episode_id, 96),
      choice_id: choiceId,
      choice_text: redactHeroName(compactText(item.choice_text, 180), heroName),
      effect_summary: redactHeroName(compactText(item.effect_summary, 240), heroName),
      resolution_text: redactHeroName(compactText(item.resolution_text, 240), heroName),
      tomorrow_seed: redactHeroName(compactText(item.tomorrow_seed, 240), heroName),
    }]
  })
}

export const normalizeStoryRequest = (input: unknown): NormalizedStoryContext | null => {
  if (!isRecord(input)) return null
  const request = input as StoryRequest
  const selections = request.selections
  const seriesState = request.seriesState
  if (!selections || !seriesState) return null

  const ageGroup = selections.ageGroup as AgeGroup
  const language = selections.language as Language
  const heroType = selections.heroType as HeroType
  const stylePackId = selections.stylePackId as StylePackId
  const storyMode = selections.storyMode as StoryMode
  const storyMood = selections.storyMood as StoryMood
  const seriesId = compactText(seriesState.id, 128)

  if (
    !ageGroups.has(ageGroup) ||
    !languages.has(language) ||
    !heroTypes.has(heroType) ||
    !stylePackIds.has(stylePackId) ||
    !storyModes.has(storyMode) ||
    !storyMoods.has(storyMood) ||
    !seriesId
  ) return null

  const customName = heroType === 'custom' ? safeName(selections.customHeroName) : null
  const stateName = safeName(seriesState.mainCharacter)
  const heroName = customName ?? stateName ?? defaultHeroNames[language][heroType]
  const choiceHistory = compactChoiceHistory(seriesState.choiceHistory, heroName)
  const isContinuation = choiceHistory.length > 0
  const recurringCharacters = Array.isArray(seriesState.recurringCharacters)
    ? seriesState.recurringCharacters
        .map((item) => redactHeroName(compactText(item, 48), heroName))
        .filter(Boolean)
        .slice(0, 8)
    : []

  return {
    ageGroup,
    language,
    heroType,
    heroName,
    stylePackId,
    storyMode,
    storyMood,
    seriesId,
    episodeIndex: isContinuation ? 2 : 1,
    isContinuation,
    recurringCharacters,
    lastEpisodeSummary: redactHeroName(compactText(seriesState.lastEpisodeSummary, 300), heroName),
    activeArc: redactHeroName(compactText(seriesState.activeArc, 240), heroName),
    relationshipState: compactStringRecord(seriesState.relationshipState, heroName),
    canonState: compactStringRecord(seriesState.canonState, heroName),
    choiceHistory,
  }
}

const entriesToRecord = (entries: CandidateRecordEntry[]): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const item of entries.slice(0, 12)) {
    const key = compactText(item.key, 48)
    const value = compactText(item.value, 120)
    if (key && value) result[key] = value
  }
  return result
}

export const finalPatchFromCandidate = (patch: CandidatePatch): FinalStatePatch => {
  const result: FinalStatePatch = {}
  const lastEvent = compactText(patch.last_event, 96)
  const newFriend = compactText(patch.new_friend, 64)
  const heroTrait = compactText(patch.hero_trait, 64)
  const openArc = compactText(patch.open_arc, 120)
  const relationshipUpdates = entriesToRecord(patch.relationship_updates)
  const canonUpdates = entriesToRecord(patch.canon_updates)

  if (lastEvent) result.last_event = lastEvent
  if (newFriend) result.new_friend = newFriend
  if (heroTrait) result.hero_trait = heroTrait
  if (openArc) result.open_arc = openArc
  if (Object.keys(relationshipUpdates).length > 0) result.relationship_updates = relationshipUpdates
  if (Object.keys(canonUpdates).length > 0) result.canon_updates = canonUpdates
  return result
}

export const replaceHeroToken = (value: string, heroName: string): string =>
  value.replaceAll('{{HERO}}', heroName).replaceAll('QISSA_HERO', heroName)

export const buildFinalEpisode = (
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  safety: SafetyResult,
): FinalEpisode => ({
  episode_id: `ep-${context.episodeIndex}-${context.stylePackId}`,
  series_id: context.seriesId,
  title: replaceHeroToken(compactText(candidate.title, 120), context.heroName),
  story_text: replaceHeroToken(compactText(candidate.story_text, 6000), context.heroName),
  mode: context.storyMode,
  mood: context.storyMood,
  stylePackId: context.stylePackId,
  choices: candidate.choices.map((choice) => ({
    choice_id: compactText(choice.choice_id, 64),
    text: replaceHeroToken(compactText(choice.text, 220), context.heroName),
    effect_summary: replaceHeroToken(compactText(choice.effect_summary, 300), context.heroName),
    resolution_text: replaceHeroToken(compactText(choice.resolution_text, 400), context.heroName),
    tomorrow_seed: replaceHeroToken(compactText(choice.tomorrow_seed, 400), context.heroName),
    choice_icon: compactText(choice.choice_icon, 8) || '✨',
    state_patch: finalPatchFromCandidate(choice.state_patch),
    value_alignment: choice.value_alignment.filter((value) => positiveValues.has(value)).slice(0, 3),
  })),
  state_patch: finalPatchFromCandidate(candidate.state_patch),
  vocabulary: context.language === 'ru'
    ? candidate.vocabulary.slice(0, 3).map((item) => ({
        word: compactText(item.word, 48),
        translation: compactText(item.translation, 80),
        example: replaceHeroToken(compactText(item.example, 180), context.heroName),
        sourceLanguage: 'ru' as const,
        targetLanguage: 'en' as const,
      })).filter((item) => item.word && item.translation && item.example)
    : [],
  nextEpisodePreview: context.storyMode === 'series' && context.episodeIndex === 1
    ? replaceHeroToken(compactText(candidate.nextEpisodePreview, 300), context.heroName)
    : '',
  safety_self_check: safety,
})
