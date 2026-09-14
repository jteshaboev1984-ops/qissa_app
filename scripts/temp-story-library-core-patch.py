from pathlib import Path
import json

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding='utf-8')

def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}')
    write(path, text.replace(old, new, 1))

# 1) Domain contract: stable series identity + per-bedtime-session identity.
replace_once(
    'src/contracts/storyContracts.ts',
    "export interface SeriesState {\n  id: string\n  childProfileId: string\n  stylePackId: StylePackId\n",
    "export interface SeriesState {\n  id: string\n  /** Stable identity for the whole continuing series. */\n  childProfileId: string\n  /** Unique identity for the current bedtime story/session. Legacy snapshots may omit it. */\n  sessionId?: string\n  /** 1-based bedtime session number inside the same series. Legacy snapshots may omit it. */\n  sessionIndex?: number\n  stylePackId: StylePackId\n",
)

# 2) Memory agent: unique new series IDs, next-session rollover, and durable episode patches.
write('src/lib/memoryAgent.ts', '''import type { ChoiceHistoryEntry, Episode, EpisodeChoice, OnboardingSelections, SeriesState } from '../types/qissa'\n\nfunction baseHeroName(selections: OnboardingSelections): string {\n  if (selections.heroType === 'custom' && selections.customHeroName) {\n    return selections.customHeroName\n  }\n\n  const byLanguage = {\n    ru: { girl_hero: 'Алия', boy_hero: 'Тимур', animal: 'Снежный Барсик', magical_hero: 'Звёздный Проводник', custom: 'Юный герой' },\n    uz: { girl_hero: 'Aliya', boy_hero: 'Timur', animal: 'kichik qor barsi', magical_hero: 'mehribon yulduz yo‘lboshchi', custom: 'kichik qahramon' },\n    kz: { girl_hero: 'Алия', boy_hero: 'Тимур', animal: 'кішкентай қар барысы', magical_hero: 'мейірімді жұлдыз жетекші', custom: 'жас кейіпкер' },\n  } as const\n\n  return byLanguage[selections.language][selections.heroType]\n}\n\nconst uniqueId = (prefix: string): string => {\n  const uuid = globalThis.crypto?.randomUUID?.()\n  if (uuid) return `${prefix}-${uuid}`\n  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`\n}\n\nexport const seriesSessionId = (seriesState: SeriesState): string =>\n  seriesState.sessionId?.trim() || seriesState.id\n\nexport const seriesSessionIndex = (seriesState: SeriesState): number =>\n  Number.isInteger(seriesState.sessionIndex) && (seriesState.sessionIndex ?? 0) > 0\n    ? seriesState.sessionIndex as number\n    : 1\n\nexport function createInitialSeriesState(selections: OnboardingSelections): SeriesState {\n  return {\n    id: uniqueId('series'),\n    childProfileId: `child-${selections.ageGroup}-${selections.language}`,\n    sessionId: uniqueId('session'),\n    sessionIndex: 1,\n    stylePackId: selections.stylePackId,\n    mainCharacter: baseHeroName(selections),\n    recurringCharacters: [],\n    lastEpisodeSummary: '',\n    activeArc: '',\n    relationshipState: {},\n    choiceHistory: [],\n    canonState: {},\n    episodeCount: 0,\n  }\n}\n\nexport function createNextSeriesSessionState(seriesState: SeriesState): SeriesState {\n  return {\n    ...seriesState,\n    sessionId: uniqueId('session'),\n    sessionIndex: seriesSessionIndex(seriesState) + 1,\n    episodeCount: 0,\n  }\n}\n\nconst recurringWith = (seriesState: SeriesState, friend?: string): string[] => {\n  const recurring = [...seriesState.recurringCharacters]\n  if (friend && !recurring.includes(friend)) recurring.push(friend)\n  return recurring\n}\n\nexport function applyEpisodeToSeriesState(seriesState: SeriesState, episode: Episode): SeriesState {\n  const patch = episode.state_patch ?? {}\n  const segment = episode.episode_id.startsWith('ep-2') ? 2 : 1\n  return {\n    ...seriesState,\n    sessionId: seriesSessionId(seriesState),\n    sessionIndex: seriesSessionIndex(seriesState),\n    episodeCount: Math.max(seriesState.episodeCount, segment),\n    lastEpisodeSummary: patch.last_event?.trim() || seriesState.lastEpisodeSummary,\n    activeArc: patch.open_arc ?? seriesState.activeArc,\n    relationshipState: {\n      ...seriesState.relationshipState,\n      ...(patch.relationship_updates ?? {}),\n    },\n    canonState: {\n      ...seriesState.canonState,\n      ...(patch.canon_updates ?? {}),\n    },\n    recurringCharacters: recurringWith(seriesState, patch.new_friend),\n  }\n}\n\nexport function applyChoiceToSeriesState(seriesState: SeriesState, episode: Episode, choice: EpisodeChoice): SeriesState {\n  const selectedAt = new Date().toISOString()\n  const entry: ChoiceHistoryEntry = {\n    episode_id: episode.episode_id,\n    choice_id: choice.choice_id,\n    choice_text: choice.text,\n    effect_summary: choice.effect_summary,\n    resolution_text: choice.resolution_text,\n    tomorrow_seed: choice.tomorrow_seed,\n    state_patch: choice.state_patch,\n    selected_at: selectedAt,\n  }\n\n  return {\n    ...seriesState,\n    sessionId: seriesSessionId(seriesState),\n    sessionIndex: seriesSessionIndex(seriesState),\n    choiceHistory: [...seriesState.choiceHistory, entry],\n    lastEpisodeSummary: choice.effect_summary,\n    activeArc: choice.state_patch.open_arc ?? seriesState.activeArc,\n    relationshipState: {\n      ...seriesState.relationshipState,\n      ...(choice.state_patch.relationship_updates ?? {}),\n    },\n    canonState: {\n      ...seriesState.canonState,\n      ...(choice.state_patch.canon_updates ?? {}),\n    },\n    recurringCharacters: recurringWith(seriesState, choice.state_patch.new_friend),\n    episodeCount: Math.max(seriesState.episodeCount, 1),\n  }\n}\n''')

