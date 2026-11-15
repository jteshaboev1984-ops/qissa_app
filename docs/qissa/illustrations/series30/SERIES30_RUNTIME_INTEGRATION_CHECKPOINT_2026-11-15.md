# QISSA — 30-series approved-art runtime integration checkpoint

Date: 2026-11-15. PR #334, branch `qissa/four-seasons-chronological-runtime-20261112`. **Draft code only; no production deploy or PR merge approved.**

## User-uploaded public bucket objects (QISSA project `phwakdpxxyncyslvnqht`)

Queried actual `storage.objects` in bucket `story-images`. Bucket `public=true`. Filenames, MIME `image/webp`, and byte counts checked against locally accepted derivatives. **External independent HTTP GET/SHA proof is a separate CI gate; do not claim it passed before CI.**

| Candidate | Logical asset ID | Actual Storage object suffix | Bytes | Expected SHA256 |
|---|---|---|---:|---|
| S2E3-A01 | `seven_roads_s2e3_farid_gate_arrest_01_APPROVED` | `seven_roads_s2e3_farid_gate_arrest_01_APPROVED.webp` | 532314 | `00f1c705bbd1c446c354a00852039b57a867ff7166839dc88da5170e03c9a8b1` |
| S2E3-A02 | `seven_roads_s2e3_driver_danyar_after_attack_02_APPROVED` | `seven_roads_s2e3_driver_danyar_after_attack_02_APPROVED.webp` | 303376 | `853e88ca1394cc61c7b8857145ad12adf22e70b12d02eadfd211a1f85d077849` |
| S4E2-A01 | `seven_roads_s4e2_bay_horse_roadside_escape_01_APPROVED` | `seven_roads_s4e2_bay_horse_roadside_escape_01_APPROVED_v2.webp` | 566016 | `4a7aa0f82c50c9e5160cc38f29c1ab8660d54bc8debcc00b3504aec89df797c0` |

Shared public prefix: `https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/`.

## S4E2 corrected image: important provenance

The earlier Library image without the `_v2` suffix is superseded **and must not be used for runtime**. Final owner-reviewed V2 has been archived separately to:
`/QISSA/production/seven_roads/series30/stage1/S4E2/seven_roads_s4e2_bay_horse_roadside_escape_01_APPROVED_v2.{png,webp,metadata.json}`.

- V2 PNG: 1672×941, 3491729 bytes, SHA256 `675839596404a57d47edc76807fd99e1ea883d26a2f24cb054f883dd43afc446`.
- V2 WebP: 1672×941, 566016 bytes, SHA256 `4a7aa0f82c50c9e5160cc38f29c1ab8660d54bc8debcc00b3504aec89df797c0`.

## Technical implementation

The previously approved RU authored packages are protected by immutable `github_blob_sha` records in `docs/qissa/season2/season2_staging_authored_package_inventory.json` and fixed historical image count gates. To **preserve those source-hash integrity contracts**, do not append slots directly to historical authored JSON.

Instead:
- `src/data/series30ApprovedSceneSlots.ts` defines the three owner-approved shared slots and exact bilingual anchor pairs. `withSeries30ApprovedSceneSlots()` adds only illustration slots and references to runtime packages. It checks each anchor is unique.
- `src/data/season2StagingAuthoredStories.ts` applies the scene overlay to RU packages and to the localized UZ packages **after localizing**, before `withReadingSeries()` partitions into reader series.
- `src/data/authoredStoryAssets.ts` maps logical IDs to the *actual* object filenames (including the horse's immutable `_v2`).
- `scripts/check-series30-approved-scene-slots.mjs` compiles and executes the actual overlay and reading-series adapter, checking RU/UZ anchors, S2E3 and S4E2 placement, untouched text/choices/IDs, old slot preservation, and v2 registry.
- `scripts/verify-series30-approved-public-webps.mjs` independently downloads those public objects on CI and asserts HTTP status, MIME, bytes, SHA256.
- `npm run check:reading-series-30` runs both baseline and 30-series overlay checks.

## Exact scene anchors

| Candidate | Phase | RU exact after_text | UZ exact after_text | Reader episode |
|---|---|---|---|---|
| S2E3-A01 | `story_text` | `— Фарид.` | `— Farid.` | S2E3 |
| S2E3-A02 | `story_text` | `— Пока не знаю. Но я ещё подумаю.` | `— Hozircha bilmayman. Lekin yana o‘ylab ko‘raman.` | S2E3 |
| S4E2-A01 | `story_text` | `Гнедой промчался мимо.` | `To‘riq ot ularning yonidan chopib o‘tdi.` | S4E2 |

### Remaining release gates

- [ ] CI finished successfully on the **final integration commit**, including independent WebP GET/SHA.
- [ ] Browser smoke: RU and UZ, both choices, 360/390/430px; gallery visibility before/after reading; saved progress.
- [ ] No production deployment/PR merge unless explicitly permitted.

**Other images not approved or added:** S2E3-A03 (jail conversation), S4E2-A02 (blue-triangle cargo tag), S4E2-A03 (Farid recognizes Rider belts). All stay in scene-production queue; do not invent assets or URL links.
