from pathlib import Path

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')

def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    write(path, text.replace(old, new, 1))

# Domain: persist generation source with the episode so reloads keep the fail-safe.
replace_once(
    'src/contracts/storyContracts.ts',
    "export type StoryMood = 'bedtime' | 'kind_adventure'\n",
    "export type StoryMood = 'bedtime' | 'kind_adventure'\nexport type StoryGenerationSource = 'safe-fallback' | 'openai-structured' | 'local'\n",
)
replace_once(
    'src/contracts/storyContracts.ts',
    "export interface Episode {\n  episode_id: string\n  series_id: string\n",
    "export interface Episode {\n  episode_id: string\n  series_id: string\n  /** Operational source persisted with the episode; used to avoid repeating fallback stories across sessions. */\n  generationSource?: StoryGenerationSource\n",
)

# Edge response: stamp the actual source into the episode body, not only a response header.
replace_once(
    'supabase/functions/story-generate/index.ts',
    "  { episode: buildSafeFallback(context) },\n",
    "  { episode: { ...buildSafeFallback(context), generationSource: 'safe-fallback' } },\n",
)
replace_once(
    'supabase/functions/story-generate/index.ts',
    "        { episode },\n        200,\n",
    "        { episode: { ...episode, generationSource: 'openai-structured' } },\n        200,\n",
)

# Browser client validates the optional stamped source.
replace_once(
    'src/lib/storyRemoteClient.ts',
    "  typeof value.series_id === 'string' &&\n  typeof value.title === 'string' &&\n",
    "  typeof value.series_id === 'string' &&\n  (value.generationSource === undefined || ['safe-fallback', 'openai-structured', 'local'].includes(String(value.generationSource))) &&\n  typeof value.title === 'string' &&\n",
)

# Local development/mock generation gets a non-fallback source too.
replace_once(
    'src/lib/storyService.ts',
    "const generateWithLocalAgent = async (input: StoryGenerationInput): Promise<StoryGenerationOutput> => ({\n  episode: createStoryEpisode(input),\n})\n",
    "const generateWithLocalAgent = async (input: StoryGenerationInput): Promise<StoryGenerationOutput> => ({\n  episode: { ...createStoryEpisode(input), generationSource: 'local' },\n})\n",
)

# Local hydration validates a source when present but remains backward-compatible with old snapshots.
replace_once(
    'src/lib/localPersistence.ts',
    "  return typeof value.episode_id === 'string' &&\n    typeof value.series_id === 'string' &&\n    typeof value.title === 'string' &&\n",
    "  return typeof value.episode_id === 'string' &&\n    typeof value.series_id === 'string' &&\n    (value.generationSource === undefined || value.generationSource === 'safe-fallback' || value.generationSource === 'openai-structured' || value.generationSource === 'local') &&\n    typeof value.title === 'string' &&\n",
)

# Series lifecycle: only a real provider/local story may open another bedtime session.
replace_once(
    'src/lib/memoryAgent.ts',
    "export const canStartNextSeriesSession = (seriesState: SeriesState): boolean =>\n  seriesState.episodeCount >= 2 && !isFinalSeriesSession(seriesState)\n",
    "export const canStartNextSeriesSession = (seriesState: SeriesState, episode: Episode | null | undefined): boolean =>\n  seriesState.episodeCount >= 2 &&\n  !isFinalSeriesSession(seriesState) &&\n  (episode?.generationSource === 'openai-structured' || episode?.generationSource === 'local')\n",
)
replace_once(
    'src/lib/memoryAgent.ts',
    "export function createNextSeriesSessionState(seriesState: SeriesState): SeriesState {\n  if (!canStartNextSeriesSession(seriesState)) {\n    throw new Error('Series cannot advance beyond its completed ten-session arc.')\n  }\n",
    "export function createNextSeriesSessionState(seriesState: SeriesState): SeriesState {\n  if (seriesState.episodeCount < 2 || isFinalSeriesSession(seriesState)) {\n    throw new Error('Series cannot advance before the current session completes or beyond its ten-session arc.')\n  }\n",
)

# App must fail closed before archiving/creating a new session.
replace_once(
    'src/App.tsx',
    "      !canStartNextSeriesSession(seriesState) ||\n",
    "      !canStartNextSeriesSession(seriesState, episode) ||\n",
)
replace_once(
    'src/App.tsx',
    "            maxSeriesSessions={MAX_SERIES_SESSIONS}\n            readerPreferences={readerPreferences}\n",
    "            maxSeriesSessions={MAX_SERIES_SESSIONS}\n            canStartNextSeriesSession={Boolean(seriesState && canStartNextSeriesSession(seriesState, episode))}\n            readerPreferences={readerPreferences}\n",
)