# 3) Persist and display exactly the same merged episode state.
replace_once(
    'src/lib/storyService.ts',
    "import { localPersistence } from './localPersistence'\n",
    "import { localPersistence } from './localPersistence'\nimport { applyEpisodeToSeriesState } from './memoryAgent'\n",
)
replace_once(
    'src/lib/storyService.ts',
    "  const episodeCount = output.episode.episode_id.startsWith('ep-2') ? 2 : 1\n  const nextSeriesState = { ...seriesState, episodeCount }\n",
    "  const nextSeriesState = applyEpisodeToSeriesState(seriesState, output.episode)\n",
)
replace_once(
    'src/App.tsx',
    "import { createInitialSeriesState, applyChoiceToSeriesState } from './lib/memoryAgent'\n",
    "import { applyChoiceToSeriesState, applyEpisodeToSeriesState, createInitialSeriesState } from './lib/memoryAgent'\n",
)
replace_once(
    'src/App.tsx',
    "      const { episode: firstEpisode } = await storyService.generateEpisode({ selections, seriesState })\n      const nextSeries = { ...seriesState, episodeCount: 1 }\n",
    "      const { episode: firstEpisode } = await storyService.generateEpisode({ selections, seriesState })\n      const nextSeries = applyEpisodeToSeriesState(seriesState, firstEpisode)\n",
)
replace_once(
    'src/App.tsx',
    "      const { episode: secondEpisode } = await storyService.generateEpisode({ selections, seriesState })\n      const nextSeriesState = { ...seriesState, episodeCount: 2 }\n",
    "      const { episode: secondEpisode } = await storyService.generateEpisode({ selections, seriesState })\n      const nextSeriesState = applyEpisodeToSeriesState(seriesState, secondEpisode)\n",
)

