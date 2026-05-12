// Prototype Memory Agent: local-only state mutation contract for MVP scaffolding.
import type { ChoiceHistoryEntry, Episode, EpisodeChoice, OnboardingSelections, SeriesState } from '../types/qissa'

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

export function createInitialSeriesState(selections: OnboardingSelections): SeriesState {
  // Input: onboarding selections. Output: empty series state prepared for episode generation.
  return {
    id: `series-${selections.stylePackId}-${selections.language}`,
    childProfileId: `child-${selections.ageGroup}-${selections.language}`,
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

export function applyChoiceToSeriesState(seriesState: SeriesState, episode: Episode, choice: EpisodeChoice): SeriesState {
  // Input: current state + confirmed choice. Output: updated in-memory continuity state.
  const selectedAt = new Date().toISOString()
  const entry: ChoiceHistoryEntry = {
    episode_id: episode.episode_id,
    choice_id: choice.choice_id,
    choice_text: choice.text,
    effect_summary: choice.effect_summary,
    resolution_text: choice.resolution_text,
    state_patch: choice.state_patch,
    selected_at: selectedAt,
  }

  const recurringCharacters = [...seriesState.recurringCharacters]
  if (choice.state_patch.new_friend && !recurringCharacters.includes(choice.state_patch.new_friend)) {
    recurringCharacters.push(choice.state_patch.new_friend)
  }

  return {
    ...seriesState,
    choiceHistory: [...seriesState.choiceHistory, entry],
    lastEpisodeSummary: choice.effect_summary,
    activeArc: choice.state_patch.open_arc ?? seriesState.activeArc,
    relationshipState: {
      ...seriesState.relationshipState,
      ...(choice.state_patch.relationship_updates ?? {}),
    },
    canonState: {
      ...seriesState.canonState,
      ...(choice.state_patch.canon_updates ?? {}),
    },
    recurringCharacters,
    episodeCount: Math.max(seriesState.episodeCount, 1),
  }
}