# Home/Library hide next-session CTA when current session came from deterministic fallback.
replace_once(
    'src/screens/HomeScreen.tsx',
    "  const canStartNextSession = Boolean(isSeriesMode && seriesState && canStartNextSeriesSession(seriesState))\n",
    "  const canStartNextSession = Boolean(isSeriesMode && seriesState && canStartNextSeriesSession(seriesState, episode))\n",
)
replace_once(
    'src/screens/HomeScreen.tsx',
    "              : (language === 'ru' ? `Серия ${currentSeriesSession} из ${MAX_SERIES_SESSIONS} завершена. Выборы и важные события сохранены для следующей серии.` : language === 'uz' ? `${currentSeriesSession}/${MAX_SERIES_SESSIONS}-qism tugadi. Tanlovlar va muhim voqealar keyingi qism uchun saqlandi.` : `${currentSeriesSession}/${MAX_SERIES_SESSIONS}-бөлім аяқталды. Таңдаулар мен маңызды оқиғалар келесі бөлімге сақталды.`)\n",
    "              : canStartNextSession\n                ? (language === 'ru' ? `Серия ${currentSeriesSession} из ${MAX_SERIES_SESSIONS} завершена. Выборы и важные события сохранены для следующей серии.` : language === 'uz' ? `${currentSeriesSession}/${MAX_SERIES_SESSIONS}-qism tugadi. Tanlovlar va muhim voqealar keyingi qism uchun saqlandi.` : `${currentSeriesSession}/${MAX_SERIES_SESSIONS}-бөлім аяқталды. Таңдаулар мен маңызды оқиғалар келесі бөлімге сақталды.`)\n                : (language === 'ru' ? `Серия ${currentSeriesSession} завершена и сохранена. Продолжение временно недоступно, поэтому эту серию пока можно перечитать.` : language === 'uz' ? `${currentSeriesSession}-qism tugadi va saqlandi. Davomi hozircha mavjud emas, shu qismni qayta o‘qish mumkin.` : `${currentSeriesSession}-бөлім аяқталып, сақталды. Жалғасы әзірге қолжетімсіз, бұл бөлімді қайта оқуға болады.`)\n",
)
replace_once(
    'src/screens/LibraryScreen.tsx',
    "  const canStartNextSession = Boolean(seriesState && selections.storyMode === 'series' && canStartNextSeriesSession(seriesState))\n",
    "  const canStartNextSession = Boolean(seriesState && selections.storyMode === 'series' && canStartNextSeriesSession(seriesState, episode))\n",
)

# Reader completion screen distinguishes a temporary fallback stop from the true 10/10 finale.
replace_once(
    'src/screens/StoryScreen.tsx',
    "  maxSeriesSessions?: number\n  isChoiceSavedForCurrentEpisode?: boolean\n",
    "  maxSeriesSessions?: number\n  canStartNextSeriesSession?: boolean\n  isChoiceSavedForCurrentEpisode?: boolean\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "  maxSeriesSessions = 10,\n  isChoiceSavedForCurrentEpisode = false,\n",
    "  maxSeriesSessions = 10,\n  canStartNextSeriesSession = false,\n  isChoiceSavedForCurrentEpisode = false,\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "    const body = isWholeSeriesFinal\n      ? (language === 'ru' ? 'Финальная серия закрыла начатые сюжетные линии. Историю можно перечитать или начать новую сказку.' : language === 'uz' ? 'Yakuniy qism boshlangan voqealarni tugatdi. Ertakni qayta o‘qish yoki yangi hikoya boshlash mumkin.' : 'Соңғы бөлім басталған оқиғаларды түйіндеді. Ертегіні қайта оқуға немесе жаңасын бастауға болады.')\n      : (language === 'ru' ? `QISSA сохранила важные события и выборы. Следующая серия будет ${seriesSessionIndex + 1} из ${maxSeriesSessions}.` : language === 'uz' ? `QISSA muhim voqealar va tanlovlarni saqladi. Keyingi qism ${seriesSessionIndex + 1}/${maxSeriesSessions} bo‘ladi.` : `QISSA маңызды оқиғалар мен таңдауларды сақтады. Келесі бөлім ${seriesSessionIndex + 1}/${maxSeriesSessions} болады.`)\n",
    "    const body = isWholeSeriesFinal\n      ? (language === 'ru' ? 'Финальная серия закрыла начатые сюжетные линии. Историю можно перечитать или начать новую сказку.' : language === 'uz' ? 'Yakuniy qism boshlangan voqealarni tugatdi. Ertakni qayta o‘qish yoki yangi hikoya boshlash mumkin.' : 'Соңғы бөлім басталған оқиғаларды түйіндеді. Ертегіні қайта оқуға немесе жаңасын бастауға болады.')\n      : canStartNextSeriesSession\n        ? (language === 'ru' ? `QISSA сохранила важные события и выборы. Следующая серия будет ${seriesSessionIndex + 1} из ${maxSeriesSessions}.` : language === 'uz' ? `QISSA muhim voqealar va tanlovlarni saqladi. Keyingi qism ${seriesSessionIndex + 1}/${maxSeriesSessions} bo‘ladi.` : `QISSA маңызды оқиғалар мен таңдауларды сақтады. Келесі бөлім ${seriesSessionIndex + 1}/${maxSeriesSessions} болады.`)\n        : (language === 'ru' ? 'Эта серия завершена и сохранена. Продолжение временно недоступно, поэтому сказку пока можно перечитать.' : language === 'uz' ? 'Bu qism tugadi va saqlandi. Davomi hozircha mavjud emas, ertakni qayta o‘qish mumkin.' : 'Бұл бөлім аяқталып, сақталды. Жалғасы әзірге қолжетімсіз, ертегіні қайта оқуға болады.')\n",
)
replace_once(
    'src/screens/StoryScreen.tsx',
    "            ) : (\n              <button className=\"q-primary w-full\" onClick={onStartNextSeriesSession}>\n                {language === 'ru' ? `Начать серию ${seriesSessionIndex + 1}` : language === 'uz' ? `${seriesSessionIndex + 1}-qismni boshlash` : `${seriesSessionIndex + 1}-бөлімді бастау`}\n              </button>\n            )}\n",
    "            ) : canStartNextSeriesSession ? (\n              <button className=\"q-primary w-full\" onClick={onStartNextSeriesSession}>\n                {language === 'ru' ? `Начать серию ${seriesSessionIndex + 1}` : language === 'uz' ? `${seriesSessionIndex + 1}-qismni boshlash` : `${seriesSessionIndex + 1}-бөлімді бастау`}\n              </button>\n            ) : null}\n",
)

