# QISSA S2E7 — Verified Supabase artwork and localized runtime integration

**Updated 2026-11-05. Owner-approved new frames: 2. Four narrative images in this episode; no separate episode cover. Season 2 remains UNPUBLISHED.**

Public-hosting verification: [GitHub Actions 42006002350](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/42006002350) and later PR verification, both using actual public GET bytes, MIME and SHA-256.

The new, original images are hosted **in v2**, not the originally proposed v3:
- Return to Ordan: `seven-roads/season2_tier_a_v2/seven_roads_s2_story7_return_to_ordan_01_APPROVED.webp`
- Morning horses: `seven-roads/season2_tier_a_v2/seven_roads_s2_story7_morning_horses_01_APPROVED.webp`

This integration uses the established Episode 6 expansion pattern: the original Tier A map remains immutable and records the two legacy E7 images; the separate `story7_approved_illustrations_pending_runtime_2026-11-05.json` records and validates the two additional owner-approved, verified shared images. The Russian staging package now has four `image_slots` (2 new + 2 existing), the Uzbek overlay has four localized anchor mappings, and the source index and story text are unchanged.

Both new illustrations appear only when their exact shared `story_text` paragraph is reached. Existing resolution choices, image positions, and gallery discovery rules remain unchanged. A permanent QA gate verifies the new image positions, registry bindings, choice IDs and four-slot contract, while the public WebP workflow verifies the uploaded bytes independently.

**Release state:** E7 staged integration only. No user-facing Season 2 publication/release toggle changed.

---

## Four narrative images including two new

| Proposed shared slot | Approved scene | RU anchor | UZ anchor |
|---|---|---|---|
| `S2-ST7-RETURN-ORDAN` | Returning guards, closed prison wagon (two horses), seven escorted detainees | `Потом семеро задержанных у старой башни.` | `Keyin eski minora yonida qo‘lga olingan yetti kishi.` |
| `S2-ST7-MORNING-HORSES` | Samira watering pale Bulut; dark Shamol approaches the bucket, Temur smiles | `Без карт, печатей и разбойников.` | `Xaritalarsiz, muhrlarsiz va qaroqchilarsiz.` |

Both slots are **shared**, phase `story_text`, Part 1; neither belongs to a branch, and neither creates a new choice. The already approved seal comparison and network leader ending remain unchanged. **The seal macro slot `S2-ST7-SEAL-DEFECT-DETAIL` is cancelled.** The approved return artwork has one minor editorial caveat regarding apparent gate orientation; the owner accepted it.

## Former upload instructions (archive; already completed)

1. Download the two-image ZIP from QISSA Library, path `/QISSA/production/seven_roads/season2_visual_final/QISSA_S2E7_Two_Approved_Illustrations_2026-11-05.zip`, into a local secure developer machine and unzip. Do **not** commit binary images or secrets to the repository.
2. From repository root run `node scripts/check-season2-story7-art-handoff.mjs`; it verifies 2 approved pending slots, both RU/UZ exact anchors once, existing scene slots, and preserved choice IDs.
3. Set `QISSA_S2E7_ASSET_DIR` to the extracted folder. Execute `node scripts/upload-season2-story7-approved-art.mjs --verify-local` to check exact WebP lengths/SHA-256 before any write.
4. Only on a **trusted developer machine**, set a server-side `SUPABASE_SERVICE_ROLE_KEY` via private environment configuration (never paste it in chat, browser or repository). Run `node scripts/upload-season2-story7-approved-art.mjs --apply`. The script refuses an unexpected project, refuses overwrites (`x-upsert: false`), verifies existing objects and verifies public GET bytes and hashes after upload. It targets new immutable `seven-roads/season2_tier_a_v3/` paths.
5. Once both objects pass public verification, update the manifest to `hosted_verified`, add the two new mappings to `src/data/authoredStoryAssets.ts`, RU shared `image_slots` and UZ `image_anchor_texts`, runtime inventory, gallery and relevant tests in a **separate** reviewed integration PR. Existing staging/map checks have locked counts and inventory Git blob SHA expectations; update those together when modifying packages.
6. Verify no premature spoilers, correct RU/UZ episode reading order, stable choice IDs, mobile 360/390/430 widths, resume, gallery unlock, existing Story 2 and Season 2 smoke; do not change season publication flag.

**Evidence boundary:** GitHub knows the approved hash-manifest and manuscript anchors, but cannot infer that Library media has reached Supabase. There is intentionally no new public image URL in this handoff.
