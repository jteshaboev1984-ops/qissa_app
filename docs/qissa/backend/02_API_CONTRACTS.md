# QISSA MVP API Contracts

Status: backend contract baseline aligned with `src/contracts/storyContracts.ts`. The app runtime remains local until the remote adapter and Edge Functions are enabled.

## Shared rules

- Validate all inputs server-side even when the client already validates them.
- Keep AI/provider secrets and the Supabase service-role key on the server only.
- The public client consumes domain payloads; it does not receive raw database-only fields unless explicitly documented.
- RU, UZ and KZ payloads must preserve the selected language through profile, session and episode records.

## Domain and database ID mapping

- `story_sessions.id` maps to the frontend `SeriesState.id` and `Episode.series_id`.
- `story_episodes.id` maps to the frontend `Episode.episode_id`.
- `story_choices.id` is an internal database UUID.
- `story_choices.choice_id` is the stable text key exposed as frontend `EpisodeChoice.choice_id`.
- `story_choice_events.story_choice_id` references the internal database UUID, not the public choice key.

## Shared domain types

```ts
type Language = 'ru' | 'uz' | 'kz'
type AgeGroup = '3-4' | '5-7' | '8-9'
type StoryMode = 'one_time' | 'series'
type StoryMood = 'bedtime' | 'kind_adventure'
type StylePackId =
  | 'cozy_forest'
  | 'magic_garden'
  | 'brave_adventure'
  | 'stars_and_space'
  | 'silk_road'
  | 'animal_world'
  | 'castle_mystery'
  | 'sea_islands'

interface ReaderPreferences {
  textSize: 'small' | 'medium' | 'large' | 'extra_large'
  fontMode: 'standard' | 'soft' | 'dyslexia_friendly'
  lineSpacing: 'normal' | 'relaxed' | 'wide'
  theme: 'light' | 'warm' | 'night'
  showTextWithAudio: boolean
  audioOnlyNightMode: boolean
  voicePresetId: 'soft_female' | 'calm_male' | 'neutral_storyteller' | 'cheerful_daytime'
  defaultPlaybackMode: 'read' | 'listen'
}

interface VocabularyItem {
  word: string
  translation: string
  example: string
  sourceLanguage: 'ru' | 'en'
  targetLanguage: 'ru' | 'en'
}

interface StatePatch {
  last_event?: string
  new_friend?: string
  hero_trait?: string
  open_arc?: string
  relationship_updates?: Record<string, string>
  canon_updates?: Record<string, string>
}

interface SafetyResultPayload {
  approved: boolean
  risk_level: 'low' | 'medium' | 'high'
  flags: Record<string, boolean>
  required_action: 'publish' | 'regenerate' | 'fallback' | 'block'
}

interface EpisodeChoicePayload {
  choice_id: string
  text: string
  effect_summary: string
  resolution_text?: string
  tomorrow_seed?: string
  choice_icon?: string
  state_patch: StatePatch
  value_alignment: string[]
}

interface EpisodePayload {
  episode_id: string
  series_id: string
  title: string
  story_text: string
  mode: StoryMode
  mood: StoryMood
  stylePackId: StylePackId
  choices: EpisodeChoicePayload[]
  state_patch: StatePatch
  vocabulary: VocabularyItem[]
  nextEpisodePreview: string
  safety_self_check: SafetyResultPayload
}
```

## Shared database record shapes

