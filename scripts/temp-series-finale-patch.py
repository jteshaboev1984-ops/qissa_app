from pathlib import Path
import re

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one literal match, found {count}')
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, repl):
    text = read(path)
    updated, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'{path}: expected one regex match, found {count}: {pattern}')
    write(path, updated)


# 1) Domain patch can explicitly clear a resolved serialized arc.
replace_once(
    'src/contracts/storyContracts.ts',
    "export interface StatePatch {\n  last_event?: string\n  new_friend?: string\n  hero_trait?: string\n  open_arc?: string\n",
    "export interface StatePatch {\n  last_event?: string\n  new_friend?: string\n  hero_trait?: string\n  /** null explicitly closes the currently active serialized arc. */\n  open_arc?: string | null\n",
)
replace_once(
    'src/contracts/storyContracts.ts',
    "export interface SeriesState {\n  id: string\n  /** Stable identity for the whole continuing series. */\n  childProfileId: string\n",
    "export interface SeriesState {\n  /** Stable identity for the whole continuing series. */\n  id: string\n  childProfileId: string\n",
)

# 2) Series lifecycle: at most 10 bedtime sessions, and session 10 is the finale.
replace_once(
    'src/lib/memoryAgent.ts',
    "import type { ChoiceHistoryEntry, Episode, EpisodeChoice, OnboardingSelections, SeriesState } from '../types/qissa'\n\n",
    "import type { ChoiceHistoryEntry, Episode, EpisodeChoice, OnboardingSelections, SeriesState } from '../types/qissa'\n\nexport const MAX_SERIES_SESSIONS = 10\n\n",
)
replace_once(
    'src/lib/memoryAgent.ts',
    "export const seriesSessionIndex = (seriesState: SeriesState): number =>\n  Number.isInteger(seriesState.sessionIndex) && (seriesState.sessionIndex ?? 0) > 0\n    ? seriesState.sessionIndex as number\n    : 1\n",
    "export const seriesSessionIndex = (seriesState: SeriesState): number =>\n  Number.isInteger(seriesState.sessionIndex) && (seriesState.sessionIndex ?? 0) > 0\n    ? Math.min(seriesState.sessionIndex as number, MAX_SERIES_SESSIONS)\n    : 1\n\nexport const isFinalSeriesSession = (seriesState: SeriesState): boolean =>\n  seriesSessionIndex(seriesState) >= MAX_SERIES_SESSIONS\n\nexport const canStartNextSeriesSession = (seriesState: SeriesState): boolean =>\n  seriesState.episodeCount >= 2 && !isFinalSeriesSession(seriesState)\n",
)
replace_once(
    'src/lib/memoryAgent.ts',
    "export function createNextSeriesSessionState(seriesState: SeriesState): SeriesState {\n  return {\n    ...seriesState,\n    sessionId: uniqueId('session'),\n    sessionIndex: seriesSessionIndex(seriesState) + 1,\n    episodeCount: 0,\n  }\n}\n",
    "export function createNextSeriesSessionState(seriesState: SeriesState): SeriesState {\n  if (!canStartNextSeriesSession(seriesState)) {\n    throw new Error('Series cannot advance beyond its completed ten-session arc.')\n  }\n\n  return {\n    ...seriesState,\n    sessionId: uniqueId('session'),\n    sessionIndex: seriesSessionIndex(seriesState) + 1,\n    episodeCount: 0,\n  }\n}\n",
)
replace_once(
    'src/lib/memoryAgent.ts',
    "    activeArc: patch.open_arc ?? seriesState.activeArc,\n",
    "    activeArc: patch.open_arc === null ? '' : patch.open_arc ?? seriesState.activeArc,\n",
)
replace_once(
    'src/lib/memoryAgent.ts',
    "    activeArc: choice.state_patch.open_arc ?? seriesState.activeArc,\n",
    "    activeArc: choice.state_patch.open_arc === null ? '' : choice.state_patch.open_arc ?? seriesState.activeArc,\n",
)

# 3) Local archive must keep every bedtime session, not overwrite by stable series_id.
replace_once(
    'src/lib/storyArchive.ts',
    "import { playbackProgress } from './playbackProgress'\n",
    "import { playbackProgress } from './playbackProgress'\nimport { seriesSessionId, seriesSessionIndex } from './memoryAgent'\n",
)
replace_once('src/lib/storyArchive.ts', "const MAX_ARCHIVE_ITEMS = 8\n", "const MAX_ARCHIVE_ITEMS = 20\n")
regex_once(
    'src/lib/storyArchive.ts',
    r"const episodeNumberFrom = \(episode: Episode, seriesState: SeriesState \| null\): number => \{.*?\n\}\n\n",
    "const episodeNumberFrom = (selections: OnboardingSelections, episode: Episode, seriesState: SeriesState | null): number => {\n  if (selections.storyMode === 'series' && seriesState) return seriesSessionIndex(seriesState)\n  return episode.episode_id.startsWith('ep-2') ? 1 : 1\n}\n\n",
)
replace_once(
    'src/lib/storyArchive.ts',
    "    id: episode.series_id,\n",
    "    id: seriesState ? seriesSessionId(seriesState) : `${episode.series_id}:${episode.episode_id}`,\n",
)
replace_once(
    'src/lib/storyArchive.ts',
    "    episodeNumber: episodeNumberFrom(episode, seriesState),\n",
    "    episodeNumber: episodeNumberFrom(selections, episode, seriesState),\n",
)

