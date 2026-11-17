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
    part_id: 'story1_part_1_royal_silver_ambush',
    slot_id: 'SERIES30-S2E1-A01',
    anchor_key: 'series30_s2e1_danyar_old_belt_dialogue',
    asset_id: 'seven_roads_s2e1_danyar_old_belt_dialogue_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: '— Иначе пояс мне пришлось бы украсть.',
      uz: '— Bo‘lmasa bu kamarni o‘g‘irlashimga to‘g‘ri kelardi.',
    },
  },
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_1_royal_silver_ambush',
    slot_id: 'SERIES30-S2E1-A02',
    anchor_key: 'series30_s2e1_startled_birds',
    asset_id: 'seven_roads_s2e1_startled_birds_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Птицы, которые только что шумели над травой, вдруг разлетелись.',
      uz: 'Hozirgina o‘tlar ustida shovqin solib yurgan qushlar birdan uchib ketdi.',
    },
  },
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_2_kamran_pursuit',
    slot_id: 'SERIES30-S2E2-A01',
    anchor_key: 'series30_s2e2_missing_dark_horse',
    asset_id: 'seven_roads_s2e2_missing_dark_horse_01_APPROVED',
    phase: 'story_text',
    after_text: { ru: 'Тёмного коня нигде не было.', uz: 'Qoramtir ot ko‘rinmasdi.' },
  },
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
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_3_network_sign',
    slot_id: 'SERIES30-S2E3-A03',
    anchor_key: 'series30_s2e3_capital_trial_glance',
    asset_id: 'seven_roads_s2e3_farid_capital_trial_glance_03_APPROVED',
    // The Silver S2E3/S2E4 split is inside this post-choice phase.
    // This anchor is before the split and remains visible only in S2E3.
    phase: 'post_choice_text',
    after_text: { ru: 'Данияр заметил этот взгляд.', uz: 'Daniyar bu qarashni payqadi.' },
  },
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_3_network_sign',
    slot_id: 'SERIES30-S2E4-A01',
    anchor_key: 'series30_s2e4_missing_kamran_oak',
    asset_id: 'seven_roads_s2e4_missing_kamran_oak_01_APPROVED',
    // The reader moves post-choice narrative after the S2E3/S2E4
    // boundary into a new story_text part for Episode 4.
    phase: 'post_choice_text',
    after_text: { ru: 'Камрана среди них не было.', uz: 'Kamran ular orasida yo‘q edi.' },
  },
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_3_network_sign',
    slot_id: 'SERIES30-S2E4-A02',
    anchor_key: 'series30_s2e4_western_road_map',
    asset_id: 'seven_roads_s2e4_western_road_map_02_APPROVED',
    // The virtual S2E3/S2E4 reader split moves this post-choice section
    // into the story_text phase of the display part for S2E4.
    phase: 'post_choice_text',
    after_text: {
      ru: 'Потом провёл пальцем по дороге на запад.',
      uz: 'Keyin barmog‘ini g‘arbga ketadigan yo‘l bo‘ylab yurgizdi.',
    },
  },
  {
    story_id: 'seven_roads_tayna_vostochnogo_karavana',
    part_id: 'story2_part_5_first_investigation',
    slot_id: 'SERIES30-S3E3-A01',
    anchor_key: 'series30_s3e3_morning_alarm_window',
    asset_id: 'seven_roads_s3e3_morning_alarm_window_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Люди двигались в сторону центра города.',
      uz: 'Odamlar shahar markazi tomon ketayotgandi.',
    },
  },
  {
    story_id: 'seven_roads_tayna_vostochnogo_karavana',
    part_id: 'story2_part_5_first_investigation',
    slot_id: 'SERIES30-S3E3-A02',
    anchor_key: 'series30_s3e3_temur_caravan_courtyard',
    asset_id: 'seven_roads_s3e3_temur_caravan_courtyard_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Темур остановился посреди двора.',
      uz: 'Temur hovli o‘rtasida to‘xtadi.',
    },
  },
  {
    story_id: 'seven_roads_tayna_vostochnogo_karavana',
    part_id: 'story2_part_8_stop_nadir',
    slot_id: 'SERIES30-S3E6-A01',
    anchor_key: 'series30_s3e6_nadir_runs_between_wagons',
    asset_id: 'seven_roads_s3e6_nadir_runs_between_wagons_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Он проскочил между двумя повозками и вылетел через боковой проезд за мастерские.',
      uz: 'U ikki arava orasidan o‘tib, ustaxonalar ortidagi yon yo‘lakka chiqdi.',
    },
  },
  {
    story_id: 'seven_roads_dve_bashni',
    part_id: 'story3_part_2_courier_route',
    slot_id: 'SERIES30-S3E10-A01',
    anchor_key: 'series30_s3e10_memorize_route_gate',
    asset_id: 'seven_roads_s3e10_memorize_route_gate_01_APPROVED_v2',
    phase: 'story_text',
    after_text: {
      ru: 'Темур несколько раз оглянулся, запоминая повороты и приметные места.',
      uz: 'Temur burilishlar va ko‘zga tashlanadigan joylarni eslab qolish uchun bir necha marta ortiga qaradi.',
    },
  },
  {
    story_id: 'seven_roads_dve_bashni',
    part_id: 'story3_part_2_courier_route',
    slot_id: 'SERIES30-S3E10-A02',
    anchor_key: 'series30_s3e10_young_guard_water_trough',
    asset_id: 'seven_roads_s3e10_young_guard_water_trough_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'К ним подошёл молодой стражник.',
      uz: 'Ularning oldiga yosh qo‘riqchi keldi.',
    },
  },
  {
    story_id: 'seven_roads_dve_bashni',
    part_id: 'story3_part_3_three_pillars',
    slot_id: 'SERIES30-S3E11-A01',
    anchor_key: 'series30_s3e11_senior_guard_arrival',
    asset_id: 'seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Через некоторое время пришёл старший стражник из Араса.',
      uz: 'Birozdan keyin Arasdan kelgan katta qo‘riqchi kirdi.',
    },
  },
  {
    story_id: 'seven_roads_dve_bashni',
    part_id: 'story3_part_3_three_pillars',
    slot_id: 'SERIES30-S3E11-A02',
    anchor_key: 'series30_s3e11_bulut_apple_evening',
    asset_id: 'seven_roads_s3e11_bulut_apple_evening_02_APPROVED_v3',
    phase: 'post_choice_text',
    after_text: {
      ru: 'Булут потянулся к яблоку в её руке.',
      uz: 'Bulut uning qo‘lidagi olmaga cho‘zildi.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_1_false_notice_and_route_check',
    slot_id: 'SERIES30-S4E1-A01',
    anchor_key: 'series30_s4e1_dawn_departure_to_ordan',
    asset_id: 'seven_roads_s4e1_dawn_departure_to_ordan_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'На следующее утро Темур и Самира выехали в Ордан.',
      uz: 'Ertasi tong Temur va Samira Ordan tomon yo‘lga chiqdi.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_1_false_notice_and_route_check',
    slot_id: 'SERIES30-S4E2-A03',
    anchor_key: 'series30_s4e2_farid_rider_belts_glance',
    asset_id: 'seven_roads_s4e2_farid_rider_belts_glance_03_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Задержался.',
      uz: 'Bir zum ushlanib qoldi.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_1_false_notice_and_route_check',
    slot_id: 'SERIES30-S4E2-A02',
    anchor_key: 'series30_s4e2_blue_triangle_trade_tag',
    asset_id: 'seven_roads_s4e2_blue_triangle_merchants_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'На них были такие же знаки.',
      uz: 'Ularda ham xuddi shunday belgilar bor edi.',
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
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_2_nadir_red_hill_clue',
    slot_id: 'SERIES30-S4E3-A01',
    anchor_key: 'series30_s4e3_prison_wagon_road_fork',
    asset_id: 'seven_roads_s4e3_prison_wagon_road_fork_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'На развилке повозка оставила главную дорогу на Арас и свернула на старую патрульную.',
      uz: 'Ayrilishda arava Arasga boradigan asosiy yo‘ldan chiqib, eski patrul yo‘liga burildi.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_2_nadir_red_hill_clue',
    slot_id: 'SERIES30-S4E4-A01',
    anchor_key: 'series30_s4e4_nadir_wooden_tokens',
    asset_id: 'seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Незнакомец сверил общий знак, перевернул жетон с двумя башнями и вернул его.',
      uz: 'Notanish odam umumiy belgini solishtirdi, ikki minora tushirilgan nishonchani ag‘dardi va qaytarib berdi.',
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
    illustration_plan: {
      ...original.illustration_plan,
      planned_asset_count: original.illustration_plan.planned_asset_count + additions.length,
      shared_asset_count: original.illustration_plan.shared_asset_count + additions.length,
      visible_assets_per_playthrough: original.illustration_plan.visible_assets_per_playthrough + additions.length,
    },
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
      // The gallery uses image_slots order. Keep it chronological even when
      // newly approved early scenes were added after an existing late scene.
      const orderedSlots = slots.sort((a, b) => {
        const phaseA = a.phase === 'story_text' ? 0 : 1
        const phaseB = b.phase === 'story_text' ? 0 : 1
        if (phaseA !== phaseB) return phaseA - phaseB
        const sourceParagraphs = paragraphs(part[a.phase])
        return sourceParagraphs.indexOf(a.after_text) - sourceParagraphs.indexOf(b.after_text)
      })
      return { ...part, image_slots: orderedSlots, illustration_refs: references }
    }),
  }
}
