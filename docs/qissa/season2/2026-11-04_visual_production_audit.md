# QISSA — Season 2 visual production audit
Date: 2026-11-04

Sources: Season 2 Tier A slot manifest, hosted runtime inventory, Season 2 cover inventory, Story 2 V4 layout/runtime inventories, current Episodes 1–7 RU packages and UZ overlays. All ten approved Tier A PNG masters for Episodes 1 and 3–7 and the shared season cover were visually inspected from QISSA Library.

## Counts

The approved product model is **one shared season cover; no per-episode covers**.

| Class | Count | Technical status |
| --- | ---: | --- |
| Shared season cover | 1 | Approved PNG + hosted verified WebP |
| Published Episode 2 | 28 | All hosted. 24 shared frames + 4 choice-specific frames. |
| Episodes 1, 3, 4, 5, 6, 7 Tier A | 10 | All ten approved masters and hosted WebPs present. |
| **Unique visual assets** | **39** | **All physically present.** |

The cross-season Tier A manifest contains **12 pointers**: 10 newly hosted frames and 2 markers which already belong to Episode 2's 28 images. They must not be double-counted.

## Approved placements: exact scene and current status

| Episode | Picture(s) | Insert after | Verdict |
| --- | --- | --- | --- |
| 1 Royal Silver | Attack; Danyar pursuit | «И понял, что его заметили.»; «Данияр с оставшимся стражником продолжил погоню по основной дороге.» | 2/2 ready |
| 2 Eastern Caravan Mystery | 28-frame V4 sequence; 24 common + 4 selected-choice frames | 28 exact positions in Story 2 V4 layout, including wax impression, interruption, investigation, Sarvan/Nadir choice imagery and finale | 28/28 ready and published |
| 3 Two Towers | Small closed wooden hatch in tower wall | «Под одной из них в стену была встроена деревянная дверца размером чуть больше ладони.» | 1/1 ready |
| 4 The Expected Man | Apparently normal false Aras road notice | «Всё выглядело обычно для дорожного уведомления из Араса.» | 1/1 ready |
| 5 False Road | Red Hill reconnaissance; real reinforcements leave road post | «— Разведка их нашла.»; «Они выехали из поста.» | 2/2 ready |
| 6 Two Reinforcements | False guards talk with Danyar; true Rustam arrives at watchtower | «— Нас прислал Рустам.»; «— Я никого вперёд не посылал.» | FIRST ready; SECOND needs replacement |
| 7 Back to Ordan | Seal comparison; criminal leader moves a road marker | «— Вот. На свежем оттиске кончик округлый. На старом — маленькая ровная грань, будто самый край срезан.»; «— Этой дорогой — больше нет.» | 2/2 ready, seal legibility review advised |

All existing RU anchor paragraphs were verified present; the UZ overlays use their localized anchor equivalents.

## Confirmed critical mismatch: E6 true-Rustam-arrival image

The approved PNG master seven_roads_s2_story6_two_reinforcements_reveal_01_APPROVED.png was **visually inspected**, not merely inferred from the manifest. It depicts a calm, stationary discussion: Rustam and mounted children meeting people standing near the locked prison wagon. There is **no battle**.

The accepted literary version now has fifteen bandits attack Danyar and his six convoy guards **before** Rustam arrives. Rustam's line «Я никого вперёд не посылал» occurs as his four mounted guards enter an **ongoing fight**. Therefore the old frame is **hosted and anchored correctly but artistically obsolete**.

**Replacement specification:** old stone watchtower; heavy barred prison wagon harnessed to exactly two draft horses; Danyar's six guards protecting it; attackers moving in from two sides; Rustam arrives with his four road guards while Rahim, Temur on dark Shamol and Samira on light-grey Bulut follow; clear conflict and action, not a peaceful lineup. Child-appropriate non-graphic danger. Same consistent approved Silk Road painterly look and known costume/horse identities. The image need not literally depict all fifteen bandits if this harms legibility; never show a misleading calm meeting.

Keep existing anchor/slot identity where feasible. Approval and new locked runtime derivative are needed before publication.

### Existing E6 false-reinforcements image

The inspected PNG depicts Danyar confronting a suspicious alleged road guard while his men remain near the closed wagon. It still matches the calm **pre-attack** dialogue. Keep it unchanged.

### E7 wax-seal comparison

The inspected PNG shows both children and adults studying two wax impressions, consistent with the story. The tiny rounded-vs-flat horse-hoof tip is not clearly distinguishable from the whole image at common display scale. Verify on a 430-pixel screen. A delayed magnified inset or separately approved close-up may help, but this is an advisory improvement, **not** a demonstrated timeline contradiction.

### Other frames

Reviewed E1 attack/pursuit, E3 hatch, E4 road notice, E5 Red Hill and departure, E7 criminal leader and map. No significant story-subject mismatch was found. Final in-app mobile rendering remains a separate gate.

## Additional illustrations suggested, NOT currently mandatory in approved Tier A

| Priority | Proposed new frame | Place |
| --- | --- | --- |
| High | E6 old repair cart blocks mountain road; children find hidden bypass | After old trail is discovered, before reaching tower |
| High | E6 A: Temur and Samira stop two attackers in narrow stone passage and close gate | Only in selected Rustam-help choice resolution, after success |
| High | E6 B: Temur and Samira protect barred wagon door; convoy guard arrests attacker | Only in selected wagon-help choice resolution, after success |
| Medium | E7 arrival at Ordan with seven prisoners | Before morning seal investigation |
| Medium | E3/E4 additional location/action beat if later pacing review justifies it | New scope needs approval |
| Optional | E7 magnified evidence for seal-tip difference | Only after text has explained discrepancy |

These are **creative recommendations**, not missing files under the existing fixed 12-slot Tier A plan.

## Next production steps

1. Mandatory: create **one replacement** for E6 reveal; review visually against new battle, approve the master, create WebP, verify byte/hash and update all registries in one atomic change.
2. Recommended: approve **three additional E6 frames** (bypass + two mutually exclusive battle-choice resolutions); then generate and integrate using new slot/asset IDs, exact per-language anchors, and branch-safe Gallery behavior.
3. Test at 430×932, including whether E7 hoof flaw reads clearly on mobile and whether the E6 reveal image appears precisely when Rustam arrives.
4. Keep Stories 1 and 3–7 staged/unpublished until approved and tested; preserve published Episode 2 assets/progress.

**Summary:** one currently mandatory replacement; no missing technical files in the existing visual plan; three high-value proposed additions to E6 if owner approves a richer visual rhythm.
