# QISSA — S4E8-A02 «Поддельный знак»: storyboard / **NO accepted art**

**Verified:** 2026-11-18; Draft PR #334, branch `qissa/four-seasons-chronological-runtime-20261112` (initial HEAD `a9f38a649f635ca80246ca9eba57c3b67f6f1b17`). **Stage1 28/29** owner art accepted, 28/29 technically integrated in unpublished Draft PR (S4E8-A01 has passed independent Tier A CI / remote SHA). **S4E8-A02 still 0/1 art approved, 0/1 runtime**, no upload or asset ID. Owner rejected the attempted sword-edited S4E8-A01 image; its original approved reverse-view illustration remains immutable.

## Source, time and placement
- Original RU `src/data/authored/staging/season2Story6TwoReinforcements.ru.json` and UZ `...uz.json`; read directly, no literary changes.
- `story_id=seven_roads_dve_podmogi`, `story_version=interactive-v3`, `part_id=story6_part_2_two_reinforcements`, `phase=post_choice_text`, `kind=shared`, virtual series **S4E8 «Засада у башни»**. Both choice resolutions happen **before** this common epilogue.
- **RU exact full unique anchor (1/1):** `Спереди он выглядел как настоящий знак дорожной стражи. Но с обратной стороны не было клейма мастерской.`.
- **UZ exact full unique anchor (1/1):** `Old tomondan u haqiqiy yo‘l qo‘riqchisi belgisiga o‘xshardi. Lekin orqasida ustaxona tamg‘asi yo‘q edi.`.
- Immediately before: after battle seven brigands are caught, eight escape including the scarred man; Rustam **takes one metallic road-guard badge** from the belt of a captured brigand. In the frame he turns it to inspect the back; **the workshop maker mark is absent**. Immediately after: Rustam says it looks fake and they will compare it with a real one **later in Ordan**. Do **not** show the real second badge, actual later comparison, letter, guilty official, or future outcome.
- Do not imply Rustam has proved the full conspiracy. No child action, beating, newly released prisoner or visible branch-specific action.

## Canon camera and approved visual evidence
- Actual approved predecessor pixel references inspected: `seven_roads_s2_story6_false_reinforcement_watchtower_01_APPROVED.png`, `seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED.png`. Last scene confirms **Rustam** as a mature man with graying hair and facial hair, practical muted olive/brown road-guard riding clothing; adjacent background is a battered pale stone tower with incomplete timber roof and a dark barred prison wagon. **Do not invent a new portrait of Rustam**.
- Strong proposed camera: **macro close-up of Rustam's hands** holding the **back** of one palm-sized worn metal guard badge. Only sleeves of the same muted olive/brown garment, optionally one narrow part of a shoulder; **omit his face** to enforce portrait continuity. Workshop reverse must be plain/unstamped; no invented official insignia, alphabet or maker's stamp. Tower/wagon may be **soft, small background bokeh** only if geography matches earlier approved frame. Hand anatomy must be plausible, badge physically fits between fingers. Warm painterly `seven_roads_painterly_v1`, aspect 16:9. Avoid photorealistic redesign.
- Function: quiet post-battle discovery distinct from battle A01 and from the later S4E9 road-notice and S4E10 prison encounters; show the **lack of hallmark** without designing counterfeit crest as canon.

## Negative self-QA attempts (neither is an owner-review candidate)
- New ImageGen `4c15c776-bd57-40fe-bafc-fd910b193cbe`: technically showed blank badge reverse, but **Rustam's young-looking long dark hair, patterned reddish headwear and face/clothing do NOT match** the approved reveal image. Reject / do not archive as production.
- Follow-up generator `e5190166-6c18-4c83-b2d0-8da5ccf0e69f`: **off-target**, reproduced S4E8 battle / altered saber geometry instead of requested badge detail. Reject, do not reuse or overwrite existing S4E8-A01. These attempts show free generation retained the earlier sword-edit context; do not call it successful controlled edit.
- No A02 PNG shown as ready for owner review, no ART_QUEUE asset_id assigned, no WebP/Storage/runtime, no approval claim. The next attempt must begin from the specified unique post-choice badge discovery, not the earlier sword adjustment. Get a true source-locked image-edit model or use manual controlled composition if generator again drifts.

## Technical gate after separate owner acceptance
New immutable A02 asset only **after** concrete image approval; store a matching exact PNG+WebP+metadata, owner authenticates Supabase upload and we verify public GET/MIME/bytes/SHA. Add unique `SERIES30-S4E8-A02` overlay with these `post_choice_text` exact anchors; confirm S4E8 shared post-choice behavior after either branch, gallery spoiler locks, no S4E7 bleed, no changes to original RU/UZ JSON, story/choice/decision IDs or saved progress. Expected future Stage1 **29/29** accepted/integrated only after that.