# 4) Story AI context rejects session 11+ and exposes finale metadata.
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "export type StoryMood = 'bedtime' | 'kind_adventure'\n",
    "export type StoryMood = 'bedtime' | 'kind_adventure'\nexport const MAX_SERIES_SESSIONS = 10\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "  sessionIndex: number\n  episodeIndex: 1 | 2\n",
    "  sessionIndex: number\n  seriesSessionsRemaining: number\n  isFinalSeriesSession: boolean\n  episodeIndex: 1 | 2\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "export type FinalStatePatch = {\n  last_event?: string\n  new_friend?: string\n  hero_trait?: string\n  open_arc?: string\n",
    "export type FinalStatePatch = {\n  last_event?: string\n  new_friend?: string\n  hero_trait?: string\n  open_arc?: string | null\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "  const sessionIndex = typeof seriesState.sessionIndex === 'number' && Number.isInteger(seriesState.sessionIndex) && seriesState.sessionIndex > 0\n    ? Math.min(seriesState.sessionIndex, 10_000)\n    : 1\n",
    "  const rawSessionIndex = typeof seriesState.sessionIndex === 'number' && Number.isInteger(seriesState.sessionIndex) && seriesState.sessionIndex > 0\n    ? seriesState.sessionIndex\n    : 1\n  if (storyMode === 'series' && rawSessionIndex > MAX_SERIES_SESSIONS) return null\n  const sessionIndex = storyMode === 'series' ? rawSessionIndex : 1\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "    sessionId,\n    sessionIndex,\n    episodeIndex: isContinuation ? 2 : 1,\n",
    "    sessionId,\n    sessionIndex,\n    seriesSessionsRemaining: storyMode === 'series' ? Math.max(0, MAX_SERIES_SESSIONS - sessionIndex) : 0,\n    isFinalSeriesSession: storyMode === 'series' && sessionIndex === MAX_SERIES_SESSIONS,\n    episodeIndex: isContinuation ? 2 : 1,\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "  const openArc = compactText(patch.open_arc, 120)\n",
    "  const openArc = patch.open_arc === null ? null : compactText(patch.open_arc, 120)\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "  if (openArc) result.open_arc = openArc\n",
    "  if (openArc === null) result.open_arc = null\n  else if (openArc) result.open_arc = openArc\n",
)

