# QISSA | Seven Roads — cross-season illustration density audit and Episode 7 visual acceptance

> **CURRENT STATUS UPDATE — 2026-11-06.** The 2026-11-05 audit and proposals preserved below are a historical snapshot. Counts, the E7 wax-clue suggestion and its instruction to create E7 artwork are **superseded** by owner approvals and verified integration in [PR #313](https://github.com/jteshaboev1984-ops/qissa_app/pull/313), [PR #315](https://github.com/jteshaboev1984-ops/qissa_app/pull/315) and [PR #317](https://github.com/jteshaboev1984-ops/qissa_app/pull/317). Do not action old E7 prompts.

## Live visual inventory — 2026-11-06 (all seasons still as staged; S2 unpublished)

| Scope | Unique narrative frames | Seen in one reading | Status |
|---|---:|---:|---|
| Season 1 «Праздник мужества» | 26 | 22 | unchanged |
| S2 Ep1 «Королевское серебро» | 2 | 2 | sparse, later |
| S2 Ep2 «Тайна восточного каравана» | 28 | 26 | existing detailed layout |
| S2 Ep3 «Две башни» | 1 | 1 | next high-priority [issue #318](https://github.com/jteshaboev1984-ops/qissa_app/issues/318) |
| S2 Ep4 «Человек, которого ждут» | **5** | **5** | **complete** — 4 additions + original Tier A, all SHA-verified and RU/UZ registered, issue #312 closed |
| S2 Ep5 «Ложная дорога» | 2 | 2 | sparse, later |
| S2 Ep6 «Две подмоги» | 5 | 4 | unchanged after E6 QA |
| S2 Ep7 «Обратно в Ордан» | **4** | **4** | **complete** — return + quiet morning added; original seal comparison and ending hook retained |

**Season 2 totals as staged:** **47 distinct narrative frames**, **44 visible on a complete one-choice-per-episode route**, plus one shared Season 2 cover (48 unique art assets with cover / 45 seen with cover). The previous baseline of 41 was correct as of the original audit and is retained only as history. Final E4 has 5 shared frames for about 3,422 first-choice words (~684 words/image); E7 has 4 for about 1,791 words (~448 words/image).

**Owner-decision override:** E7 `S2-ST7-SEAL-DEFECT-DETAIL` microscopic wax macro frame was **CANCELLED**, not produced. The approved wider seal-comparison image remains. The owner chose and approved the calm morning with horses in its place. Do not reopen micro-detail attempts.

**Next density work:** S2 E3 (currently 1; propose 3 new images: old Sarvan caravan courtyard with TWO narrow towers, normal market route, and a discussion around sketches/maps after the narrative reveal; all proposals awaiting image approval; see issue #318). S2 E1 (propose +3) and E5 (+1) follow. This remaining +7 would bring S2 from 47 to 54 distinct frames if all later proposals prove worthwhile; it is **not a rigid target** or implicit approval.

**Release boundary:** two newly uploaded E4 images were independently verified by public GET, MIME, byte count and SHA-256 in [GitHub Actions #42195719199](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/42195719199). The verified shared E4 images, original choices and gallery gating passed full Season 2 CI in [PR #317](https://github.com/jteshaboev1984-ops/qissa_app/pull/317). **S2 is NOT PUBLISHED.**

---

**Audit date:** 2026-11-05  
**Scope:** approved manuscript-facing image placements in main; RU story content, localized UZ anchors, original PNG masters in QISSA Library.  
**Status:** editorial recommendation only, **not** new artwork approval. No publication changes. Audio remains deferred.

## 1. The source of the imbalance

Season 1 `prazdnikMuzhestvaV3.ru.json` was a long, fully illustrated single-story package with extensive common scene art and eight alternative-choice illustrations. Season 2 intentionally uses **one shared cover for seven independently stored episodes** (no episode-specific covers). Its Episode 2 `taynaVostochnogoKaravanaV4.ru.json` also has a full visual layout. Other Season 2 episodes were first authored under **Tier A**, a low-density essential-storyboard pass (1–2 frames per episode) rather than a full story-wide illustrative plan.

Episode 6 was subsequently completed with four new/replacement images in public Supabase Storage on 2026-11-05, including both branch outcomes, without inventing another roadblock choice. The visual unevenness of the other episodes is **real**, and should be addressed via scene importance and image density, not by aiming at an arbitrary equal count per episode.

## 2. Actual source counts

Counts below are unique authored **narrative** images (shared + every variant image), excluding cover. In one reading, choice branch image count is only the chosen variant, while the common 2nd-season cover appears outside episode reader.

| Scope | Approx. words on first-choice path | Shared | Branch-variant | Distinct narrative images | Per single reading | Approx. words per shown narrative image |
|---|---:|---:|---:|---:|---:|---:|
| Season 1 story, seven parts | 3,700 | 18 | 8 | 26 | 22 | 168 |
| S2 Ep1 Королевское серебро | 2,769 | 2 | 0 | 2 | 2 | 1,385 |
| S2 Ep2 Тайна восточного каравана | 7,465 | 24 | 4 | 28 | 26 | 287 |
| S2 Ep3 Две башни | 2,575 | 1 | 0 | 1 | 1 | 2,575 |
| S2 Ep4 Человек, которого ждут | 3,422 | 1 | 0 | 1 | 1 | 3,422 |
| S2 Ep5 Ложная дорога | 1,621 | 2 | 0 | 2 | 2 | 811 |
| S2 Ep6 Две подмоги | 1,888 | 3 | 2 | 5 | 4 | 472 |
| S2 Ep7 Обратно в Ордан | 1,791 | 2 | 0 | 2 | 2 | 896 |

**Totals:** S2 currently has **41 unique narrative art assets** across seven episodes, with **38 seen across a complete one-path playthrough**, plus **one** shared S2 cover (42 unique with cover; 39 visible with cover on a season journey). Counts exclude separate story gallery thumbs and historical replaced reveal v1.

*Word-count method:* whitespace-separated Russian narrative word count, common `story_text` + common `post_choice_text` + the first selected resolution in each decision. Varies by player decisions and is approximate. Season 1's illustration behavior displays alternate branch cards, so `visible_assets_per_playthrough` in its package counts 22 chosen sequence images plus the separate cover.

**Do not compare the one 7-part Season 1 story to the single short Season 2 episode without duration normalization.** Conversely, different formats do not justify the exceptionally sparse visual coverage of Episodes 3 and 4.

## 3. Recommended density balancing (proposal, not approval)

Target roughly one meaningful narrative picture per ~400–650 words for **newly expanded** episodes when scene changes warrant it, with a maximum of one close-range micro-detail illustration per evidence-reveal sequence. This is an **editorial proposal**, not an established rule and not a mandate to remove existing approved S1/E2 artwork. Avoid images of repeated dialogue where a still adds no fresh story information.

| S2 episode | Existing images | Proposed additions | Expected distinct images | Top gap |
|---|---:|---:|---:|---|
| 1 | 2 | 3 | 5 | Establish Ordan/royal silver, capture/identity turn, visual network mark |
| 2 | 28 | 0 | 28 | Existing full visual layout; preserve approved coverage |
| 3 | 1 | 3 | 4 | Sarvan city homecoming, pursuit evidence, three-pillars map |
| 4 | 1 | 4 | 5 | Aras route, prison transport plan, Nadir spy contact and route stakes |
| 5 | 2 | 1 | 3 | Mid-journey fork/investigation support without spoiling the decision |
| 6 | 5 | 0 | 5 | Four drawings visible in chosen playthrough — already balanced |
| 7 | 2 | **2 essential**, 1 optional | **4 minimum** | Return to Ordan, close-up of authentic vs copied seal; optional quiet morning at stable |

The **minimum expansion** adds 13 distinctive scene assets, for **54 unique narrative images** across Season 2 before the one shared cover. **Do not infer approval** from this plan: present each new illustration individually for owner acceptance.

## 4. Episode 7 — completed audit of both approved Library PNG masters

Sources:
- `src/data/authored/staging/season2Story7BackToOrdan.ru.json`
- `src/data/authored/staging/season2Story7BackToOrdan.uz.json`
- `src/data/authored/season2TierAVisualSlots.json`
- `docs/qissa/season2/season2_tier_a_runtime_asset_inventory.json`
- QISSA Library: `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/`.

### A. Existing `S2-ST7-TIERA-SEAL-COMPARISON` — keep approved, supplement with evidence detail

Master `seven_roads_s2_story7_aras_seal_comparison_01_APPROVED.png` (inspected visual). Shows Said, Rustam, Daniyar, Rahim, Temur, Samira gathered at two red seals in the guardroom. Correct sequence: an investigator compares two stamped papers before reading the new letter; original RU/UZ anchor and art reference remain valid. 

**Visual limitation:** from normal story-reader width, the central crucial clue—**rounded tip of the horse's front hoof on new authentic seal vs small flat cut-off tip on old copy**—is not sufficiently discernible, even though the two red seals are visible. This matters for a mystery aimed at children. **Do not remove or unapprove the existing image**. Create a separate tightly framed explanatory evidence picture *only after the story explicitly explains the defect*, not earlier. Avoid text labels or image revealing the conclusion before the child's deduction.

Potential additional art slot `S2-ST7-SEAL-DEFECT-DETAIL`, image after:
- RU `— Мастер скопировал только то, что видел, — сказала Самира. — Без потерянного кусочка кончик получился плоским.`
- UZ `— Usta faqat ko‘rgan qismini ko‘chirgan, — dedi Samira. — Yo‘qolgan bo‘lak o‘rnida uch tekis bo‘lib qolgan.`
- Phase `post_choice_text`, **shared after either choice**, no new decision.
- Composition: macro still life with two matching red wax impressions side by side, clear contrast in **one** small front-hoof contour only; optional tiny broken fragment at side; context unchanged. Use painterly book-illustration rendering with optical clarity.

### B. Existing `S2-ST7-TIERA-ENDING-HOOK` — approved composition satisfactory

Master `seven_roads_s2_story7_ending_hook_network_leader_01_APPROVED.png` (inspected visual). Shows older network leader at unfolded route map removing a small wooden marker, scarred messenger in doorway, nocturnal Eastern Forest exterior. Correct narrative event and placement at:
- RU `— Этой дорогой — больше нет.`
- UZ `— Bu yo‘l — endi yo‘q.`

**Assessment:** coherent framing; sinister atmosphere without graphic violence; the map is still spread out and other routes remain. Very small scar detail is hard to discern at normal width, but this is not an acceptance blocker. Keep unchanged. In both PNGs the rendering is more photorealistic than the newer painterly Episode 6 illustrations; future frames should use the approved master style and established character faces, and additional images should not make the style discontinuity worse.

### C. Priority new frame `S2-ST7-RETURN-ORDAN` (essential)

**Purpose:** establish a new location and the outcome of the previous episode before the indoor investigations. From a slightly elevated angle just *inside* Ordan's open gates at sunset, see real Rustam road guards entering first, the locked prison wagon pulled by **two** horses behind them, Daniyar beside the wagon, and a group of **seven** detained assailants escorted separately, with Rahim and children Temur on dark Shamol and Samira on light Bulut. Focus on the line of return and warm safe stone cityscape, not close-up combat or a crowded wall of 20 faces. No released Farid, no bandit escapees in scene, no storming the city.

Potential placement:
- RU story first phase after `Потом семеро задержанных у старой башни.`
- UZ story first phase after `Keyin eski minora yonida qo‘lga olingan yetti kishi.`

Use canonical Ordan architecture, prison wagon from E6, adult costumes, Temur/Samira horses and faces. Keep adult/convoy numbers logically plausible while using distance and partial silhouettes to avoid "everyone foreground" composition.

### D. Optional warmth frame `S2-ST7-MORNING-HORSES`

**Purpose:** contrast yesterday's danger with children's normal playful interaction. Quiet morning courtyard: Samira gives water to pale Bulut, dark Shamol extends muzzle toward Bulut's bucket, Bulut guards it, Temur smiles; no weapons drawn, no maps/seals and no stranger presence.

Candidate placements:
- RU after `Без карт, печатей и разбойников.`
- UZ after `Xaritalarsiz, muhrlarsiz va qaroqchilarsiz.`
- Phase `story_text`, shared; generate only if desired after essential images are approved.

## 5. Production and release boundaries

1. Do not overwrite existing approved masters. Save new PNG masters and separate 1536-width WebPs in QISSA Library. Confirm visual identity and story causal logic **before** marking new image APPROVED.
2. Use exact RU/UZ paragraph anchors, one occurrence per phase. Do not create a new choice. Do not add branch-dependent art unless there is a genuinely distinct visual outcome and both languages are ready.
3. Upload only approved WebPs to a new immutable Supabase prefix; verify SHA-256/bytes/public GET, then update asset resolver, authored staging packages, localized overlay, art/inventory, tests, and gallery in one isolated PR.
4. Run mobile 360/390/430 widths, reading resume, spoiler gates, gallery discovery, previous episode continuity, checks on both RU and UZ. Season 2 remains unpublished.
5. **Proceed next:** create the **first new Episode 7 return-at-Ordan frame for review**, not an automatic approval. Then produce the detailed wax-seal clue illustration. Separately decide whether a third quiet-horses frame adds enough value.
