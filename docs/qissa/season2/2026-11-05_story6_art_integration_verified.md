# QISSA — Season 2, Episode 6: four new illustrations verified and integrated

**Date:** 2026-11-05  
**Final technical state:** **HOSTED_VERIFIED + INTEGRATED_IN_MAIN**, owner-approved artwork, Season 2 **NOT PUBLISHED**.

## Verification evidence

1. QISSA Supabase project `phwakdpxxyncyslvnqht` status `ACTIVE_HEALTHY` on 2026-11-05.
2. `storage.objects` read-only query confirmed four uploaded WebPs under the public `story-images` bucket at `seven-roads/season2_tier_a_v2/`, with correct `image/webp` MIME and byte lengths.
3. GitHub Actions **Season 2 Tier A Slot Check** [run #41978198298](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/41978198298) fetched all four public objects and reported `4/4 Supabase public WebPs match approved SHA256 and byte sizes` and correct localized branch anchors.
4. [Seven Roads CI run #41978198297](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/41978198297), [Tier A Asset Smoke #41978198314](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/41978198314) and Tier A Slot Check all passed on integration commit.
5. Integration merged as [PR #306](https://github.com/jteshaboev1984-ops/qissa_app/pull/306), main SHA `c401fea874a167942b49a9e5f4cb075f8b127632`.
6. Postmerge [GitHub Pages deploy #41978333506](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/41978333506) completed successfully.

## Verified image objects (all exact approved hashes)

Prefix for all paths: `https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/`

| Scene | Filename | Bytes | SHA-256 |
|---|---|---:|---|
| Rustam arrives as battle rages (replaces old reveal) | `seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED.webp` | 528508 | `a95cd925fa32604f09e961148e1797f6b0f9eab9c2eb02eae3c74dfd69b0420c` |
| Bypass old blocked road | `seven_roads_s2_story6_roadblock_bypass_01_APPROVED.webp` | 526246 | `115c462ebcc1ec92667f5ea3d5b923f290376f83f065ae82ec8a6fce82939ae8` |
| Choice A, gate behind tower | `seven_roads_s2_story6_choice_a_gate_flank_01_APPROVED.webp` | 412828 | `a143606acd8ce040479e90ae9f33cd30ae6faf0087dd8c36976a95965a88cc97` |
| Choice B, rear prison-wagon door | `seven_roads_s2_story6_choice_b_wagon_door_01_APPROVED.webp` | 432082 | `60a9240767a4c2afe598ffefccaa3e9628bb1e94f1bddc2c2e84266b78a70051` |

Existing fifth distinct Episode 6 frame `seven_roads_s2_story6_false_reinforcement_watchtower_01_APPROVED.webp` stays hosted on Tier A v1; it is not overwritten.

## Exact reader placement contract

- Common Part 1: false relief after RU `— Нас прислал Рустам.` / UZ `— Bizni Rustam yubordi.` (preexisting image).
- Common Part 1: bypass after RU `— Нашёл!` / UZ `— Topdim!` (new).
- Common Part 2: Rus­tam arrival after RU `— Я никого вперёд не посылал.` / UZ `— Men hech kimni oldindan yubormadim.` (replaces v1 image, preserves `S2-ST6-TIERA-REVEAL`).
- Choice A only, **help Rustam** (legacy choice ID `story6_choice_2a_wagon_team`): after RU `Рахим связал обезоруженного мужчину.` / UZ `Rahim qurolsiz qolgan erkakning qo‘llarini bog‘ladi.`.
- Choice B only, **protect the wagon** (legacy choice ID `story6_choice_2b_clear_return_road`): after RU `Он задержал преступника.` / UZ `Qo‘riqchi jinoyatchini qo‘lga oldi.`.

**Per full playthrough:** four episode images total (false relief + bypass + Rustam arrival + choice A **or** B). The common Season 2 cover is not counted among the four.

## Preserved invariants

- No change to the literary texts, choice IDs, outcomes, episode numbering, saved progress schema, or Story 2 already-published art.
- Original v1 reveal remains as archived historical artwork and does not appear in the active E6 frame.
- Season 2 and episodes 1, 3–7 are **not published**. Existing user-facing release flags have not been changed.
- The code's approved-art check verifies both RU/UZ anchors, branch separation, public object paths and, inside GitHub Actions, public contents and hashes.
- All source PNGs and WebPs remain in the persistent QISSA Library, and the approved four-art ZIP archive remains at `/QISSA/production/seven_roads/season2_visual_final/QISSA_S2_E6_ALL_FOUR_APPROVED_ARTWORKS_2026-11-05.zip`.

This verification note supersedes the **pending-hosting** status in historical pre-upload acceptance documents while preserving their original provenance.