**Independent gate:** as of S4E8-A01 code HEAD `2ed848d2e476cc9b22e268c647f1d8261f131c8a`, [Tier A #44234050689](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44234050689) **SUCCESS**; [Seven Roads CI #44234050679](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44234050679) **FAILED** at dev-dependency `npm audit:all` due `picomatch` GHSA-fc5q-39xc-vjpf in Vite chain, production audit 0 issues. Do not disable audit or force-downgrade Vite.


## 2026-11-18 — explicit OWNER ART APPROVAL of S4E8-A02 REVIEW v1 (NOT technical integration)

- Owner replied **«принимаем»** to the exact S4E8-A02 REVIEW v1 close-up (`gen_id=60666b70-842e-47db-9a98-d5555f591722`). This **only** approves the pictured original candidate, not any production release, an alternative render, or a different image.
- New distinct asset_id: `seven_roads_s4e8_rustam_unstamped_guard_badge_02_APPROVED`. Previously approved S4E8-A01 remains unchanged.
- Unmodified approved master PNG **1672×941, 2,197,221 bytes**, SHA256 **`df510e99cf88cf722c0708ee10548d1321515c5916c2792f58049603d1d95678`**. WebP derivative (quality 90 / method 6) **211,566 bytes**, SHA256 **`514c8ad918280f0c3f174a1502a4b4e644ed123350ff9e4ca7ea02de17989fc9`**.
- Three files actually stored in QISSA Library: `/QISSA/production/seven_roads/series30/stage1/S4E8/seven_roads_s4e8_rustam_unstamped_guard_badge_02_APPROVED.png`, matching `.webp`, and `.metadata.json`. Earlier rejected candidate and earlier S4E8 sword-edit still excluded.
- Original authored RU/UZ source anchored exactly/uniquely to `story6_part_2_two_reinforcements` **post_choice_text**, shared after **either** choice. The shown reverse of one badge lacks workshop mark. No second, genuine badge or later Ordan comparison shown.
- Supabase bucket `story-images` object path `seven-roads/season2_tier_a_v2/seven_roads_s4e8_rustam_unstamped_guard_badge_02_APPROVED.webp` **not present** at this checkpoint. No hosted asset URL added to reader, no new Storage object or runtime, no count of technical completion.
- **Stage1 art 29/29; technical 28/29**, PR #334 Draft/Open. After real user Storage upload: independent public GET/MIME `image/webp`, **211566 bytes** and SHA256 `514c8ad918280f0c3f174a1502a4b4e644ed123350ff9e4ca7ea02de17989fc9`, then additive `SERIES30-S4E8-A02` post-choice overlay to RU/UZ reader, registry URL, gallery chronology / spoiler locks / both choices check, 29/29 remote files and 58/58 text anchors, typecheck/build/browser QA. Only after successful CI mark technical 29/29.
- Known separate blocker: `Seven Roads CI` fails `npm audit:all` due picomatch/high dev-build advisories (previous exact SHA `6a115931...`); do not disable audit or force downgrade Vite. Stage1 art approval does not waive release/security gates.

## 2026-11-18 — user Storage upload verified by metadata; additive runtime wiring pending CI

- Owner confirmed upload of **exact approved** `seven_roads_s4e8_rustam_unstamped_guard_badge_02_APPROVED.webp`. Read-only Supabase `storage.objects` query confirms bucket `story-images`, key `seven-roads/season2_tier_a_v2/seven_roads_s4e8_rustam_unstamped_guard_badge_02_APPROVED.webp`, MIME `image/webp`, bytes **211566**. Full remote SHA `514c8ad918280f0c3f174a1502a4b4e644ed123350ff9e4ca7ea02de17989fc9` to be independently verified by CI on same HEAD.
- Additive slot `SERIES30-S4E8-A02` in `seven_roads_dve_podmogi / story6_part_2_two_reinforcements / post_choice_text`, source RU/UZ exact unique stamp-free reverse paragraphs, **shared after either choice**; S4E8 not S4E7. Preserve old authored JSON/choice IDs/progress.
- Added one production hosted URL and 29th asset to public GET/MIME/byte length/SHA CI check; 58 unique RU/UZ anchors expected, gallery fight A01 → common post-choice badge A02, unread locks and independent scene unlock checks. **Stage1 art 29/29, technical 28/29 until CI**.
- Seven Roads full CI previously failed at `npm audit:all` dev dependency picomatch chain; do not skip or misrepresent as green. No merge/deploy/publish.
