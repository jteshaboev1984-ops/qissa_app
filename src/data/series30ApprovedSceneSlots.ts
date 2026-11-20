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
    story_id: 'seven_roads_obratno_v_ordan',
    part_id: 'story7_part_1_back_to_ordan',
    slot_id: 'SERIES30-S4E9-A02',
    anchor_key: 'series30_s4e9_a02',
    asset_id: 'seven_roads_s4e9_said_tells_nadir_stay_as_witness_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Надир сразу перестал улыбаться.',
      uz: 'Nadir darrov kulmay qo‘ydi.',
    },
  },
  {
    story_id: 'seven_roads_lozhnaya_doroga',
    part_id: 'story5_part_1_false_road',
    slot_id: 'SERIES30-S4E6-A02',
    anchor_key: 'series30_s4e6_a02',
    asset_id: 'seven_roads_s4e6_scarred_man_guard_disguise_02_APPROVED',
    phase: 'post_choice_text',
    after_text: {ru: 'Когда поднял голову, на свету стал заметен тонкий белый шрам от левой брови к виску.', uz: 'Boshini ko‘targanda chap qoshidan chakkasigacha ketgan ingichka oq chandiq yorug‘likda ko‘rindi.'},
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_2_nadir_red_hill_clue',
    slot_id: 'SERIES30-S4E4-A03',
    anchor_key: 'series30_s4e4_a03',
    asset_id: 'seven_roads_s4e4_undercover_guard_reads_nadir_note_03_APPROVED',
    phase: 'post_choice_text',
    after_text: {
      ru: 'Только за дальним навесом, скрывшись за сложенными тюками, он развернул записку и прочитал сообщение.',
      uz: 'Faqat uzoqdagi soyabon ortiga, taxlangan yuklar orasidagi pana joyga o‘tgach, u xatni ochib o‘qidi.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_2_nadir_red_hill_clue',
    slot_id: 'SERIES30-S4E4-A04',
    anchor_key: 'series30_s4e4_a04',
    asset_id: 'seven_roads_s4e4_messenger_warns_danyar_ordan_gate_04_APPROVED',
    phase: 'post_choice_text',
    after_text: {
      ru: 'За воротами Орданы первым уже мчался гонец с предупреждением для Данияра.',
      uz: 'Ordan darvozasidan avval Daniyarni ogohlantirishga ketgan chopar otilib chiqdi.',
    },
  },
  {
    story_id: 'seven_roads_tayna_vostochnogo_karavana',
    part_id: 'story2_part_5_first_investigation',
    slot_id: 'SERIES30-S3E4-A01',
    anchor_key: 'series30_s3e4_a01',
    asset_id: 'seven_roads_s3e4_old_passage_map_recollection_01_APPROVED',
    phase: 'post_choice_text',
    after_text: {
      ru: '— Старый скотный проход у прежнего караванного двора.',
      uz: '— Eski karvonsaroydagi chorva o‘tish joyi.',
    },
  },
  {
    story_id: 'seven_roads_tayna_vostochnogo_karavana',
    part_id: 'story2_part_7_samira_check_and_third_track',
    slot_id: 'SERIES30-S3E5-A01',
    anchor_key: 'series30_s3e5_a01',
    asset_id: 'seven_roads_s3e5_samira_bulut_old_yard_reunion_01_APPROVED',
    phase: 'post_choice_text',
    after_text: {
      ru: 'Самира сидела на Булуте у входа во двор.',
      uz: 'Samira Bulutda hovli kirishida turardi.',
    },
  },
  {
    story_id: 'seven_roads_tayna_vostochnogo_karavana',
    part_id: 'story2_part_7_samira_check_and_third_track',
    slot_id: 'SERIES30-S3E5-A02',
    anchor_key: 'series30_s3e5_a02',
    asset_id: 'seven_roads_s3e5_temur_shows_bandit_sign_drawing_02_APPROVED',
    phase: 'post_choice_text',
    after_text: {
      ru: 'Он показал Самире рисунок знака, который сделал у капитана.',
      uz: 'Temur sardorning oldida chizib olgan qaroqchilar belgisini Samiraga ko‘rsatdi.',
    },
  },
  {
    story_id: 'seven_roads_tayna_vostochnogo_karavana',
    part_id: 'story2_part_9_interrogation_and_sarvan_token',
    slot_id: 'SERIES30-S3E7-A01',
    anchor_key: 'series30_s3e7_a01',
    asset_id: 'seven_roads_s3e7_captain_stops_writing_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Капитан перестал писать.',
      uz: 'Sardor yozishni to‘xtatdi.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_1_false_notice_and_route_check',
    slot_id: 'SERIES30-S4E2-A05',
    anchor_key: 'series30_s4e2_a05',
    asset_id: 'seven_roads_s4e2_ordan_east_gate_arrival_05_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Ордан встретил Темура и Самиру шумом тяжёлых колёс.',
      uz: 'Ordan Temur bilan Samirani og‘ir g‘ildiraklarning shovqini bilan kutib oldi.',
    },
  },
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_2_kamran_pursuit',
    slot_id: 'SERIES30-S2E2-A02',
    anchor_key: 'series30_s2e2_a02',
    asset_id: 'seven_roads_s2e2_east_gate_messenger_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Когда он добрался до восточных ворот, начальник караула выслушал его и сразу отправил двух городских стражников дальше: одного — к внешнему караванному двору, второго — к старым скотным воротам.',
      uz: 'U sharqiy darvozaga yetib borgach, qorovul boshlig‘i gapini eshitdi va darrov ikki shahar qo‘riqchisini oldinga yubordi: birini tashqi karvon hovlisiga, ikkinchisini eski chorva darvozasiga.',
    },
  },
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_3_network_sign',
    slot_id: 'SERIES30-S2E4-A03',
    anchor_key: 'series30_s2e4_a03',
    asset_id: 'seven_roads_s2e4_rescued_rider_reports_to_leader_03_APPROVED',
    phase: 'post_choice_text',
    after_text: {
      ru: 'Только теперь главарь встал.',
      uz: 'Shundan keyingina boshliq o‘rnidan turdi.',
    },
  },
  {
    story_id: 'seven_roads_korolevskoe_serebro',
    part_id: 'story1_part_3_network_sign',
    slot_id: 'SERIES30-S2E4-A04',
    anchor_key: 'series30_s2e4_a04',
    asset_id: 'seven_roads_s2e4_ordan_informant_bay_horse_arrival_04_APPROVED',
    phase: 'post_choice_text',
    after_text: {
      ru: 'К вечеру в логово приехала женщина на гнедой лошади. Она жила в Ордане и собирала для сети дорожные сведения у внешних дворов.',
      uz: 'Kechga yaqin yashirin joyga jigarrang ot mingan ayol keldi. U Ordanda yashar va tashqi hovlilardagi yo‘l ma’lumotlarini tarmoq uchun yig‘ardi.',
    },
  },
  {
    story_id: 'seven_roads_dve_bashni',
    part_id: 'story3_part_1_old_yard_niche',
    slot_id: 'SERIES30-S3E9-A01',
    anchor_key: 'series30_s3e9_a01',
    asset_id: 'seven_roads_s3e9_bulut_blocks_shamol_feeder_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Булут шагнул поперёк.',
      uz: 'Bulut uning yo‘lini to‘sib qo‘ydi.',
    },
  },
  {
    story_id: 'seven_roads_dve_bashni',
    part_id: 'story3_part_1_old_yard_niche',
    slot_id: 'SERIES30-S3E9-A02',
    anchor_key: 'series30_s3e9_a02',
    asset_id: 'seven_roads_s3e9_gate_sketch_matches_two_towers_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Темур поднял лист и посмотрел сначала на рисунок, потом на настоящие ворота.',
      uz: 'Temur varaqni ko‘tarib, avval rasmga, keyin haqiqiy darvozaga qaradi.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_1_false_notice_and_route_check',
    slot_id: 'SERIES30-S4E1-A02',
    anchor_key: 'series30_s4e1_a02',
    asset_id: 'seven_roads_s4e1_captain_two_clue_sketches_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Капитан придвинул к ним рисунки.',
      uz: 'Sardor rasmlarni ularning oldiga surdi.',
    },
  },
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_1_false_notice_and_route_check',
    slot_id: 'SERIES30-S4E2-A04',
    anchor_key: 'series30_s4e2_a04',
    asset_id: 'seven_roads_s4e2_nadir_waits_at_caravan_stables_04_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Во второй день он снова таскал тюки, носил воду и помогал у конюшен.',
      uz: 'Ikkinchi kuni ham u yuk tashidi, suv olib keldi va otxonalarda yordam berdi.',
    },
  },
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
  {
    story_id: 'seven_roads_chelovek_kotorogo_zhdut',
    part_id: 'story4_part_2_nadir_red_hill_clue',
    slot_id: 'SERIES30-S4E4-A02',
    anchor_key: 'series30_s4e4_nadir_flask_left_rear_hook',
    asset_id: 'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED',
    phase: 'post_choice_text',
    after_text: {
      ru: 'Повесил флягу на левый задний крюк — это и был условленный знак.',
      uz: 'Suv idishini chap orqa ilgakka osdi. Bu oldindan kelishilgan ishora edi.',
    },
  },
  {
    story_id: 'seven_roads_lozhnaya_doroga',
    part_id: 'story5_part_1_false_road',
    slot_id: 'SERIES30-S4E5-A01',
    anchor_key: 'series30_s4e5_nadir_scar_clue_briefing',
    asset_id: 'seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Он провёл пальцем от левой брови к виску.',
      uz: 'U barmog‘ini chap qoshidan chakkasigacha yurgizdi.',
    },
  },
  {
    story_id: 'seven_roads_lozhnaya_doroga',
    part_id: 'story5_part_1_false_road',
    slot_id: 'SERIES30-S4E5-A02',
    anchor_key: 'series30_s4e5_said_stone_ridge_map',
    asset_id: 'seven_roads_s4e5_said_stone_ridge_map_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Он провёл пальцем вдоль Каменного гребня.',
      uz: 'U barmog‘ini Tosh tizmasi bo‘ylab yurgizdi.',
    },
  },
  {
    story_id: 'seven_roads_lozhnaya_doroga',
    part_id: 'story5_part_1_false_road',
    slot_id: 'SERIES30-S4E6-A01',
    anchor_key: 'series30_s4e6_north_stone_ridge_riders',
    asset_id: 'seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Они уже находились по северную сторону Каменного гребня; Красный холм остался за ним и отсюда не был виден.',
      uz: 'Ular allaqachon Tosh tizmasining shimoliy tomonida edi; Qizil tepalik tizma ortida qolgan va bu yerdan ko‘rinmasdi.',
    },
  },
  {
    story_id: 'seven_roads_obratno_v_ordan',
    part_id: 'story7_part_1_back_to_ordan',
    slot_id: 'SERIES30-S4E9-A01',
    anchor_key: 'series30_s4e9_said_suspicious_road_notice',
    asset_id: 'seven_roads_s2_story7_said_suspicious_road_notice_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Когда все закончили, он положил на стол дорожное уведомление из Араса.',
      uz: 'Hamma tugatgach, u Arasdan kelgan yo‘l xabarnomasini stolga qo‘ydi.',
    },
  },
  {
    story_id: 'seven_roads_obratno_v_ordan',
    part_id: 'story7_part_1_back_to_ordan',
    slot_id: 'SERIES30-S4E10-A02',
    anchor_key: 'series30_s4e10_three_gazes_two_letters',
    asset_id: 'seven_roads_s4e10_three_gazes_two_letters_02_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'Рустам придвинул оба письма к окну, совместил красные круги краями и чуть повернул их. Боковой свет лёг по рельефу, и мелкие края стали заметнее.',
      uz: 'Rustam ikki xatni derazaga yaqinroq surdi, qizil doiralarni chetlari bilan tenglashtirib, birini sal burdi. Yon tomondan tushgan yorug‘lik bo‘rtma izlarni ko‘rsatdi va mayda chetlar aniqroq ko‘rina boshladi.',
    },
  },
  {
    story_id: 'seven_roads_obratno_v_ordan',
    part_id: 'story7_part_1_back_to_ordan',
    slot_id: 'SERIES30-S4E10-A01',
    anchor_key: 'series30_s4e10_farid_danyar_prison_window',
    asset_id: 'seven_roads_s2_story7_farid_danyar_prison_window_01_APPROVED',
    // This post-choice scene belongs to the virtual S4E10 reader episode.
    phase: 'post_choice_text',
    after_text: {
      ru: 'Данияр остановился.',
      uz: 'Daniyar to‘xtadi.',
    },
  },
  {
    story_id: 'seven_roads_obratno_v_ordan',
    part_id: 'story7_part_1_back_to_ordan',
    slot_id: 'SERIES30-S4E10-A03',
    anchor_key: 'series30_s4e10_temur_shamol_stable_samira',
    asset_id: 'seven_roads_s4e10_temur_shamol_stable_samira_03_APPROVED',
    // Owner-approved, shared post-choice scene. Shamol reaches Temur's sleeve at the stable.
    phase: 'post_choice_text',
    after_text: {
      ru: 'Шамол потянулся к его рукаву.',
      uz: 'Shamol uning yengiga cho‘zildi.',
    },
  },
  {
    story_id: 'seven_roads_dve_podmogi',
    part_id: 'story6_part_2_two_reinforcements',
    slot_id: 'SERIES30-S4E8-A01',
    anchor_key: 'series30_s4e8_wall_two_fronts_reverse_view',
    asset_id: 'seven_roads_s4e8_wall_two_fronts_reverse_view_01_APPROVED',
    phase: 'story_text',
    after_text: {
      ru: 'У повозки один конвойный опустился на колено после сильного удара. Другой отбивался от двух противников. Третий разбойник искал путь к задней двери.',
      uz: 'Arava yonida bir qo‘riqchi kuchli zarbadan so‘ng tiz cho‘kdi. Boshqasi ikki dushmanning zarbasini qaytarardi. Uchinchi bosqinchi orqa eshikka yo‘l izlar edi.',
    },
  },
  {
    story_id: 'seven_roads_dve_podmogi',
    part_id: 'story6_part_2_two_reinforcements',
    slot_id: 'SERIES30-S4E8-A02',
    anchor_key: 'series30_s4e8_rustam_unstamped_guard_badge',
    asset_id: 'seven_roads_s4e8_rustam_unstamped_guard_badge_02_APPROVED',
    // Shared post-choice scene: both choices rejoin before Rustam checks the badge.
    phase: 'post_choice_text',
    after_text: {
      ru: 'Спереди он выглядел как настоящий знак дорожной стражи. Но с обратной стороны не было клейма мастерской.',
      uz: 'Old tomondan u haqiqiy yo‘l qo‘riqchisi belgisiga o‘xshardi. Lekin orqasida ustaxona tamg‘asi yo‘q edi.',
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