# 4) Story AI request context: historical series memory no longer means current-session segment 2.
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "    id?: string\n    mainCharacter?: string\n",
    "    id?: string\n    sessionId?: string\n    sessionIndex?: number\n    mainCharacter?: string\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "  seriesId: string\n  episodeIndex: 1 | 2\n  isContinuation: boolean\n",
    "  seriesId: string\n  sessionId: string\n  sessionIndex: number\n  episodeIndex: 1 | 2\n  isContinuation: boolean\n  hasSeriesMemory: boolean\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "  const choiceHistory = compactChoiceHistory(seriesState.choiceHistory, heroName)\n  const isContinuation = choiceHistory.length > 0\n  const recurringCharacters = Array.isArray(seriesState.recurringCharacters)\n",
    "  const choiceHistory = compactChoiceHistory(seriesState.choiceHistory, heroName)\n  const explicitSessionIdentity = typeof seriesState.sessionId === 'string' || typeof seriesState.sessionIndex === 'number'\n  const sessionId = compactText(seriesState.sessionId, 128) || seriesId\n  const sessionIndex = typeof seriesState.sessionIndex === 'number' && Number.isInteger(seriesState.sessionIndex) && seriesState.sessionIndex > 0\n    ? Math.min(seriesState.sessionIndex, 10_000)\n    : 1\n  const sessionEpisodeCount = typeof seriesState.episodeCount === 'number' && Number.isFinite(seriesState.episodeCount)\n    ? Math.max(0, Math.floor(seriesState.episodeCount))\n    : 0\n  const isContinuation = sessionEpisodeCount > 0 || (!explicitSessionIdentity && choiceHistory.length > 0)\n  const recurringCharacters = Array.isArray(seriesState.recurringCharacters)\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "    seriesId,\n    episodeIndex: isContinuation ? 2 : 1,\n    isContinuation,\n    recurringCharacters,\n",
    "    seriesId,\n    sessionId,\n    sessionIndex,\n    episodeIndex: isContinuation ? 2 : 1,\n    isContinuation,\n    hasSeriesMemory: choiceHistory.length > 0 || Object.keys(compactStringRecord(seriesState.canonState, heroName)).length > 0 || Object.keys(compactStringRecord(seriesState.relationshipState, heroName)).length > 0,\n    recurringCharacters,\n",
)
replace_once(
    'supabase/functions/story-generate/contracts.ts',
    "export const buildFinalEpisode = (\n  context: NormalizedStoryContext,\n  candidate: StoryCandidate,\n  safety: SafetyResult,\n): FinalEpisode => ({\n  episode_id: `ep-${context.episodeIndex}-${context.stylePackId}`,\n",
    "export const buildFinalEpisode = (\n  context: NormalizedStoryContext,\n  candidate: StoryCandidate,\n  safety: SafetyResult,\n): FinalEpisode => ({\n  episode_id: `ep-${context.episodeIndex}-${context.stylePackId}${context.sessionIndex > 1 ? `-s${context.sessionIndex}` : ''}`,\n",
)

# 5) Architect understands a later bedtime session inside the same ongoing series.
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    'For Episode 1, plan 5-7 causal beats ending at one explicit decision point. Do not resolve either branch before the decision.',\n    'For Episode 2, continue after the already-confirmed resolution bridge, use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',\n",
    "    'For Episode 1, plan 5-7 causal beats ending at one explicit decision point. Do not resolve either branch before the decision.',\n    'When Episode 1 starts a later bedtime session in an existing series, use remembered canon, relationships and prior consequences as continuity callbacks, then introduce one fresh child-scale goal for tonight. Do not replay or reopen a problem that the previous bedtime session already solved.',\n    'For Episode 2, continue after the already-confirmed resolution bridge, use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    task: context.episodeIndex === 1 ? 'Plan bedtime session segment 1 and its two branch consequences.' : 'Plan bedtime session segment 2 after the confirmed choice consequence.',\n",
    "    task: context.episodeIndex === 1\n      ? context.hasSeriesMemory\n        ? `Plan bedtime series session ${context.sessionIndex}, segment 1, using prior canon as continuity while starting one fresh story goal and two branch consequences.`\n        : 'Plan bedtime series session 1, segment 1 and its two branch consequences.'\n      : `Plan bedtime series session ${context.sessionIndex}, segment 2 after the confirmed choice consequence.`,\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    segment: context.episodeIndex,\n    memory: memoryPayload(context),\n",
    "    series_session_index: context.sessionIndex,\n    segment: context.episodeIndex,\n    memory: memoryPayload(context),\n",
)