# 5) Architect: genre-appropriate serialized arc discipline and deterministic final closure.
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    'When Episode 1 starts a later bedtime session in an existing series, use remembered canon, relationships and prior consequences as continuity callbacks, then introduce one fresh child-scale goal for tonight. Do not replay or reopen a problem that the previous bedtime session already solved.',\n    'For Episode 2, continue after the already-confirmed resolution bridge, use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',\n",
    "    'When Episode 1 starts a later bedtime session in an existing series, use remembered canon, relationships and prior consequences as continuity callbacks, then introduce one fresh child-scale goal for tonight. Do not replay or reopen a problem that the previous bedtime session already solved.',\n    'A serialized QISSA story has at most 10 bedtime sessions. Sessions 1-6 may establish or develop one gentle long-running arc while still resolving each night local goal. Sessions 7-8 must increasingly pay off existing clues and relationships and must not introduce a new major unresolved arc. Session 9 is penultimate: resolve secondary threads and position the existing central arc for its finale without adding sequel bait. Session 10 is the finale: resolve the current goal plus every meaningful unresolved thread carried in active_arc or compact canon, close the active arc, and end without a cliffhanger, future quest, mystery tease or promise of session 11.',\n    'In final session Episode 2, state_patch.open_arc must be null to mark the serialized arc closed. The ending may leave the world emotionally open for imagination, but it must not leave a pending plot obligation.',\n    'For Episode 2, continue after the already-confirmed resolution bridge, use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "  if (context.episodeIndex === 1) {\n",
    "  if (context.storyMode === 'series' && context.isFinalSeriesSession && context.episodeIndex === 2 && patchIsValid(value.state_patch) && value.state_patch.open_arc !== null) {\n    errors.push('final_series_arc_not_closed')\n  }\n\n  if (context.episodeIndex === 1) {\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    task: context.storyMode === 'one_time'\n      ? 'Plan one self-contained bedtime story with one gentle decision and its two safe branch consequences.'\n      : context.episodeIndex === 1\n        ? context.hasSeriesMemory\n          ? `Plan bedtime series session ${context.sessionIndex}, segment 1, using prior canon as continuity while starting one fresh story goal and two branch consequences.`\n          : 'Plan bedtime series session 1, segment 1 and its two branch consequences.'\n        : `Plan bedtime series session ${context.sessionIndex}, segment 2 after the confirmed choice consequence.`,\n",
    "    task: context.storyMode === 'one_time'\n      ? 'Plan one self-contained bedtime story with one gentle decision and its two safe branch consequences.'\n      : context.isFinalSeriesSession\n        ? context.episodeIndex === 1\n          ? 'Plan final bedtime series session 10, segment 1. Use prior canon as payoff material, begin the final child-scale goal, and offer two safe actions that both lead toward a fully closed ending in segment 2.'\n          : 'Plan final bedtime series session 10, segment 2. Resolve tonight central goal and all meaningful unresolved serialized threads, close active_arc with null, and end with a calm definitive coda and no sequel hook.'\n        : context.episodeIndex === 1\n          ? context.hasSeriesMemory\n            ? `Plan bedtime series session ${context.sessionIndex}, segment 1, using prior canon as continuity while starting one fresh story goal and two branch consequences.`\n            : 'Plan bedtime series session 1, segment 1 and its two branch consequences.'\n          : `Plan bedtime series session ${context.sessionIndex}, segment 2 after the confirmed choice consequence.`,\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    series_session_index: context.sessionIndex,\n    segment: context.episodeIndex,\n",
    "    series_session_index: context.sessionIndex,\n    series_session_limit: 10,\n    series_sessions_remaining_after_tonight: context.seriesSessionsRemaining,\n    final_series_session: context.isFinalSeriesSession,\n    segment: context.episodeIndex,\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    'For Episode 2, begin after the confirmed choice resolution already happened. Do not replay that action. Resolve the same central goal and finish calmly without a cliffhanger.',\n",
    "    'For Episode 2, begin after the confirmed choice resolution already happened. Do not replay that action. Resolve the same central goal and finish calmly without a cliffhanger.',\n    'If this is final series session 10, make the prose feel like a true finale: pay off remembered clues and relationships that matter, settle the active serialized arc, avoid sequel bait, and finish with emotional closure. Do not invent a new unresolved question in the final paragraphs.',\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    style_pack: context.stylePackId,\n    hard_story_word_range: { minimum: minimumWords, maximum: maximumWords },\n",
    "    style_pack: context.stylePackId,\n    series_session_index: context.sessionIndex,\n    final_series_session: context.isFinalSeriesSession,\n    hard_story_word_range: { minimum: minimumWords, maximum: maximumWords },\n",
)