```ts
interface ChildProfileRecord {
  id: string
  parentUserId: string | null
  displayName: string | null
  ageGroup: AgeGroup
  language: Language
  heroType: 'girl_hero' | 'boy_hero' | 'animal' | 'magical_hero' | 'custom'
  customHeroName: string | null
  defaultVoicePresetId: string | null
  readerPreferences: ReaderPreferences
  createdAt: string
  updatedAt: string
}

interface StorySessionRecord {
  id: string
  childProfileId: string
  storyMode: StoryMode
  storyMood: StoryMood
  stylePackId: StylePackId
  status: 'not_started' | 'episode_1_active' | 'episode_1_choice_saved' | 'episode_2_active' | 'completed'
  currentEpisodeNo: number
  title: string | null
  summary: string | null
  canonState: Record<string, string>
  relationshipState: Record<string, string>
  activeArc: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

interface EpisodeRecord {
  id: string
  sessionId: string
  episodeNo: number
  title: string
  storyText: string
  language: Language
  mood: StoryMood
  stylePackId: StylePackId
  generationSource: 'local_mock' | 'edge_story_agent'
  safetyStatus: 'approved' | 'needs_review' | 'blocked'
  safetyResult: SafetyResultPayload
  vocabulary: VocabularyItem[]
  nextEpisodePreview: string | null
  createdAt: string
}

interface StoryChoiceRecord {
  id: string
  episodeId: string
  choiceKey: string
  text: string
  effectSummary: string
  resolutionText: string | null
  tomorrowSeed: string | null
  choiceIcon: string | null
  statePatch: StatePatch
  valueAlignment: string[]
  displayOrder: number
}

interface StoryChoiceEventRecord {
  id: string
  sessionId: string
  episodeId: string
  storyChoiceId: string
  selectedAt: string
  statePatchApplied: StatePatch
}
```

## 1) `createChildProfile`

```ts
interface CreateChildProfileRequest {
  ageGroup: AgeGroup
  language: Language
  heroType: 'girl_hero' | 'boy_hero' | 'animal' | 'magical_hero' | 'custom'
  customHeroName?: string
  readerPreferences?: Partial<ReaderPreferences>
}

interface CreateChildProfileResponse {
  childProfile: ChildProfileRecord
}
```

Validation: `customHeroName` is required only when `heroType='custom'`.

## 2) `updateChildProfile`

```ts
interface UpdateChildProfileRequest {
  childProfileId: string
  patch: Partial<Pick<
    ChildProfileRecord,
    'displayName' | 'ageGroup' | 'language' | 'heroType' | 'customHeroName' | 'defaultVoicePresetId'
  >>
}

interface UpdateChildProfileResponse {
  childProfile: ChildProfileRecord
}
```

Validation: accept only whitelisted profile fields and verify ownership.

## 3) `createStorySession`

```ts
interface CreateStorySessionRequest {
  childProfileId: string
  storyMode: StoryMode
  storyMood: StoryMood
  stylePackId: StylePackId
}

interface CreateStorySessionResponse {
  storySession: StorySessionRecord
}
```

Validation: verify profile ownership and supported world/mode/mood values.

## 4) `generateEpisode`

```ts
interface GenerateEpisodeRequest {
  sessionId: string
  requestedEpisodeNo: number
  previousChoiceEventId?: string
}

interface GenerateEpisodeResponse {
  episode: EpisodePayload
}
```

The response intentionally matches the current frontend `StoryGenerationOutput`. The Edge Function may persist normalized episode and choice rows internally, then assemble the domain payload before returning it.

Error cases: missing session, invalid episode number, continuity conflict, safety block, generation failure, timeout.

## 5) `confirmChoice`

```ts
interface ConfirmChoiceRequest {
  sessionId: string
  episodeId: string
  choiceKey: string
}

interface ConfirmChoiceResponse {
  choiceEvent: StoryChoiceEventRecord
  updatedSession: StorySessionRecord
}
```

The Edge Function resolves `choiceKey` to the internal `story_choices.id`. The unique `(session_id, episode_id)` constraint enforces one confirmed choice per episode.

## 6) `getCurrentStorySession`

```ts
interface GetCurrentStorySessionRequest {
  childProfileId: string
}

interface GetCurrentStorySessionResponse {
  session: StorySessionRecord | null
  currentEpisode: EpisodePayload | null
  selectedChoice: StoryChoiceEventRecord | null
}
```

Select the newest non-completed session deterministically by `updated_at desc, id desc`.

## 7) `resetStoryProgress`

```ts
interface ResetStoryProgressRequest {
  childProfileId?: string
  sessionId?: string
}

interface ResetStoryProgressResponse {
  session: StorySessionRecord
  currentEpisode: null
}
```

Validation: exactly one of `childProfileId` or `sessionId` is required. Reader preferences and child profile data must remain unchanged.

## 8) `updateReaderPreferences`

```ts
interface UpdateReaderPreferencesRequest {
  childProfileId: string
  readerPreferences: ReaderPreferences
}

interface UpdateReaderPreferencesResponse {
  childProfileId: string
  readerPreferences: ReaderPreferences
}
```

Validation: validate the complete reader preference shape and verify profile ownership.