# 6) Local deterministic agent follows current-session progress and unique later-session episode IDs.
replace_once(
    'src/lib/storyAgent.ts',
    "    episode_id: `ep-1-${selections.stylePackId}-${selections.storyMood}`,\n",
    "    episode_id: `ep-1-${selections.stylePackId}-${selections.storyMood}${(seriesState?.sessionIndex ?? 1) > 1 ? `-s${seriesState?.sessionIndex}` : ''}`,\n",
)
replace_once(
    'src/lib/storyAgent.ts',
    "    episode_id: `ep-2-${selections.stylePackId}-${seriesState.choiceHistory.length}`,\n",
    "    episode_id: `ep-2-${selections.stylePackId}-${seriesState.choiceHistory.length}${(seriesState.sessionIndex ?? 1) > 1 ? `-s${seriesState.sessionIndex}` : ''}`,\n",
)
replace_once(
    'src/lib/storyAgent.ts',
    "  const hasHistory = Boolean(seriesState && seriesState.choiceHistory.length > 0)\n  const draftEpisode = hasHistory ? createEpisodeTwo(selections, seriesState as SeriesState) : createEpisodeOne(selections, seriesState)\n",
    "  const hasSessionIdentity = Boolean(seriesState?.sessionId || seriesState?.sessionIndex)\n  const isCurrentSessionContinuation = Boolean(seriesState && (seriesState.episodeCount > 0 || (!hasSessionIdentity && seriesState.choiceHistory.length > 0)))\n  const draftEpisode = isCurrentSessionContinuation ? createEpisodeTwo(selections, seriesState as SeriesState) : createEpisodeOne(selections, seriesState)\n",
)

# 7) Durable DB model: one stable series can own many independently archived bedtime sessions.
migration = '''-- Add durable series/session separation and per-session setup snapshots for Story Library.\n\nalter table public.story_sessions\n  add column if not exists client_series_id text,\n  add column if not exists series_session_index integer not null default 1,\n  add column if not exists selection_snapshot jsonb not null default '{}'::jsonb;\n\nupdate public.story_sessions\nset client_series_id = client_session_id\nwhere client_series_id is null or btrim(client_series_id) = '';\n\nalter table public.story_sessions\n  alter column client_series_id set not null;\n\ndo $$\nbegin\n  if not exists (\n    select 1 from pg_constraint\n    where conname = 'story_sessions_series_session_index_check'\n      and conrelid = 'public.story_sessions'::regclass\n  ) then\n    alter table public.story_sessions\n      add constraint story_sessions_series_session_index_check\n      check (series_session_index >= 1);\n  end if;\nend $$;\n\ncreate unique index if not exists ux_story_sessions_profile_series_session_index\n  on public.story_sessions(child_profile_id, client_series_id, series_session_index);\n\ncreate index if not exists idx_story_sessions_profile_series_updated\n  on public.story_sessions(child_profile_id, client_series_id, updated_at desc);\n'''
write('docs/qissa/backend/migrations/20260914_000016_add_series_session_library.sql', migration)