# 6) story-state: database/API guard at 10 sessions and explicit row typing.
replace_once(
    'supabase/functions/story-state/index.ts',
    "const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'\nconst AUDIO_BUCKET = 'story-audio'\n",
    "const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'\nconst AUDIO_BUCKET = 'story-audio'\nconst MAX_SERIES_SESSIONS = 10\n",
)
replace_once(
    'supabase/functions/story-state/index.ts',
    "  const sessionIndex = typeof seriesState?.sessionIndex === 'number' && Number.isInteger(seriesState.sessionIndex) && seriesState.sessionIndex > 0\n    ? Math.min(seriesState.sessionIndex, 10_000)\n    : 1\n  return { seriesId, sessionId, sessionIndex }\n",
    "  const sessionIndex = typeof seriesState?.sessionIndex === 'number' && Number.isInteger(seriesState.sessionIndex) && seriesState.sessionIndex > 0\n    ? seriesState.sessionIndex\n    : 1\n  return { seriesId, sessionId, sessionIndex, withinSeriesLimit: sessionIndex <= MAX_SERIES_SESSIONS }\n",
)
replace_once(
    'supabase/functions/story-state/index.ts',
    "  if (!identity.seriesId || !identity.sessionId) return fail('invalid_story_identity', 422, origin)\n",
    "  if (!identity.seriesId || !identity.sessionId || !identity.withinSeriesLimit) return fail('invalid_story_identity', 422, origin)\n",
)
replace_once(
    'supabase/functions/story-state/index.ts',
    "  const identity = storyIdentity(seriesState)\n  const { data: session, error: sessionError } = await admin\n",
    "  const identity = storyIdentity(seriesState)\n  if (!identity.seriesId || !identity.sessionId || !identity.withinSeriesLimit) return fail('invalid_story_identity', 422, origin)\n  const { data: session, error: sessionError } = await admin\n",
)
# Add concrete library row types before listLibrary.
replace_once(
    'supabase/functions/story-state/index.ts',
    "\n\nasync function listLibrary(input: StoryStateRequest, origin: string | null) {\n",
    "\n\ntype LibrarySessionRow = {\n  id: string\n  client_session_id: string\n  client_series_id: string | null\n  series_session_index: number\n  story_mode: StoryMode\n  story_mood: StoryMood\n  style_pack_id: string\n  status: string\n  title: string | null\n  summary: string | null\n  client_state: unknown\n  selection_snapshot: unknown\n  is_archived: boolean\n  created_at: string\n  updated_at: string\n  completed_at: string | null\n}\n\ntype LibraryEpisodeRow = {\n  session_id: string\n  episode_no: number\n  domain_payload: unknown\n  created_at: string\n}\n\nasync function listLibrary(input: StoryStateRequest, origin: string | null) {\n",
)
replace_once(
    'supabase/functions/story-state/index.ts',
    "  if (sessionError) return fail('library_session_load_failed', 500, origin)\n  if (!sessions || sessions.length === 0) return json({ sessions: [] }, 200, origin)\n\n  const sessionIds = sessions.map((session) => session.id)\n",
    "  if (sessionError) return fail('library_session_load_failed', 500, origin)\n  const sessionRows = (sessions ?? []) as LibrarySessionRow[]\n  if (sessionRows.length === 0) return json({ sessions: [] }, 200, origin)\n\n  const sessionIds = sessionRows.map((session: LibrarySessionRow) => session.id)\n",
)
replace_once(
    'supabase/functions/story-state/index.ts',
    "  if (episodeError) return fail('library_episode_load_failed', 500, origin)\n  const bySession = new Map<string, JsonRecord[]>()\n  for (const row of episodes ?? []) {\n",
    "  if (episodeError) return fail('library_episode_load_failed', 500, origin)\n  const episodeRows = (episodes ?? []) as LibraryEpisodeRow[]\n  const bySession = new Map<string, JsonRecord[]>()\n  for (const row of episodeRows) {\n",
)
replace_once(
    'supabase/functions/story-state/index.ts',
    "    sessions: sessions.map((session) => ({\n",
    "    sessions: sessionRows.map((session: LibrarySessionRow) => ({\n",
)

# 7) Database hard gate: no session index beyond 10.
replace_once(
    'docs/qissa/backend/migrations/20260914_000016_add_series_session_library.sql',
    "      check (series_session_index >= 1);\n",
    "      check (series_session_index between 1 and 10);\n",
)

# 8) App: advance the same durable series to the next bedtime session instead of ending after every session.
replace_once(
    'src/App.tsx',
    "import { applyChoiceToSeriesState, applyEpisodeToSeriesState, createInitialSeriesState } from './lib/memoryAgent'\n",
    "import { applyChoiceToSeriesState, applyEpisodeToSeriesState, canStartNextSeriesSession, createInitialSeriesState, createNextSeriesSessionState, MAX_SERIES_SESSIONS, seriesSessionIndex } from './lib/memoryAgent'\n",
)
insert_after = "  const handleContinueNextEpisode = async () => {\n"
idx = read('src/App.tsx').find(insert_after)
if idx < 0:
    raise SystemExit('src/App.tsx: handleContinueNextEpisode not found')
# Insert new handler before handleOpenStory, after existing continuation function block using a stable marker.
replace_once(
    'src/App.tsx',
    "  const handleOpenStory = () => {\n",
    "  const handleStartNextSeriesSession = async () => {\n    if (\n      !selections ||\n      !seriesState ||\n      selections.storyMode !== 'series' ||\n      !canStartNextSeriesSession(seriesState) ||\n      generationLockRef.current\n    ) return\n\n    generationLockRef.current = true\n    setGenerationError(false)\n    setGenerationStatus('continuing')\n\n    const nextSessionState = createNextSeriesSessionState(seriesState)\n    archiveCurrentStory()\n\n    try {\n      const { episode: firstEpisode } = await storyService.generateEpisode({ selections, seriesState: nextSessionState })\n      const nextSeriesState = applyEpisodeToSeriesState(nextSessionState, firstEpisode)\n\n      setEpisode(firstEpisode)\n      setSeriesState(nextSeriesState)\n      localPersistence.saveCurrentEpisode(firstEpisode)\n      localPersistence.saveSeriesState(nextSeriesState)\n      setArchiveItems(storyArchive.load())\n      updateScreen('story')\n    } catch (error) {\n      console.error('Failed to start next series session', error)\n      setGenerationError(true)\n    } finally {\n      generationLockRef.current = false\n      setGenerationStatus('idle')\n    }\n  }\n\n  const handleOpenStory = () => {\n",
)
replace_once(
    'src/App.tsx',
    "            onContinueStory={handleOpenStory}\n            onResetStory={handleResetStory}\n",
    "            onContinueStory={handleOpenStory}\n            onStartNextSeriesSession={handleStartNextSeriesSession}\n            onResetStory={handleResetStory}\n",
)
replace_once(
    'src/App.tsx',
    "            onOpenStory={handleOpenStory}\n            onOpenArchivedStory={handleOpenArchivedStory}\n            onCreateStory={handleStartStory}\n",
    "            onOpenStory={handleOpenStory}\n            onStartNextSeriesSession={handleStartNextSeriesSession}\n            onOpenArchivedStory={handleOpenArchivedStory}\n            onCreateStory={handleStartStory}\n",
)
replace_once(
    'src/App.tsx',
    "            onContinueNextEpisode={handleContinueNextEpisode}\n            readerPreferences={readerPreferences}\n",
    "            onContinueNextEpisode={handleContinueNextEpisode}\n            onStartNextSeriesSession={handleStartNextSeriesSession}\n            seriesSessionIndex={seriesState ? seriesSessionIndex(seriesState) : 1}\n            maxSeriesSessions={MAX_SERIES_SESSIONS}\n            readerPreferences={readerPreferences}\n",
)

