import type { AuthoredStoryProgress } from './types'

export interface SevenRoadsStory1MemoryProfile {
  temurActionStyle: 'bold_direct' | 'precise_control' | null
  samiraDecisionStyle: 'evidence_first' | 'safety_first' | null
  samiraRivalryStyle: 'competition_first' | 'checks_on_temur' | null
  temurSamiraTrust: 'cautious_rebuild' | 'second_chance' | null
}

export const deriveSevenRoadsStory1Memory = (
  progress: Pick<AuthoredStoryProgress, 'selected_choices'>,
): SevenRoadsStory1MemoryProfile => {
  const selected = progress.selected_choices

  return {
    temurActionStyle:
      selected.temur_forest_escape_method === 'p3_jump_ditch'
        ? 'bold_direct'
        : selected.temur_forest_escape_method === 'p3_precise_control'
          ? 'precise_control'
          : null,

    samiraDecisionStyle:
      selected.samira_river_method === 'p4_marker_then_book'
        ? 'evidence_first'
        : selected.samira_river_method === 'p4_search_then_marker'
          ? 'safety_first'
          : null,

    samiraRivalryStyle:
      selected.samira_zaran_wait === 'p5_leave_immediately'
        ? 'competition_first'
        : selected.samira_zaran_wait === 'p5_wait_until_visible'
          ? 'checks_on_temur'
          : null,

    temurSamiraTrust:
      selected.temur_trust_response === 'p6_verify_book'
        ? 'cautious_rebuild'
        : selected.temur_trust_response === 'p6_second_chance'
          ? 'second_chance'
          : null,
  }
}
