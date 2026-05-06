export type Language = 'ru' | 'uz' | 'kz'
export type VocabularyLanguage = 'ru' | 'en'

export type AgeGroup = '3-5' | '6-8' | '9-10'
export type HeroType = 'girl_hero' | 'boy_hero' | 'animal' | 'magical_hero' | 'custom'

export type StoryMode = 'one_time' | 'series'
export type PlaybackMode = 'read' | 'listen'
export type StoryMood = 'bedtime' | 'kind_adventure'

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

export type StylePackId =
  | 'cozy_forest'
  | 'magic_garden'
  | 'brave_adventure'
  | 'stars_and_space'
  | 'silk_road'
  | 'animal_world'
  | 'castle_mystery'
  | 'sea_islands'

export interface StylePalette { background: string; primary: string; secondary: string; accent: string; text: string }
export interface StylePack {
  id: StylePackId
  title: Record<Language, string>
  description: Record<Language, string>
  palette: StylePalette
  mood: StoryMood
  bedtimeSafe: boolean
  allowedMoods: StoryMood[]
  illustrationDirection: string
  decorativeElements: string[]
}

export type VoicePresetId = 'soft_female' | 'calm_male' | 'neutral_storyteller' | 'cheerful_daytime'
export interface VoicePreset {
  id: VoicePresetId
  title: Record<Language, string>
  description: Record<Language, string>
  tone: string
  genderPresentation: 'female' | 'male' | 'neutral'
  suitableFor: StoryMood[]
  isGenderLocked: false
}

export interface ReaderPreferences {
  textSize: 'small' | 'medium' | 'large' | 'extra_large'
  fontMode: 'standard' | 'soft' | 'dyslexia_friendly'
  lineSpacing: 'normal' | 'relaxed' | 'wide'
  theme: 'light' | 'warm' | 'night'
  showTextWithAudio: boolean
  audioOnlyNightMode: boolean
  voicePresetId: VoicePresetId
  defaultPlaybackMode: PlaybackMode
}

export interface ChildProfile {
  id: string
  name?: string
  ageGroup: AgeGroup
  language: Language
  defaultVoicePresetId?: VoicePresetId
  readerPreferences?: ReaderPreferences
  preferredHeroType?: HeroType
}

export interface OnboardingSelections {
  ageGroup: AgeGroup
  language: Language
  heroType: HeroType
  customHeroName?: string
  stylePackId: StylePackId
  storyMode: StoryMode
  storyMood: StoryMood
}

export interface StatePatch {
  last_event?: string
  new_friend?: string
  hero_trait?: string
  open_arc?: string
  relationship_updates?: Record<string, string>
  canon_updates?: Record<string, string>
}

export interface EpisodeChoice {
  choice_id: string
  text: string
  effect_summary: string
  state_patch: StatePatch
  value_alignment: PositiveValue[]
}

export interface ChoiceHistoryEntry {
  episode_id: string
  choice_id: string
  choice_text: string
  effect_summary: string
  state_patch: StatePatch
  selected_at: string
}

export interface VocabularyItem {
  word: string
  translation: string
  example: string
  sourceLanguage: VocabularyLanguage
  targetLanguage: VocabularyLanguage
}

export interface SafetyResult {
  approved: boolean
  risk_level: 'low' | 'medium' | 'high'
  flags: { discrimination: boolean; humiliation: boolean; religious_push: boolean; political_push: boolean; gender_stereotype: boolean; nationality_stereotype: boolean; conditional_love: boolean; bedtime_overstimulation: boolean; adult_theme: boolean; excessive_fear: boolean }
  required_action: 'publish' | 'regenerate' | 'fallback' | 'block'
}

export interface Episode {
  episode_id: string
  series_id: string
  title: string
  story_text: string
  mode: StoryMode
  mood: StoryMood
  stylePackId: StylePackId
  choices: EpisodeChoice[]
  state_patch: StatePatch
  vocabulary: VocabularyItem[]
  nextEpisodePreview: string
  safety_self_check: SafetyResult
}

export interface SeriesState {
  id: string
  childProfileId: string
  stylePackId: StylePackId
  mainCharacter: string
  recurringCharacters: string[]
  lastEpisodeSummary: string
  activeArc: string
  relationshipState: Record<string, string>
  choiceHistory: ChoiceHistoryEntry[]
  canonState: Record<string, string>
  episodeCount: number
}