# 9) Home: completed bedtime session offers next series episode until 10/10.
replace_once(
    'src/screens/HomeScreen.tsx',
    "import { t } from '../lib/i18n'\n",
    "import { t } from '../lib/i18n'\nimport { canStartNextSeriesSession, MAX_SERIES_SESSIONS, seriesSessionIndex } from '../lib/memoryAgent'\n",
)
replace_once(
    'src/screens/HomeScreen.tsx',
    "  onContinueStory: () => void\n  onResetStory: () => void\n",
    "  onContinueStory: () => void\n  onStartNextSeriesSession: () => void\n  onResetStory: () => void\n",
)
replace_once(
    'src/screens/HomeScreen.tsx',
    "  onContinueStory,\n  onResetStory,\n",
    "  onContinueStory,\n  onStartNextSeriesSession,\n  onResetStory,\n",
)
replace_once(
    'src/screens/HomeScreen.tsx',
    "  const isTomorrowMemoryState = isSeriesMode && storyStatus === 'episode_1_choice_saved'\n",
    "  const isTomorrowMemoryState = isSeriesMode && storyStatus === 'episode_1_choice_saved'\n  const currentSeriesSession = seriesState ? seriesSessionIndex(seriesState) : 1\n  const canStartNextSession = Boolean(isSeriesMode && seriesState && canStartNextSeriesSession(seriesState))\n  const isWholeSeriesFinal = Boolean(isSeriesMode && storyStatus === 'completed' && currentSeriesSession >= MAX_SERIES_SESSIONS)\n",
)
replace_once(
    'src/screens/HomeScreen.tsx',
    "    if (storyStatus === 'completed') return isSeriesMode ? t(language, 'home.open_last_story') : t(language, 'home.reopen_story')\n",
    "    if (storyStatus === 'completed') {\n      if (isSeriesMode && canStartNextSession) return language === 'ru' ? `Начать серию ${currentSeriesSession + 1} из ${MAX_SERIES_SESSIONS}` : language === 'uz' ? `${currentSeriesSession + 1}/${MAX_SERIES_SESSIONS}-qismni boshlash` : `${currentSeriesSession + 1}/${MAX_SERIES_SESSIONS}-бөлімді бастау`\n      return isSeriesMode ? t(language, 'home.open_last_story') : t(language, 'home.reopen_story')\n    }\n",
)
replace_once(
    'src/screens/HomeScreen.tsx',
    "  const primaryAction = storyStatus === 'not_started' ? onCreateFirstSeries : onContinueStory\n",
    "  const primaryAction = storyStatus === 'not_started'\n    ? onCreateFirstSeries\n    : storyStatus === 'completed' && canStartNextSession\n      ? onStartNextSeriesSession\n      : onContinueStory\n",
)
replace_once(
    'src/screens/HomeScreen.tsx',
    "          ? (isSeriesMode ? t(language, 'home.completed_series_body') : t(language, 'home.one_time_completed_body'))\n",
    "          ? isSeriesMode\n            ? isWholeSeriesFinal\n              ? (language === 'ru' ? 'Финальная серия завершена. Начатые сюжетные линии закрыты, и эту сказку можно перечитывать целиком.' : language === 'uz' ? 'Yakuniy qism tugadi. Boshlangan voqealar yakunlandi va bu ertakni qayta o‘qish mumkin.' : 'Соңғы бөлім аяқталды. Басталған желілер түйінделді, енді ертегіні қайта оқуға болады.')\n              : (language === 'ru' ? `Серия ${currentSeriesSession} из ${MAX_SERIES_SESSIONS} завершена. Выборы и важные события сохранены для следующей серии.` : language === 'uz' ? `${currentSeriesSession}/${MAX_SERIES_SESSIONS}-qism tugadi. Tanlovlar va muhim voqealar keyingi qism uchun saqlandi.` : `${currentSeriesSession}/${MAX_SERIES_SESSIONS}-бөлім аяқталды. Таңдаулар мен маңызды оқиғалар келесі бөлімге сақталды.`)\n            : t(language, 'home.one_time_completed_body')\n",
)

