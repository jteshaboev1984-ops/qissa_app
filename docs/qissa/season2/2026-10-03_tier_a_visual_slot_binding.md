# QISSA Season 2 — Tier A visual slot binding checkpoint

Date: 2026-10-03  
Branch: `season2-tier-a-runtime-slots`  
Base main SHA: `8bd41033c9ff753cceabea7271fc7acf241f9d5b`

## Scope

This checkpoint binds the approved Season 2 Tier A visual masters to exact narrative anchors without publishing any new story or exposing unhosted assets in the public runtime.

Source visual package:

`/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/`

Implementation manifest:

`src/data/authored/season2TierAVisualSlots.json`

Typed registry:

`src/data/season2TierAVisualSlots.ts`

Validation:

`npm run check:season2-tier-a-slots`

## Slot map

| Story | Slot | Approved asset | Render after exact anchor | Runtime state |
| --- | --- | --- | --- | --- |
| 1 — Королевское серебро | S2-ST1-TIERA-ATTACK | seven_roads_s2_story1_royal_silver_attack_01_APPROVED | «И понял, что его заметили.» | staged master only |
| 1 — Королевское серебро | S2-ST1-TIERA-PURSUIT | seven_roads_s2_story1_danyar_pursuit_01_APPROVED | «Данияр с оставшимся стражником продолжил погоню по основной дороге.» | staged master only |
| 2 — Тайна восточного каравана | P3-IMG-01 | seven_roads_story2_p3_img_01_v2 | existing V4 anchor | published existing runtime |
| 2 — Тайна восточного каравана | P3-IMG-02 | seven_roads_story2_p3_img_02_v1 | existing V4 anchor | published existing runtime |
| 3 — Две башни | S2-ST3-TIERA-NICHE | seven_roads_s2_story3_two_towers_niche_discovery_01_APPROVED | «Под одной из них в стену была встроена деревянная дверца размером чуть больше ладони.» | staged master only |
| 4 — Человек, которого ждут | S2-ST4-TIERA-FALSE-NOTICE | seven_roads_s2_story4_false_aras_notice_01_APPROVED | «Всё выглядело обычно для дорожного уведомления из Араса.» | staged master only |
| 5 — Ложная дорога | S2-ST5-TIERA-RED-HILL | seven_roads_s2_story5_red_hill_recon_01_APPROVED | «— Разведка их нашла.» | staged master only |
| 5 — Ложная дорога | S2-ST5-TIERA-REAL-REINFORCEMENT | seven_roads_s2_story5_real_reinforcement_departure_01_APPROVED | «Они выехали из поста.» | staged master only |
| 6 — Две подмоги | S2-ST6-TIERA-FALSE-REINFORCEMENT | seven_roads_s2_story6_false_reinforcement_watchtower_01_APPROVED | «— Нас прислал Рустам.» | staged master only |
| 6 — Две подмоги | S2-ST6-TIERA-REVEAL | seven_roads_s2_story6_two_reinforcements_reveal_01_APPROVED | «— Я никого вперёд не посылал.» | staged master only |
| 7 — Обратно в Ордан | S2-ST7-TIERA-SEAL-COMPARISON | seven_roads_s2_story7_aras_seal_comparison_01_APPROVED | hoof-difference explanation | staged master only |
| 7 — Обратно в Ордан | S2-ST7-TIERA-ENDING-HOOK | seven_roads_s2_story7_ending_hook_network_leader_01_APPROVED | «— Этой дорогой — больше нет.» | staged master only |

## Safety / release contract

- Story 2 remains the only already-published runtime represented in this Tier A map.
- Stories 1 and 3–7 remain staging-only.
- Their approved masters are **not** added to `src/data/authoredStoryAssets.ts` until runtime derivatives exist and public Storage objects are verified.
- The manifest is anchor-driven: an image renders only after its exact paragraph to avoid clue spoilers.
- Gallery discovery must occur only after the reader reaches the image.
- This change does not publish Stories 1 or 3–7, does not change Season 2 public story ordering, and does not create new Supabase URLs.

## Source authority notes

Accepted literary sources used for exact anchors:

- Story 1: `seven_roads_s2_story1_royal_silver_literary_v5.md`
- Story 2: existing repository V4 layout manifest
- Story 3: `seven_roads_s2_story3_two_towers_literary_v6.md`
- Story 4: `seven_roads_s2_story4_waited_man_literary_v4.md`
- Story 5: `seven_roads_s2_story5_false_road_literary_v4.md`
- Story 6: `seven_roads_s2_story6_two_reinforcements_literary_v3.md`
- Story 7: `seven_roads_s2_story7_back_to_ordan_literary_v17_visible_inherited_defect.md`

Canonical Story 5 and Story 6 literary snapshots are stored under `/QISSA/production/seven_roads/season2_text/approved/`.

## Next implementation gate

1. Create locked runtime WebP derivatives for the staged Tier A masters.
2. Build byte/hash inventory.
3. Upload to a dedicated verified Supabase Storage prefix.
4. Only then register public asset URLs.
5. Integrate each slot into its authored story package and run mobile reader/Gallery smokes.
6. Publish stories only after localization and product-shell gates pass.
