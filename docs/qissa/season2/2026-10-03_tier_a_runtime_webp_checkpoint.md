# QISSA Season 2 — Tier A runtime WebP checkpoint

Date: 2026-10-03  
Branch: `season2-tier-a-runtime-slots`

## Result

The ten newly approved Season 2 Tier A masters for Stories 1 and 3–7 now have locked runtime WebP derivatives.

Story 2 is intentionally excluded from this derivative batch because its two Tier A continuity frames already belong to the existing published Story 2 runtime inventory.

## Library package

Approved PNG masters:

`/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/`

Prepared runtime derivatives:

`/QISSA/production/seven_roads/season2_visual_final/runtime_webp_v1/`

Upload bundle:

`season2_tier_a_runtime_upload_bundle_v1.zip`

The bundle contains the 10 WebPs plus the generated inventory snapshot.

## Locked derivative contract

- format: WebP
- quality: 88
- encoder method: 6
- no upscaling
- approved composition/aspect ratio preserved
- runtime width capped at 1536 px
- only `seven_roads_s2_story6_two_reinforcements_reveal_01_APPROVED` required downscaling, from 1672×941 to 1536×864
- all other derivatives preserve their approved-master pixel dimensions
- total locked runtime bytes: **3,386,868**

## Storage target

Bucket:

`story-images`

Reserved prefix:

`seven-roads/season2_tier_a_v1/`

Current state:

**prepared, not hosted**

No public URL has been registered in `src/data/authoredStoryAssets.ts`.

## Integrity

Repository inventory:

`docs/qissa/season2/season2_tier_a_runtime_asset_inventory.json`

Validation:

`npm run check:season2-tier-a-runtime`

The inventory locks for every asset:

- story number;
- slot id;
- filename;
- source dimensions;
- runtime dimensions;
- exact byte size;
- SHA-256;
- bucket;
- object path;
- hosting state.

## Upload tooling

Uploader/verifier:

`scripts/upload-season2-tier-a-runtime-assets.mjs`

Supported modes:

- `--verify-local` — verify extracted WebPs against locked bytes and SHA-256; no network write.
- `--expect-absent` — assert that all reserved public URLs are still absent.
- `--apply` — verify local bundle, upload/upsert to Storage using `SUPABASE_SERVICE_ROLE_KEY`, then independently verify public bytes/hash.
- `--verify-only` — verify already-hosted public objects against the locked inventory.

The apply mode requires:

`SEASON2_TIER_A_ASSET_DIR=<folder containing the ten locked WebPs>`

and

`SUPABASE_SERVICE_ROLE_KEY`

## Release rule

Do not add these ten asset ids to `src/data/authoredStoryAssets.ts` until all ten Storage objects pass public byte/hash verification.

Do not publish Stories 1 or 3–7 merely because their Tier A images are ready.

After hosting verification, the next implementation phase is authored-package integration at the exact anchors locked in:

`src/data/authored/season2TierAVisualSlots.json`

followed by localization, mobile reader, resume, and Gallery discovery gates.