# 10) Library: show real series-session number and advance same series.
replace_once(
    'src/screens/LibraryScreen.tsx',
    "import { deriveStoryStatus } from '../lib/storyStatus'\n",
    "import { deriveStoryStatus } from '../lib/storyStatus'\nimport { canStartNextSeriesSession, MAX_SERIES_SESSIONS, seriesSessionIndex } from '../lib/memoryAgent'\n",
)
replace_once(
    'src/screens/LibraryScreen.tsx',
    "  onOpenStory,\n  onOpenArchivedStory,\n",
    "  onOpenStory,\n  onStartNextSeriesSession,\n  onOpenArchivedStory,\n",
)
replace_once(
    'src/screens/LibraryScreen.tsx',
    "  onOpenStory: () => void\n  onOpenArchivedStory: (item: StoryArchiveItem) => void\n",
    "  onOpenStory: () => void\n  onStartNextSeriesSession: () => void\n  onOpenArchivedStory: (item: StoryArchiveItem) => void\n",
)
replace_once(
    'src/screens/LibraryScreen.tsx',
    "  const episodeNumber = Math.max(seriesState?.episodeCount ?? (episode?.episode_id.startsWith('ep-2') ? 2 : 1), 1)\n  const completed = status === 'completed'\n",
    "  const seriesEpisodeNumber = seriesState && selections.storyMode === 'series' ? seriesSessionIndex(seriesState) : 1\n  const canStartNextSession = Boolean(seriesState && selections.storyMode === 'series' && canStartNextSeriesSession(seriesState))\n  const completed = status === 'completed'\n",
)
replace_once(
    'src/screens/LibraryScreen.tsx',
    "        <StylePackCover stylePack={pack} variant=\"hero\" title={episode.title} subtitle={`${pack.title[language]} · ${labels.episode} ${episodeNumber}`} />\n",
    "        <StylePackCover stylePack={pack} variant=\"hero\" title={episode.title} subtitle={`${pack.title[language]} · ${labels.episode} ${seriesEpisodeNumber}${selections.storyMode === 'series' ? ` / ${MAX_SERIES_SESSIONS}` : ''}`} />\n",
)
replace_once(
    'src/screens/LibraryScreen.tsx',
    "              <p className=\"text-sm font-bold text-[#3d382c]\">{labels.episode} {episodeNumber}</p>\n",
    "              <p className=\"text-sm font-bold text-[#3d382c]\">{labels.episode} {seriesEpisodeNumber}{selections.storyMode === 'series' ? ` / ${MAX_SERIES_SESSIONS}` : ''}</p>\n",
)
replace_once(
    'src/screens/LibraryScreen.tsx',
    "            onClick={onOpenStory}\n",
    "            onClick={completed && canStartNextSession ? onStartNextSeriesSession : onOpenStory}\n",
)
replace_once(
    'src/screens/LibraryScreen.tsx',
    "              : storyActionLabel(language, status, selections.storyMode)}\n",
    "              : completed && canStartNextSession\n                ? (language === 'ru' ? `Начать серию ${seriesEpisodeNumber + 1} из ${MAX_SERIES_SESSIONS}` : language === 'uz' ? `${seriesEpisodeNumber + 1}/${MAX_SERIES_SESSIONS}-qismni boshlash` : `${seriesEpisodeNumber + 1}/${MAX_SERIES_SESSIONS}-бөлімді бастау`)\n                : storyActionLabel(language, status, selections.storyMode)}\n",
)