# Persist operational source in existing story_episodes metadata and domain payload.
replace_once(
    'supabase/functions/story-state/index.ts',
    "    nextEpisodePreview?: string\n    safety_self_check?: JsonRecord & {\n",
    "    nextEpisodePreview?: string\n    generationSource?: string\n    safety_self_check?: JsonRecord & {\n",
)
replace_once(
    'supabase/functions/story-state/index.ts',
    "      generation_source: 'edge_story_agent',\n",
    "      generation_source: episode.generationSource === 'safe-fallback' || episode.generationSource === 'openai-structured' || episode.generationSource === 'local'\n        ? episode.generationSource\n        : 'edge_story_agent',\n",
)

# Regression contract: fallback sessions are saved/readable but cannot open another repeated bedtime session.
replace_once(
    'scripts/check-story-library-persistence.mjs',
    "const storyScreen = read('src/screens/StoryScreen.tsx')\n",
    "const storyScreen = read('src/screens/StoryScreen.tsx')\nconst storyGenerate = read('supabase/functions/story-generate/index.ts')\nconst storyRemote = read('src/lib/storyRemoteClient.ts')\nconst storyService = read('src/lib/storyService.ts')\n",
)
replace_once(
    'scripts/check-story-library-persistence.mjs',
    "requireCondition(/isWholeSeriesFinal/.test(storyScreen) && /onStartNextSeriesSession/.test(storyScreen), 'Story reader must distinguish a completed bedtime session from the whole-series finale.')\n",
    "requireCondition(/isWholeSeriesFinal/.test(storyScreen) && /onStartNextSeriesSession/.test(storyScreen), 'Story reader must distinguish a completed bedtime session from the whole-series finale.')\nrequireCondition(/generationSource\\?: StoryGenerationSource/.test(contracts), 'Episode contract must persist its generation source across reloads.')\nrequireCondition(/generationSource: 'safe-fallback'/.test(storyGenerate) && /generationSource: 'openai-structured'/.test(storyGenerate), 'Story Edge Function must stamp the actual generation source into episode payloads.')\nrequireCondition(/generationSource: 'local'/.test(storyService) && /safe-fallback/.test(storyRemote), 'Browser generation clients must preserve and validate episode source metadata.')\nrequireCondition(/episode\\?\\.generationSource === 'openai-structured'/.test(memory) && /episode\\?\\.generationSource === 'local'/.test(memory), 'A deterministic safe-fallback episode must not unlock another bedtime session that would repeat fallback content.')\nrequireCondition(/canStartNextSeriesSession=\\{Boolean/.test(app) && /canStartNextSeriesSession \\?/.test(storyScreen), 'UI must fail closed when a fallback session cannot safely advance.')\n",
)

print('Provider-safe series continuation gate applied.')