# 8) story-state API: session identity, immutable setup snapshot, server library.
path = 'supabase/functions/story-state/index.ts'
text = read(path)
text = text.replace(
    "  action?: 'sync_generated' | 'confirm_choice' | 'save_preferences' | 'reset_current' | 'load_current' | 'delete_profile_data'",
    "  action?: 'sync_generated' | 'confirm_choice' | 'save_preferences' | 'reset_current' | 'load_current' | 'list_library' | 'delete_profile_data'",
    1,
)
text = text.replace(
    "    id?: string\n    mainCharacter?: string\n",
    "    id?: string\n    sessionId?: string\n    sessionIndex?: number\n    mainCharacter?: string\n",
    1,
)
needle = "const episodeNoFromId = (episodeId: string): number => episodeId.startsWith('ep-2') ? 2 : 1\n\nconst findProfile"
replacement = """const episodeNoFromId = (episodeId: string): number => episodeId.startsWith('ep-2') ? 2 : 1\n\nconst storyIdentity = (seriesState: StoryStateRequest['seriesState']) => {\n  const seriesId = typeof seriesState?.id === 'string' ? seriesState.id.trim() : ''\n  const sessionId = typeof seriesState?.sessionId === 'string' && seriesState.sessionId.trim()\n    ? seriesState.sessionId.trim()\n    : seriesId\n  const sessionIndex = typeof seriesState?.sessionIndex === 'number' && Number.isInteger(seriesState.sessionIndex) && seriesState.sessionIndex > 0\n    ? Math.min(seriesState.sessionIndex, 10_000)\n    : 1\n  return { seriesId, sessionId, sessionIndex }\n}\n\nconst findProfile"""
if needle not in text:
    raise SystemExit('story-state identity insertion point missing')
text = text.replace(needle, replacement, 1)
old = """  const episodeNo = episodeNoFromId(episode.episode_id)\n  const sessionStatus = episodeNo === 2 ? 'completed' : 'episode_1_active'\n\n  const { data: session, error: sessionError } = await admin\n    .from('story_sessions')\n    .upsert({\n      child_profile_id: profile.id,\n      client_session_id: seriesState.id,\n      story_mode: storyMode,\n      story_mood: storyMood,\n      style_pack_id: stylePackId,\n"""
new = """  const episodeNo = episodeNoFromId(episode.episode_id)\n  const sessionStatus = episodeNo === 2 ? 'completed' : 'episode_1_active'\n  const identity = storyIdentity(seriesState)\n  if (!identity.seriesId || !identity.sessionId) return fail('invalid_story_identity', 422, origin)\n\n  const { data: session, error: sessionError } = await admin\n    .from('story_sessions')\n    .upsert({\n      child_profile_id: profile.id,\n      client_session_id: identity.sessionId,\n      client_series_id: identity.seriesId,\n      series_session_index: identity.sessionIndex,\n      selection_snapshot: selections,\n      story_mode: storyMode,\n      story_mood: storyMood,\n      style_pack_id: stylePackId,\n"""
if old not in text:
    raise SystemExit('story-state sync session block missing')
text = text.replace(old, new, 1)
old = """  const { data: session, error: sessionError } = await admin\n    .from('story_sessions')\n    .select('id,story_mode')\n    .eq('child_profile_id', profile.id)\n    .eq('client_session_id', seriesState.id)\n    .maybeSingle()\n"""
new = """  const identity = storyIdentity(seriesState)\n  const { data: session, error: sessionError } = await admin\n    .from('story_sessions')\n    .select('id,story_mode')\n    .eq('child_profile_id', profile.id)\n    .eq('client_session_id', identity.sessionId)\n    .maybeSingle()\n"""
if old not in text:
    raise SystemExit('story-state confirm lookup block missing')
text = text.replace(old, new, 1)
text = text.replace(
    ".select('id,story_mode,story_mood,style_pack_id,client_state,updated_at')",
    ".select('id,story_mode,story_mood,style_pack_id,client_state,selection_snapshot,updated_at')",
    1,
)
old = """      selections: {\n        ageGroup: profile.age_group,\n        language: profile.language,\n        heroType: profile.hero_type,\n        ...(profile.custom_hero_name ? { customHeroName: profile.custom_hero_name } : {}),\n        stylePackId: session.style_pack_id,\n        storyMode: session.story_mode,\n        storyMood: session.story_mood,\n      },\n"""
new = """      selections: isRecord(session.selection_snapshot) && Object.keys(session.selection_snapshot).length > 0\n        ? session.selection_snapshot\n        : {\n            ageGroup: profile.age_group,\n            language: profile.language,\n            heroType: profile.hero_type,\n            ...(profile.custom_hero_name ? { customHeroName: profile.custom_hero_name } : {}),\n            stylePackId: session.style_pack_id,\n            storyMode: session.story_mode,\n            storyMood: session.story_mood,\n          },\n"""
if old not in text:
    raise SystemExit('story-state load selections block missing')
