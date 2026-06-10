import type { Episode, OnboardingSelections, SeriesState, StoryMode, StoryMood, StylePackId, Language } from '../types/qissa'

export interface StoryArchiveItem {
  id: string
  title: string
  stylePackId: StylePackId
  storyMode: StoryMode
  storyMood: StoryMood
  language: Language
  episodeId: string
  episodeNumber: number
  summary: string
  lastChoiceText: string
  tomorrowSeed: string
  updatedAt: string

  // Added after Patch 33. Older archive items may not have these fields.
  selections?: OnboardingSelections
  seriesState?: SeriesState
  episode?: Episode
}

const STORY_ARCHIVE_KEY = 'qissa:v1:storyArchive'
const MAX_ARCHIVE_ITEMS = 8

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const safeParseJSON = <T>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const isArchiveItem = (value: unknown): value is StoryArchiveItem => {
  if (!isRecord(value)) return false

  const hasRequiredMetadata =
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.stylePackId === 'string' &&
    typeof value.storyMode === 'string' &&
    typeof value.storyMood === 'string' &&
    typeof value.language === 'string' &&
    typeof value.episodeId === 'string' &&
    typeof value.episodeNumber === 'number' &&
    typeof value.summary === 'string' &&
    typeof value.lastChoiceText === 'string' &&
    typeof value.tomorrowSeed === 'string' &&
    typeof value.updatedAt === 'string'

  if (!hasRequiredMetadata) return false

  const optionalSnapshotLooksValid =
    (value.selections === undefined || isRecord(value.selections)) &&
    (value.seriesState === undefined || isRecord(value.seriesState)) &&
    (value.episode === undefined || isRecord(value.episode))

  return optionalSnapshotLooksValid
}

export const canRestoreArchiveItem = (item: StoryArchiveItem): boolean =>
  Boolean(item.selections && item.seriesState && item.episode)

const episodeNumberFrom = (episode: Episode, seriesState: SeriesState | null): number => {
  if (seriesState?.episodeCount) return Math.max(seriesState.episodeCount, 1)
  return episode.episode_id.startsWith('ep-2') ? 2 : 1
}

const buildArchiveItem = (
  selections: OnboardingSelections | null,
  seriesState: SeriesState | null,
  episode: Episode | null,
): StoryArchiveItem | null => {
  if (!selections || !episode) return null

  const latestChoice =
    seriesState && seriesState.choiceHistory.length > 0
      ? seriesState.choiceHistory[seriesState.choiceHistory.length - 1]
      : null

  const summary =
    seriesState?.lastEpisodeSummary?.trim() ||
    latestChoice?.effect_summary?.trim() ||
    episode.nextEpisodePreview?.trim() ||
    episode.story_text.slice(0, 120)

  return {
    id: episode.series_id,
    title: episode.title,
    stylePackId: episode.stylePackId,
    storyMode: selections.storyMode,
    storyMood: selections.storyMood,
    language: selections.language,
    episodeId: episode.episode_id,
    episodeNumber: episodeNumberFrom(episode, seriesState),
    summary,
    lastChoiceText: latestChoice?.choice_text?.trim() ?? '',
    tomorrowSeed: latestChoice?.tomorrow_seed?.trim() ?? '',
    updatedAt: new Date().toISOString(),

    selections,
    seriesState: seriesState ?? undefined,
    episode,
  }
}

const load = (): StoryArchiveItem[] => {
  try {
    const parsed = safeParseJSON<unknown>(window.localStorage.getItem(STORY_ARCHIVE_KEY))
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isArchiveItem)
  } catch {
    return []
  }
}

const saveAll = (items: StoryArchiveItem[]) => {
  try {
    window.localStorage.setItem(STORY_ARCHIVE_KEY, JSON.stringify(items.slice(0, MAX_ARCHIVE_ITEMS)))
  } catch {
    // ignore localStorage failures in prototype mode
  }
}

const saveSnapshot = (
  selections: OnboardingSelections | null,
  seriesState: SeriesState | null,
  episode: Episode | null,
): StoryArchiveItem | null => {
  const item = buildArchiveItem(selections, seriesState, episode)
  if (!item) return null

  const existing = load()
  const next = [item, ...existing.filter((entry) => entry.id !== item.id)].slice(0, MAX_ARCHIVE_ITEMS)
  saveAll(next)
  return item
}

export const storyArchive = {
  load,
  saveSnapshot,
  canRestore: canRestoreArchiveItem,
}
