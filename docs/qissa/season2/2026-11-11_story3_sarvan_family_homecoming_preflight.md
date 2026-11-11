# QISSA — Season 2 Episode 3 «Две башни» — Sarvan family homecoming

**Editorial preflight:** 11 November 2026  
**STATUS:** LITERARY ANCHOR VERIFIED / **VISUAL NOT GENERATED OR APPROVED**. NOT a visual-canon change. Not integrated into RU/UZ runtime.  
**Source main SHA:** `db8ef073290238f70aedb0bd9cc8da9ce563c806`  
**Issue:** [#318](https://github.com/jteshaboev1984-ops/qissa_app/issues/318)  
**Style:** `seven_roads_painterly_v1`, literary painting, target landscape 16:9.  
**Priorities:** text fidelity → geography → continuity → emotions → aesthetics. Do not add narrative content.

## 1. Why this is the next illustration

- S2E2 «Тайна восточного каравана» **already** has 24 shared narrative images plus 4 choice-specific images; do not add images for an artificial season-wide number.
- S2E3 has four approved narrative images: Sarvan old caravan yard, the two-tower niche, Sarvan market, and the guardhouse drawings/map.
- The **beginning** of S2E3 Part 1 has an extended unillustrated sequence (roughly 5.3k Russian characters before the first existing image), including a psychologically meaningful homecoming after several days' travel.
- A warm family scene here adds narrative/tonal contrast to the investigation, rather than duplicating any approved tower/market/clue image. It also illustrates a documented rest/cleaning window central to the owner-approved Costume Continuity V1.
- S2E4 has another approved homecoming scene — **Temur's** family in **Aras**, not **Samira's** in Sarvan. This new image must depict a *distinct courtyard and camera*, not copy the Aras homecoming composition.

## 2. Exact bilingual placement (verified in main)

- RU package: `src/data/authored/staging/season2Story3TwoTowers.ru.json`, Part 1 `story3_part_1_old_yard_niche`, `story_text`, immediately **after** a *whole exact paragraph*:  
  **`Из дома вышла её мать и сразу обняла Самиру.`**
- UZ overlay: `src/data/authored/staging/season2Story3TwoTowers.uz.json`, identical Part 1 and phase, after:  
  **`Uydan onasi chiqib, darrov Samirani quchoqladi.`**
- Verified **exactly one** matching paragraph in each source on `db8ef073290238f70aedb0bd9cc8da9ce563c806`. RU Git blob `8b9ea5d89115fc6d0bc90d3521875ee9eec76b7f`; UZ blob `5d1e2acdac664a108774931aa5fa1c4dc914cffd`.
- Proposed future slot (only AFTER owner approval): `S2-ST3-SARVAN-FAMILY-RETURN`, `kind=shared`, `phase=story_text`, `after_text=RU anchor`; same slot's UZ anchor in `image_anchor_texts`.
- Story3 Part1 existing slots and approved assets **must retain order**: new scene **before** `S2-ST3-SARVAN-YARD` and `S2-ST3-TIERA-NICHE`. No new cover or branch art. Existing E3 Part2 and Part3 images unchanged.

## 3. What happens in the text (RU/UZ matched)

- Temur, Samira and an adult guard reached Sarvan toward evening after many days of movement between Aras and Sarvan. Their escort left for the local guard commander at the **city gate**, so he **must not** appear at the family courtyard.
- Samira leads Temur to her family house on a quiet street near the inner market. **Bulut knows the way**. Their horses are tired after a day of riding.
- At the courtyard entrance Samira's father comes out **first**, sees Samira, then Temur, then both tired horses. Mother then comes from the house and **hugs Samira**. Temur is just getting off Shamol by the gate when she notices him. This is BEFORE they remove saddles, offer water/feed, wash, eat or go to sleep.
- Mother's explicit instruction to wash and eat occurs **after** the planned anchor. Do not portray freshly bathed children, a laid-out supper, clean replacement outfits or sleeping arrangements in this frame.
- This is a domestic welcome. There is **no active pursuit, guard squad, mysterious evidence, network emblem, prison or spoiler**.

## 4. Mandatory single-image composition

**One natural painting, not infographic or caption sheet**. View from a slightly oblique angle **within a modest lived-in courtyard** near the partially open timber gate, allowing the quiet street to be glimpsed, not dominating the scene. Soft long evening shadows, warm adobe/stone/plaster walls, carved timber details, modest Sarvan household near an inner market; no domes, monumental palace or wealthy interiors.

- Center of *emotional* composition: Samira's mother is holding **Samira** in a spontaneous affectionate embrace outside the family doorway.
- Samira: 12, long single braid, deep burgundy riding chapan, cream trousers, brown boots and practical equipment, mild accumulated dust from the long ride. Her cream-and-teal outer travel ensemble from the **later S2E5 fork** is **not present here**.
- Temur: 12, lean, blue-deep-teal rider chapan, beige trousers, brown boots, patterned blue cap as in outdoor reference; at or just beside the gate **just dismounted** from Shamol with a plausible grip on the reins, quietly observing the reunion.
- Father: Sarvan civilian adult male in simple non-regal Central Asian-inspired practical clothing; stands near courtyard entrance, receiving the travelers and noticing the two tired horses, leaving space for the embrace. No extra servants or guards.
- Horses: Temur's Shamol is dark bay nearly black, black mane/tail, **small narrow white star on forehead, no white socks**, dark tack/deep teal blanket. Samira's Bulut is light dapple gray, darker mane/tail, **no forehead star or blaze**, deep burgundy blanket. Both correct owners, natural lean athletic proportions, standing quietly near gate; avoid overlap/merged legs/reins.
- Wide 16:9 with medium figures; children **clearly identifiable but not huge foreground portraits**. The four people should feel together within the same scene. Courtyard architecture and late sun establish genuine geography, not a decorative fairy-tale palace.
- Avoid a duplicate of approved `seven_roads_s2_story4_homecoming_01_APPROVED` (Temur's home in Aras); distinct visual framing and familial roles.
- Restrained painterly brush texture and warm lighting from approved World Bible V2 style. Not photorealistic, glossy 3D, high fantasy, video game or cartoon.

**Forbidden:** Temur hugging Samira's mother, S2E5 wooden signpost / diverging roads, Rahim/Rustam/Danyar/Kamran, guards at the house, new companions, mother as a queen, new horses, wrong horse coats/white blaze, mud from the Festival weeks later, cream/teal **fork** outfit, fresh washed garments, banquet, banners, slogans, labels, text, UI/infographic, supernatural effects, improbable body/horse anatomy.

## 5. Artistic check and approval gate

1. Match EXACT current RU and UZ paragraph plus immediate before/after action.
2. Are four people the correct roles and only TWO horses present?
3. Correct faces, proportions, clothing, braid and horses from `QISSA_MASTER_REFERENCE_user_selected.png` and `01_heroes_horses_approved.png` / `SEVEN_ROADS_COSTUME_CONTINUITY_V1.md`.
4. Is arrival just before washing and dinner, late evening and dusty?
5. Does house look like Sarvan family courtyard, neither royal dwelling nor caravan camp?
6. Are mother/daughter physically embracing naturally, Temur dismounting naturally, father standing naturally?
7. Is the staging different from already approved Temur/Aras homecoming image?
8. Does the picture keep mysteries and decisions hidden?
9. Is it a **single atmospheric frame**, not explanatory text or a panel collage?
10. No visual acceptance until owner sees and explicitly approves.

**Generation attempt log (discarded):** Two 2026-11-11 outputs were automatically wrong (one clothing infographic, one reprise of S2E5 fork). Neither is a Sarvan homecoming illustration and **neither is APPROVED or a visual reference**. A fallback generation service returned HTTP 409 Conflict. Stop repeated wrong generations; retain this preflight to support a corrected, source-anchored tool invocation.

## 6. Technical sequence AFTER a real owner-approved frame

Owner art signoff → preserve PNG original/optimized WebP/independent SHA manifest in permanent QISSA library → owner uploads WebP to `story-images/seven-roads/season2_tier_a_v2/` → actual independent Storage GET response bytes, MIME, size and SHA verification → exact RU `image_slots` and UZ `image_anchor_texts` → update source/inventory/asset registry/gallery only as necessary → test unchanged prose, choices, state, old image order, wardrobe schema, localization, TypeScript, build and browser smoke → CI green → PR merge → Issue #318 checkpoint.

**No user approval or asset upload exists for this new frame.** Both season and E3 staging remain **UNPUBLISHED**.