text = text.replace(old, new, 1)
insert_before = "\nDeno.serve(async (request: Request) => {"
if insert_before not in text:
    raise SystemExit('story-state serve marker missing')
list_library = r'''

async function listLibrary(input: StoryStateRequest, origin: string | null) {
  const { installationId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)

  const { data: profile, error: profileError } = await findProfile(installationId)
  if (profileError) return fail('profile_load_failed', 500, origin)
  if (!profile) return json({ sessions: [] }, 200, origin)

  const { data: sessions, error: sessionError } = await admin
    .from('story_sessions')
    .select('id,client_session_id,client_series_id,series_session_index,story_mode,story_mood,style_pack_id,status,title,summary,client_state,selection_snapshot,is_archived,created_at,updated_at,completed_at')
    .eq('child_profile_id', profile.id)
    .order('updated_at', { ascending: false })
    .limit(12)

  if (sessionError) return fail('library_session_load_failed', 500, origin)
  if (!sessions || sessions.length === 0) return json({ sessions: [] }, 200, origin)

  const sessionIds = sessions.map((session) => session.id)
  const { data: episodes, error: episodeError } = await admin
    .from('story_episodes')
    .select('session_id,episode_no,domain_payload,created_at')
    .in('session_id', sessionIds)
    .order('episode_no', { ascending: true })

  if (episodeError) return fail('library_episode_load_failed', 500, origin)
  const bySession = new Map<string, JsonRecord[]>()
  for (const row of episodes ?? []) {
    if (!isRecord(row.domain_payload)) continue
    const existing = bySession.get(row.session_id) ?? []
    existing.push(row.domain_payload)
    bySession.set(row.session_id, existing)
  }

  return json({
    sessions: sessions.map((session) => ({
      sessionId: session.client_session_id,
      seriesId: session.client_series_id ?? session.client_session_id,
      sessionIndex: session.series_session_index ?? 1,
      status: session.status,
      title: session.title,
      summary: session.summary,
      isArchived: session.is_archived,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      completedAt: session.completed_at,
      selections: isRecord(session.selection_snapshot) && Object.keys(session.selection_snapshot).length > 0
        ? session.selection_snapshot
        : null,
      seriesState: isRecord(session.client_state) ? session.client_state : null,
      episodes: bySession.get(session.id) ?? [],
    })),
  }, 200, origin)
}
'''
text = text.replace(insert_before, list_library + insert_before, 1)
text = text.replace(
    "    'delete_profile_data',\n    'load_current',\n",
    "    'delete_profile_data',\n    'load_current',\n    'list_library',\n",
    1,
)
text = text.replace(
    "      : input.action === 'load_current' || input.action === 'delete_profile_data'\n        ? 'allow-empty'\n",
    "      : input.action === 'load_current' || input.action === 'list_library' || input.action === 'delete_profile_data'\n        ? 'allow-empty'\n",
    1,
)
text = text.replace(
    "  if (input.action === 'load_current') return loadCurrent(input, origin)\n",
    "  if (input.action === 'load_current') return loadCurrent(input, origin)\n  if (input.action === 'list_library') return listLibrary(input, origin)\n",
    1,
)
write(path, text)

