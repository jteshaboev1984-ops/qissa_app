import type { ChoiceHistoryEntry, Episode, EpisodeChoice, OnboardingSelections, SeriesState } from '../types/qissa'

export const MAX_SERIES_SESSIONS = 10

function baseHeroName(selections: OnboardingSelections): string {
  if (selections.heroType === 'custom' && selections.customHeroName) {
    return selections.customHeroName
  }

  const byLanguage = {
    ru: { girl_hero: 'Алия', boy_hero: 'Тимур', animal: 'Снежный Барсик', magical_hero: 'Звёздный Проводник', custom: 'Юный герой' },
    uz: { girl_hero: 'Aliya', boy_hero: 'Timur', animal: 'kichik qor barsi', magical_hero: 'mehribon yulduz yo‘lboshchi', custom: 'kichik qahramon' },
    kz: { girl_hero: 'Алия', boy_hero: 'Тимур', animal: 'кішкентай қар барысы', magical_hero: 'мейірімді жұлдыз жетекші', custom: 'жас кейіпкер' },
  } as const

  return byLanguage[selections.language][selections.heroType]
}

const uniqueId = (prefix: string): string => {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}-${uuid}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export const seriesSessionId = (seriesState: SeriesState): string =>
  seriesState.sessionId?.trim() || seriesState.id

export const seriesSessionIndex = (seriesState: SeriesState): number =>
  Number.isInteger(seriesState.sessionIndex) && (seriesState.sessionIndex ?? 0) > 0
    ? Math.min(seriesState.sessionIndex as number, MAX_SERIES_SESSIONS)
    : 1

export const isFinalSeriesSession = (seriesState: SeriesState): boolean =>
  seriesSessionIndex(seriesState) >= MAX_SERIES_SESSIONS

export const canStartNextSeriesSession = (seriesState: SeriesState, episode: Episode | null | undefined): boolean =>
  seriesState.episodeCount >= 2 &&
  !isFinalSeriesSession(seriesState) &&
  (episode?.generationSource === 'openai-structured' || episode?.generationSource === 'local')

export function createInitialSeriesState(selections: OnboardingSelections): SeriesState {
  return {
    id: uniqueId('series'),
    childProfileId: `child-${selections.ageGroup}-${selections.language}`,
    sessionId: uniqueId('session'),
    sessionIndex: 1,
    stylePackId: selections.stylePackId,
    mainCharacter: baseHeroName(selections),
    recurringCharacters: [],
    lastEpisodeSummary: '',
    activeArc: '',
    relationshipState: {},
    choiceHistory: [],
    canonState: {},
    episodeCount: 0,
  }
}

export function createNextSeriesSessionState(seriesState: SeriesState): SeriesState {
  if (seriesState.episodeCount < 2 || isFinalSeriesSession(seriesState)) {
    throw new Error('Series cannot advance before the current session completes or beyond its ten-session arc.')
  }

  return {
    ...seriesState,
    sessionId: uniqueId('session'),
    sessionIndex: seriesSessionIndex(seriesState) + 1,
    episodeCount: 0,
  }
}

const recurringWith = (seriesState: SeriesState, friend?: string): string[] => {
  const recurring = [...seriesState.recurringCharacters]
  if (friend && !recurring.includes(friend)) recurring.push(friend)
  return recurring
}

export function applyEpisodeToSeriesState(seriesState: SeriesState, episode: Episode): SeriesState {
  const patch = episode.state_patch ?? {}
  const segment = episode.episode_id.startsWith('ep-2') ? 2 : 1
  return {
    ...seriesState,
    sessionId: seriesSessionId(seriesState),
    sessionIndex: seriesSessionIndex(seriesState),
    episodeCount: Math.max(seriesState.episodeCount, segment),
    lastEpisodeSummary: patch.last_event?.trim() || seriesState.lastEpisodeSummary,
    activeArc: patch.open_arc === null ? '' : patch.open_arc ?? seriesState.activeArc,
    relationshipState: {
      ...seriesState.relationshipState,
      ...(patch.relationship_updates ?? {}),
    },
    canonState: {
      ...seriesState.canonState,
      ...(patch.canon_updates ?? {}),
    },
    recurringCharacters: recurringWith(seriesState, patch.new_friend),
  }
}

export function applyChoiceToSeriesState(seriesState: SeriesState, episode: Episode, choice: EpisodeChoice): SeriesState {
  const selectedAt = new Date().toISOString()
  const entry: ChoiceHistoryEntry = {
    episode_id: episode.episode_id,
    choice_id: choice.choice_id,
    choice_text: choice.text,
    effect_summary: choice.effect_summary,
    resolution_text: choice.resolution_text,
    tomorrow_seed: choice.tomorrow_seed,
    state_patch: choice.state_patch,
    selected_at: selectedAt,
  }

  return {
    ...seriesState,
    sessionId: seriesSessionId(seriesState),
    sessionIndex: seriesSessionIndex(seriesState),
    choiceHistory: [...seriesState.choiceHistory, entry],
    lastEpisodeSummary: choice.effect_summary,
    activeArc: choice.state_patch.open_arc === null ? '' : choice.state_patch.open_arc ?? seriesState.activeArc,
    relationshipState: {
      ...seriesState.relationshipState,
      ...(choice.state_patch.relationship_updates ?? {}),
    },
    canonState: {
      ...seriesState.canonState,
      ...(choice.state_patch.canon_updates ?? {}),
    },
    recurringCharacters: recurringWith(seriesState, choice.state_patch.new_friend),
    episodeCount: Math.max(seriesState.episodeCount, 1),
  }
}
