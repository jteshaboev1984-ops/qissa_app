# QISSA S2 Episode 7 — two approved scene illustrations, runtime handoff

**Owner approval:** 2026-11-05. **Both PNG/WebP pairs uploaded to persistent ChatGPT QISSA Library; not uploaded to Supabase Storage. Season 2 must stay UNPUBLISHED.** This supersedes the proposal to generate a microscopic wax-seal clue. Previously approved two E7 frames remain intact.

The machine-readable source for file names, dimensions, SHA-256 and RU/UZ paragraph anchors is [`story7_approved_illustrations_pending_runtime_2026-11-05.json`](./story7_approved_illustrations_pending_runtime_2026-11-05.json).

## Current art

| Proposed shared slot | Approved scene | RU anchor | UZ anchor |
|---|---|---|---|
| `S2-ST7-RETURN-ORDAN` | Returning guards, closed prison wagon (two horses), seven escorted detainees | `Потом семеро задержанных у старой башни.` | `Keyin eski minora yonida qo‘lga olingan yetti kishi.` |
| `S2-ST7-MORNING-HORSES` | Samira watering pale Bulut; dark Shamol approaches the bucket, Temur smiles | `Без карт, печатей и разбойников.` | `Xaritalarsiz, muhrlarsiz va qaroqchilarsiz.` |

Both slots are **shared**, phase `story_text`, Part 1; neither belongs to a branch, and neither creates a new choice. The already approved seal comparison and network leader ending remain unchanged. **The seal macro slot `S2-ST7-SEAL-DEFECT-DETAIL` is cancelled.** The approved return artwork has one minor editorial caveat regarding apparent gate orientation; the owner accepted it.

## Handoff (no premature links)

1. Download the two-image ZIP from QISSA Library, path `/QISSA/production/seven_roads/season2_visual_final/QISSA_S2E7_Two_Approved_Illustrations_2026-11-05.zip`, into a local secure developer machine and unzip. Do **not** commit binary images or secrets to the repository.
2. From repository root run `node scripts/check-season2-story7-art-handoff.mjs`; it verifies 2 approved pending slots, both RU/UZ exact anchors once, existing scene slots, and preserved choice IDs.
3. Set `QISSA_S2E7_ASSET_DIR` to the extracted folder. Execute `node scripts/upload-season2-story7-approved-art.mjs --verify-local` to check exact WebP lengths/SHA-256 before any write.
4. Only on a **trusted developer machine**, set a server-side `SUPABASE_SERVICE_ROLE_KEY` via private environment configuration (never paste it in chat, browser or repository). Run `node scripts/upload-season2-story7-approved-art.mjs --apply`. The script refuses an unexpected project, refuses overwrites (`x-upsert: false`), verifies existing objects and verifies public GET bytes and hashes after upload. It targets new immutable `seven-roads/season2_tier_a_v3/` paths.
5. Once both objects pass public verification, update the manifest to `hosted_verified`, add the two new mappings to `src/data/authoredStoryAssets.ts`, RU shared `image_slots` and UZ `image_anchor_texts`, runtime inventory, gallery and relevant tests in a **separate** reviewed integration PR. Existing staging/map checks have locked counts and inventory Git blob SHA expectations; update those together when modifying packages.
6. Verify no premature spoilers, correct RU/UZ episode reading order, stable choice IDs, mobile 360/390/430 widths, resume, gallery unlock, existing Story 2 and Season 2 smoke; do not change season publication flag.

**Evidence boundary:** GitHub knows the approved hash-manifest and manuscript anchors, but cannot infer that Library media has reached Supabase. There is intentionally no new public image URL in this handoff.