# 9) Permanent source-backed regression contract.
regression = r'''import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const failures = []
const requireCondition = (condition, message) => { if (!condition) failures.push(message) }

const migration = read('docs/qissa/backend/migrations/20260914_000016_add_series_session_library.sql')
const state = read('supabase/functions/story-state/index.ts')
const contracts = read('supabase/functions/story-generate/contracts.ts')
const architecture = read('supabase/functions/story-generate/story-architecture.ts')
const domain = read('src/contracts/storyContracts.ts')
const memory = read('src/lib/memoryAgent.ts')
const service = read('src/lib/storyService.ts')
const app = read('src/App.tsx')
const localAgent = read('src/lib/storyAgent.ts')

requireCondition(/client_series_id\s+text/.test(migration), 'Migration must add client_series_id.')
requireCondition(/series_session_index\s+integer\s+not null\s+default 1/i.test(migration), 'Migration must add 1-based series_session_index.')
requireCondition(/selection_snapshot\s+jsonb\s+not null/i.test(migration), 'Migration must persist per-session selections for rereading.')
requireCondition(/ux_story_sessions_profile_series_session_index/.test(migration), 'Series/session identity must be unique per child profile.')

requireCondition(/sessionId\?: string/.test(domain) && /sessionIndex\?: number/.test(domain), 'SeriesState must carry backward-compatible session identity.')
requireCondition(/id: uniqueId\('series'\)/.test(memory), 'New series IDs must be unique, not world/language deterministic.')
requireCondition(/sessionId: uniqueId\('session'\)/.test(memory), 'Every bedtime session must have a unique session ID.')
requireCondition(/createNextSeriesSessionState/.test(memory) && /episodeCount: 0/.test(memory), 'A next-series-session helper must preserve series memory while resetting current-session progress.')
requireCondition(/applyEpisodeToSeriesState/.test(memory) && /canon_updates/.test(memory) && /relationship_updates/.test(memory), 'Durable episode patches must be merged into SeriesState.')
requireCondition(/applyEpisodeToSeriesState\(seriesState, output\.episode\)/.test(service), 'Remote persistence must save the merged episode state.')
requireCondition(/applyEpisodeToSeriesState\(seriesState, firstEpisode\)/.test(app) && /applyEpisodeToSeriesState\(seriesState, secondEpisode\)/.test(app), 'App state must match the durable episode state.')

requireCondition(/explicitSessionIdentity/.test(contracts) && /sessionEpisodeCount/.test(contracts), 'Story AI must derive current segment from session progress, not all historical choices.')
requireCondition(/hasSeriesMemory/.test(contracts) && /sessionIndex/.test(contracts), 'Story AI context must distinguish later series sessions from current-session continuation.')
requireCondition(/-s\$\{context\.sessionIndex\}/.test(contracts), 'Later bedtime sessions must receive unique episode IDs.')
requireCondition(/fresh child-scale goal for tonight/.test(architecture), 'Architect must start a fresh bedtime goal in later series sessions.')
requireCondition(/isCurrentSessionContinuation/.test(localAgent), 'Local fallback agent must also use current-session progress.')

requireCondition(/client_session_id: identity\.sessionId/.test(state), 'story-state must key rows by bedtime session ID.')
requireCondition(/client_series_id: identity\.seriesId/.test(state), 'story-state must persist stable series identity.')
requireCondition(/series_session_index: identity\.sessionIndex/.test(state), 'story-state must persist session order.')
requireCondition(/selection_snapshot: selections/.test(state), 'story-state must snapshot the selections used to create each story.')
requireCondition(/'list_library'/.test(state) && /async function listLibrary/.test(state), 'story-state must expose an authenticated server Story Library action.')
requireCondition(/episodes: bySession\.get\(session\.id\) \?\? \[\]/.test(state), 'Server Story Library must return stored episode payloads for rereading.')
requireCondition(/\.eq\('client_session_id', identity\.sessionId\)/.test(state), 'Choice confirmation must target the current bedtime session, not the whole series ID.')

if (failures.length) {
  console.error(`Story Library / series persistence contract failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('Story Library / multi-session series persistence contract passed.')
'''
write('scripts/check-story-library-persistence.mjs', regression)

package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
package['scripts']['check:story-library'] = 'node scripts/check-story-library-persistence.mjs'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

replace_once(
    '.github/workflows/ci.yml',
    "      - name: Validate story service boundary\n        run: npm run check:story-service\n\n",
    "      - name: Validate story service boundary\n        run: npm run check:story-service\n\n      - name: Validate durable Story Library and multi-session series\n        run: npm run check:story-library\n\n",
)

print('Durable Story Library core patch applied.')
