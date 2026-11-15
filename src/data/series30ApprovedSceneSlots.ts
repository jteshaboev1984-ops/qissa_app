import type { AuthoredStoryPackage, AuthoredStoryPhase } from '../features/authoredStory/types'

/**
 * Additive, reader-layout-aware illustrations for the owner's 30-series plan.
 *
 * These approved assets are hosted, but the historical authored RU packages
 * and UZ translation overlays are SHA-locked by the literary release gates.
 * Do not mutate those source files or IDs to add story illustrations.
 * Instead, apply this scene-only overlay AFTER localizing the package and
 * BEFORE withReadingSeries() splits it into reader episodes.
 *
 * An image is never shown before its exact RU/UZ paragraph has been read.
 */
type Series30ApprovedScene = {
  story_id: string
  part_id: string
  slot_id: string
  anchor_key: string
  asset_id: string
  phase: AuthoredStoryPhase
  after_text: { ru: string; uz: string }
}

export const series30ApprovedScenes: readonly Series30ApprovedScene[] = [
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_3_network_sign',
    slot_id: 'SERIES30-S2E3-A01',
    anchor_key: 'series30_s2e3_farid_gate_arrest',
    asset_id: 'seven_roads_s2e3_farid_gate_arrest_01_APPROVED',
    phase: 'story_text',
    after_text: { ru: '— Фарид.', uz: '— Farid.' },
  },
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_3_network_sign',
    slot_id: 'SERIES30-S2E3-A02',
    anchor_key: 'series30_s2e3_driver_danyar_after_attack',
    asset_id: 'seven_roads_s2e3_driver_danyar_after_attack_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: '— Пока не знаю. Но я ещё подумаю.',
      uz: '— Hozircha bilmayman. Lekin yana o‘ylab ko‘raman.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_1_false_notice_and_route_check',
    slot_id: 'SERIES30-S4E2-A01',
    anchor_key: 'series30_s4e2_bay_horse_escape',
    asset_id: 'seven_roads_s4e2_bay_horse_roadside_escape_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Гнедой промчался мимо.',
      uz: 'To‘riq ot ularning yonidan chopib o‘tdi.',
    },
  },
]

const paragraphs = (text: string): string[] =>
  text.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)

/**
 * Purely adds image slots. Preserves all existing story paragraphs, choices,
 * IDs, versions, progress state, and historical source SHA checks.
 */
export const withSeries30ApprovedSceneSlots = (
  original: AuthoredStoryPackage,
): AuthoredStoryPackage => {
  if (original.language !== 'ru' && original.language !== 'uz') return original
  const language = original.language
  const additions = series30ApprovedScenes.filter((scene) => scene.story_id === original.story_id)
  if (additions.length === 0) return original

  for (const scene of additions) {
    if (original.parts.filter((part) => part.part_id === scene.part_id).length !== 1) {
      throw new Error(`Series30 scene has no unique authored part: ${scene.slot_id}`)
    }
  }

  return {
    ...original,
    parts: original.parts.map((part) => {
      const scenes = additions.filter((scene) => scene.part_id === part.part_id)
      if (scenes.length === 0) return part

      const slots = [...part.image_slots]
      const references = [...part.illustration_refs]
      for (const scene of scenes) {
        const afterText = scene.after_text[language]
        const count = paragraphs(part[scene.phase]).filter((paragraph) => paragraph === afterText).length
        if (count !== 1) {
          throw new Error(`Series30 image anchor must occur once: ${scene.slot_id}/${language}; got ${count}`)
        }
        if (
          slots.some((slot) => slot.slot_id === scene.slot_id || slot.asset_id === scene.asset_id) ||
          references.includes(scene.asset_id)
        ) {
          throw new Error(`Series30 image slot or asset is duplicated: ${scene.slot_id}`)
        }
        slots.push({
          slot_id: scene.slot_id,
          anchor_key: scene.anchor_key,
          kind: 'shared',
          scene_key: scene.asset_id,
          status: 'hosted_verified',
          asset_id: scene.asset_id,
          runtime_url: null,
          phase: scene.phase,
          after_text: afterText,
        })
        references.push(scene.asset_id)
      }
      return { ...part, image_slots: slots, illustration_refs: references }
    }),
  }
}
