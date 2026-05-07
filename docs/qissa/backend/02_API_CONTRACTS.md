# QISSA MVP Future API Contracts (No Integration Yet)

Status: contract draft only for backend implementation stage.

## Shared notes
- Contracts are aligned with current `src/types/qissa.ts` domain model.
- Inputs should be validated server-side even if client validates first.
- Auth is future scope; request examples assume future authenticated parent context.


## Shared record shapes

```ts
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

interface ChildProfileRecord {
  id: string
  parentUserId: string | null
  displayName: string | null
  ageGroup: '3-5' | '6-8' | '9-10'
  language: 'ru' | 'uz' | 'kz'
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
  storyMode: 'one_time' | 'series'
  storyMood: 'bedtime' | 'kind_adventure'
  stylePackId: string
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

interface SafetyResultRecord {
  status: 'approved' | 'needs_review' | 'blocked'
  riskLevel: 'low' | 'medium' | 'high'
  flags: Record<string, boolean>
  requiredAction: 'publish' | 'regenerate' | 'fallback' | 'block'
}

interface EpisodeRecord {
  id: string
  sessionId: string
  episodeNo: number
  title: string
  storyText: string
  language: 'ru' | 'uz' | 'kz'
  mood: 'bedtime' | 'kind_adventure'
  stylePackId: string
  generationSource: 'local_mock' | 'edge_story_agent'
  safetyStatus: 'approved' | 'needs_review' | 'blocked'
  safetyResult: SafetyResultRecord
  vocabulary: VocabularyItem[]
  nextEpisodePreview: string | null
  createdAt: string
}

interface StoryChoiceRecord {
  id: string // DB row UUID
  episodeId: string
  choiceKey: string // maps to story_choices.choice_id text
  text: string
  effectSummary: string
  statePatch: Record<string, unknown>
  valueAlignment: string[]
  displayOrder: number
}

interface StoryChoiceEventRecord {
  id: string
  sessionId: string
  episodeId: string
  storyChoiceId: string // DB FK -> story_choices.id
  selectedAt: string
  statePatchApplied: Record<string, unknown>
}
```

## 1) `createChildProfile`
Purpose: create initial child story setup profile.

```ts
interface CreateChildProfileRequest {
  ageGroup: '3-5' | '6-8' | '9-10'
  language: 'ru' | 'uz' | 'kz'
  heroType: 'girl_hero' | 'boy_hero' | 'animal' | 'magical_hero' | 'custom'
  customHeroName?: string
  readerPreferences?: Partial<ReaderPreferences>
}

interface CreateChildProfileResponse {
  childProfile: ChildProfileRecord
}
```
Validation notes: enum checks; `customHeroName` required only for `heroType='custom'`.
Error cases: invalid payload, conflict, unauthorized (future), internal error.
Future auth notes: set `parent_user_id=auth.uid()` in trusted backend path.

## 2) `updateChildProfile`
Purpose: update editable profile fields without resetting story progress automatically.

```ts
interface UpdateChildProfileRequest {
  childProfileId: string
  patch: Partial<Pick<ChildProfileRecord, 'displayName' | 'ageGroup' | 'language' | 'heroType' | 'customHeroName' | 'defaultVoicePresetId'>>
}

interface UpdateChildProfileResponse {
  childProfile: ChildProfileRecord
}
```
Validation notes: whitelist patch fields only.
Error cases: not found, forbidden ownership, invalid transitions.
Future auth notes: verify profile ownership before update.

## 3) `createStorySession`
Purpose: start a new story lifecycle instance (one-time or series).

```ts
interface CreateStorySessionRequest {
  childProfileId: string
  storyMode: 'one_time' | 'series'
  storyMood: 'bedtime' | 'kind_adventure'
  stylePackId: string
}

interface CreateStorySessionResponse {
  storySession: StorySessionRecord
}
```
Validation notes: verify child profile exists and is owned.
Error cases: invalid mode/mood/style, not found, forbidden.
Future auth notes: enforce ownership through RLS + function checks.

## 4) `generateEpisode`
Purpose: create/get next episode payload for a session.

```ts
interface GenerateEpisodeRequest {
  sessionId: string
  requestedEpisodeNo: number
  previousChoiceEventId?: string
}

interface GenerateEpisodeResponse {
  episode: EpisodeRecord
  choices: StoryChoiceRecord[]
  safetyResult: SafetyResultRecord
  vocabulary: VocabularyItem[]
}
```
Validation notes: `requestedEpisodeNo >= 1`; ensure continuity for series mode.
Error cases: session missing, invalid episode number, safety blocked, generation failure.
Future auth notes: parent can request; write path executed in trusted edge function.

## 5) `confirmChoice`
Purpose: persist selected choice and update session memory state.

```ts
interface ConfirmChoiceRequest {
  sessionId: string
  episodeId: string
  storyChoiceId: string
}

interface ConfirmChoiceResponse {
  choiceEvent: StoryChoiceEventRecord
  updatedSession: StorySessionRecord
}
```
Validation notes: verify choice belongs to episode/session; reject duplicates.
Error cases: conflict on duplicate confirmation, not found, forbidden.
Future auth notes: only owner may confirm choices for owned session.

## 6) `getCurrentStorySession`
Purpose: load active session and current episode context for resume flow.

```ts
interface GetCurrentStorySessionRequest {
  childProfileId: string
}

interface GetCurrentStorySessionResponse {
  session: StorySessionRecord | null
  currentEpisode: EpisodeRecord | null
  choices: StoryChoiceRecord[]
  selectedChoice?: StoryChoiceEventRecord | null // selected DB choice event (contains storyChoiceId)
}
```
Validation notes: prefer newest non-completed session; deterministic ordering.
Error cases: forbidden ownership, malformed childProfileId.
Future auth notes: scoped to authenticated parent ownership.

## 7) `resetStoryProgress`
Purpose: reset progress while preserving child profile.

```ts
interface ResetStoryProgressRequest {
  childProfileId?: string
  sessionId?: string
}

interface ResetStoryProgressResponse {
  session: StorySessionRecord
  currentEpisode: null
  choices: []
}
```
Validation notes: exactly one of `childProfileId` or `sessionId` required.
Error cases: ambiguous request, not found, forbidden.
Future auth notes: operation must be owner-restricted.

## 8) `updateReaderPreferences`
Purpose: save reader accessibility settings independent from story progress.

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
Validation notes: full shape validation for text size/font/theme/etc.
Error cases: invalid preference values, not found, forbidden.
Future auth notes: owner-only update.