# 11) Story reader: episode 2 ends tonight; only session 10 ends the whole serial.
replace_once(
    'src/screens/StoryScreen.tsx',
    "  onContinueNextEpisode?: () => void\n  isChoiceSavedForCurrentEpisode?: boolean\n",
    "  onContinueNextEpisode?: () => void\n  onStartNextSeriesSession?: () => void\n  seriesSessionIndex?: number\n  maxSeriesSessions?: number\n  isChoiceSavedForCurrentEpisode?: boolean\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "  onContinueNextEpisode,\n  isChoiceSavedForCurrentEpisode = false,\n",
    "  onContinueNextEpisode,\n  onStartNextSeriesSession,\n  seriesSessionIndex = 1,\n  maxSeriesSessions = 10,\n  isChoiceSavedForCurrentEpisode = false,\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "  const isSeriesFinal = isSeriesMode && isEpisodeTwo\n  const hasVocabulary = episode.vocabulary.length > 0\n  const showChoicePanel = episode.choices.length > 0 && !isSeriesFinal\n\n  const hasSavedChoiceForStage = Boolean(isChoiceLocked && !isSeriesFinal)\n",
    "  const isSeriesSessionComplete = isSeriesMode && isEpisodeTwo\n  const isWholeSeriesFinal = isSeriesSessionComplete && seriesSessionIndex >= maxSeriesSessions\n  const hasVocabulary = episode.vocabulary.length > 0\n  const showChoicePanel = episode.choices.length > 0 && !isSeriesSessionComplete\n\n  const hasSavedChoiceForStage = Boolean(isChoiceLocked && !isSeriesSessionComplete)\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "  const canShowVocabulary = hasVocabulary && (isSeriesFinal || storyStage === 'resolution')\n",
    "  const canShowVocabulary = hasVocabulary && (isSeriesSessionComplete || storyStage === 'resolution')\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "      {storyStage === 'reading' || isSeriesFinal ? (\n",
    "      {storyStage === 'reading' || isSeriesSessionComplete ? (\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "  const renderSeriesFinal = () => {\n    if (!isSeriesFinal) return null\n\n    return (\n      <>\n        {renderNarrativeCard()}\n        <section className=\"q-card space-y-4 p-5 text-center\">\n          <p className=\"q-label\">QISSA</p>\n          <h3 className=\"q-heading text-3xl font-bold leading-tight\">{t(language, 'story.series_final_title')}</h3>\n          <p className=\"mx-auto max-w-xs text-sm leading-6 text-[#625846]\">{t(language, 'story.series_final_body')}</p>\n          <div className=\"grid gap-2.5 pt-1\">\n            <button className=\"q-primary w-full\" onClick={onStartNewStory}>\n              {t(language, 'story.start_new_story')}\n            </button>\n            <button className=\"q-secondary w-full\" onClick={handleReadAgain}>\n              {t(language, 'story.read_again')}\n            </button>\n            <button className=\"q-secondary w-full\" onClick={onBackHome}>\n              {t(language, 'story.back_home')}\n            </button>\n          </div>\n        </section>\n      </>\n    )\n  }\n",
    "  const renderSeriesSessionComplete = () => {\n    if (!isSeriesSessionComplete) return null\n\n    const title = isWholeSeriesFinal\n      ? (language === 'ru' ? 'Сказка завершена' : language === 'uz' ? 'Ertak yakunlandi' : 'Ертегі аяқталды')\n      : (language === 'ru' ? `Серия ${seriesSessionIndex} завершилась` : language === 'uz' ? `${seriesSessionIndex}-qism yakunlandi` : `${seriesSessionIndex}-бөлім аяқталды`)\n    const body = isWholeSeriesFinal\n      ? (language === 'ru' ? 'Финальная серия закрыла начатые сюжетные линии. Историю можно перечитать или начать новую сказку.' : language === 'uz' ? 'Yakuniy qism boshlangan voqealarni tugatdi. Ertakni qayta o‘qish yoki yangi hikoya boshlash mumkin.' : 'Соңғы бөлім басталған оқиғаларды түйіндеді. Ертегіні қайта оқуға немесе жаңасын бастауға болады.')\n      : (language === 'ru' ? `QISSA сохранила важные события и выборы. Следующая серия будет ${seriesSessionIndex + 1} из ${maxSeriesSessions}.` : language === 'uz' ? `QISSA muhim voqealar va tanlovlarni saqladi. Keyingi qism ${seriesSessionIndex + 1}/${maxSeriesSessions} bo‘ladi.` : `QISSA маңызды оқиғалар мен таңдауларды сақтады. Келесі бөлім ${seriesSessionIndex + 1}/${maxSeriesSessions} болады.`)\n\n    return (\n      <>\n        {renderNarrativeCard()}\n        <section className=\"q-card space-y-4 p-5 text-center\">\n          <p className=\"q-label\">QISSA · {seriesSessionIndex}/{maxSeriesSessions}</p>\n          <h3 className=\"q-heading text-3xl font-bold leading-tight\">{title}</h3>\n          <p className=\"mx-auto max-w-xs text-sm leading-6 text-[#625846]\">{body}</p>\n          <div className=\"grid gap-2.5 pt-1\">\n            {isWholeSeriesFinal ? (\n              <button className=\"q-primary w-full\" onClick={onStartNewStory}>\n                {t(language, 'story.start_new_story')}\n              </button>\n            ) : (\n              <button className=\"q-primary w-full\" onClick={onStartNextSeriesSession}>\n                {language === 'ru' ? `Начать серию ${seriesSessionIndex + 1}` : language === 'uz' ? `${seriesSessionIndex + 1}-qismni boshlash` : `${seriesSessionIndex + 1}-бөлімді бастау`}\n              </button>\n            )}\n            <button className=\"q-secondary w-full\" onClick={handleReadAgain}>\n              {t(language, 'story.read_again')}\n            </button>\n            <button className=\"q-secondary w-full\" onClick={onBackHome}>\n              {t(language, 'story.back_home')}\n            </button>\n          </div>\n        </section>\n      </>\n    )\n  }\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "    if (!(isChoiceLocked && !isSeriesFinal && storyStage === 'reading')) return null\n",
    "    if (!(isChoiceLocked && !isSeriesSessionComplete && storyStage === 'reading')) return null\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "    if (isSeriesFinal) return renderSeriesFinal()\n",
    "    if (isSeriesSessionComplete) return renderSeriesSessionComplete()\n",
)

# 12) Contract test protects the ten-session cap and closure semantics.
replace_once(
    'scripts/check-story-library-persistence.mjs',
    "const localAgent = read('src/lib/storyAgent.ts')\n",
    "const localAgent = read('src/lib/storyAgent.ts')\nconst archive = read('src/lib/storyArchive.ts')\nconst home = read('src/screens/HomeScreen.tsx')\nconst storyScreen = read('src/screens/StoryScreen.tsx')\n",
)
replace_once(
    'scripts/check-story-library-persistence.mjs',
    "requireCondition(/series_session_index\\s+integer\\s+not null\\s+default 1/i.test(migration), 'Migration must add 1-based series_session_index.')\n",
    "requireCondition(/series_session_index\\s+integer\\s+not null\\s+default 1/i.test(migration), 'Migration must add 1-based series_session_index.')\nrequireCondition(/series_session_index between 1 and 10/.test(migration), 'Database must cap a serialized story at ten sessions.')\n",
)
replace_once(
    'scripts/check-story-library-persistence.mjs',
    "requireCondition(/createNextSeriesSessionState/.test(memory) && /episodeCount: 0/.test(memory), 'A next-series-session helper must preserve series memory while resetting current-session progress.')\n",
    "requireCondition(/MAX_SERIES_SESSIONS = 10/.test(memory), 'Series lifecycle must define a ten-session maximum.')\nrequireCondition(/createNextSeriesSessionState/.test(memory) && /episodeCount: 0/.test(memory) && /canStartNextSeriesSession/.test(memory), 'A bounded next-series-session helper must preserve series memory while resetting current-session progress.')\n",
)
replace_once(
    'scripts/check-story-library-persistence.mjs',
    "requireCondition(/fresh child-scale goal for tonight/.test(architecture), 'Architect must start a fresh bedtime goal in later series sessions.')\n",
    "requireCondition(/fresh child-scale goal for tonight/.test(architecture), 'Architect must start a fresh bedtime goal in later series sessions.')\nrequireCondition(/at most 10 bedtime sessions/.test(architecture) && /Session 9 is penultimate/.test(architecture) && /Session 10 is the finale/.test(architecture), 'Architect must follow a ten-session serialized arc with penultimate and finale discipline.')\nrequireCondition(/final_series_arc_not_closed/.test(architecture) && /open_arc must be null/.test(architecture), 'Final session segment 2 must deterministically close the active serialized arc.')\nrequireCondition(/MAX_SERIES_SESSIONS = 10/.test(contracts) && /rawSessionIndex > MAX_SERIES_SESSIONS/.test(contracts), 'Story AI request normalization must reject session 11+.')\n",
)
replace_once(
    'scripts/check-story-library-persistence.mjs',
    "requireCondition(/\\.eq\\('client_session_id', identity\\.sessionId\\)/.test(state), 'Choice confirmation must target the current bedtime session, not the whole series ID.')\n",
    "requireCondition(/\\.eq\\('client_session_id', identity\\.sessionId\\)/.test(state), 'Choice confirmation must target the current bedtime session, not the whole series ID.')\nrequireCondition(/MAX_SERIES_SESSIONS = 10/.test(state) && /withinSeriesLimit/.test(state), 'story-state must reject writes beyond session 10.')\nrequireCondition(/seriesSessionId\\(seriesState\\)/.test(archive), 'Local Story Library must key snapshots by bedtime session identity instead of stable series identity.')\nrequireCondition(/onStartNextSeriesSession/.test(home) && /MAX_SERIES_SESSIONS/.test(home), 'Home must continue the same series after a completed session until 10/10.')\nrequireCondition(/isWholeSeriesFinal/.test(storyScreen) && /onStartNextSeriesSession/.test(storyScreen), 'Story reader must distinguish a completed bedtime session from the whole-series finale.')\n",
)

print('Ten-session serialized finale patch applied.')
