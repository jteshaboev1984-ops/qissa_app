# QISSA Story 2 reader/runtime checkpoint — updated 2026-10-02

## Scope

This checkpoint covers the current integration state for:

- world: `seven_roads`
- story: `Тайна восточного каравана`
- story id: `seven_roads_tayna_vostochnogo_karavana`
- authored version: `interactive-v4-continuity-sync`
- source of truth: `/QISSA/production/seven_roads/story2_v2/seven_roads_story2_interactive_v4_continuity_sync.md`

Story 2 remains **unpublished**. This work prepares the reader/runtime path without changing the release state.

## Reader ordering contract

The authored package contains 10 internal parts and 4 two-way decisions, producing 16 possible choice paths.

The reader contract is locked as follows:

- 24 shared scene images render only after their exact approved narrative paragraph.
- Choice 1 and Choice 2 have no branch illustration.
- Choice 3 and Choice 4 never preview both branch illustrations.
- After a Choice 3/4 selection, only the selected branch illustration is inserted.
- Selected branch art is inserted at its exact approved paragraph inside the selected resolution, not before the resolution and not generically after it.
- Deferred Choice 3 payoff prose renders later from saved choice memory.
- Unchosen branch prose and unchosen branch art never leak into the active path.
- A complete playthrough exposes exactly 26 scene images: 24 shared + 1 Choice 3 + 1 Choice 4.
- Gallery discovery for selected-only branch art occurs only after the reader actually reaches the image.

`scripts/check-authored-story2-v4.mjs` verifies all 16 paths and exact text/image sequence.

## Runtime image inventory

Canonical repository inventory:

`docs/qissa/story2/story2_runtime_asset_inventory.json`

Current locked inventory:

- version: `story2-runtime-webp-3`
- scene assets: 28
- required dimensions: 1536 × 1024 for every runtime scene image
- total bytes: 9,071,006
- target bucket: `story-images`
- target prefix: `seven-roads/story2_v2/`

During runtime QA, four downsampled assets were corrected from their approved full-resolution PNG sources:

- `seven_roads_story2_p3_img_01_v2`
- `seven_roads_story2_p3_img_02_v1`
- `seven_roads_story2_p3_img_03_v1`
- `seven_roads_story2_p4_img_02_v1`

The Library runtime WebP copies for those four assets were overwritten with full-resolution 1536 × 1024 versions.

The older standalone Library JSON inventory may still contain stale metadata. The repository inventory above is the current release-control inventory.

A verified operator bundle containing the exact 28 WebPs plus a fresh v3 inventory is also staged in QISSA Library at:

`/QISSA/production/seven_roads/story2_v2/runtime_webp/story2_runtime_upload_bundle_v3.zip`

The 28 files in that bundle were materialized again and independently checked on 2026-10-01: every file is 1536 × 1024, every byte length/SHA-256 matches the repository v3 inventory, and the aggregate payload is exactly 9,071,006 bytes.

## Runtime URL gating

`src/data/authoredStoryAssets.ts` contains the 28 Story 2 asset ids, but runtime URL resolution remains disabled unless:

`VITE_QISSA_STORY2_RUNTIME_ASSETS_READY=true`

This prevents broken public URLs from appearing before Storage upload is complete.

## Preview gating

Story 2 preview is isolated from the published authored-story bundle and lazy-loaded only when requested.

It requires both:

- generic authored preview capability; and
- `VITE_QISSA_STORY2_PREVIEW=true`.

The production GitHub Pages build explicitly keeps:

- `VITE_QISSA_STORY2_PREVIEW=false`
- `VITE_QISSA_STORY2_RUNTIME_ASSETS_READY=false`

The Story 2 preview also suppresses the pending/unapproved cover so the first visual shown is approved narrative content.

## Production-bundle closure

`scripts/check-story2-production-bundle-closed.mjs` runs after the production build.

It fails if the default production `dist/` contains:

- Story 2 title/prose markers;
- Story 2 story id;
- Story 2 runtime asset ids;
- Story 2 runtime Storage path prefix.

Therefore a false release flag is not accepted merely as a hidden UI route: unpublished Story 2 content must be absent from the production bundle itself.

## Live Storage smoke

Manual workflow:

`.github/workflows/story2-assets-smoke.yml`

Upload operator:

`scripts/upload-story2-runtime-assets.mjs`

The upload operator is dry-run by default. It verifies all local bytes/hashes before any write. `--apply` additionally requires a server-side `SUPABASE_SERVICE_ROLE_KEY`, uploads/upserts the locked WebPs, and verifies every public object after upload. CI only syntax-checks this script; CI never performs the upload.

Script:

`scripts/smoke-story2-assets-live.mjs`

Modes:

- `absent`: all 28 public Story 2 objects must be absent.
- `present`: all 28 public objects must return successfully and match the locked MIME type, byte length, and SHA-256 digest.

Current production Supabase state checked on 2026-10-02:

- bucket: `story-images`
- prefix: `seven-roads/story2_v2/`
- Story 2 object count: **28 / 28**
- MIME: **28 / 28 image/webp**
- aggregate payload: **9,071,006 bytes**
- live public-object smoke: **PASS**

GitHub Actions run **#752** downloaded every public object and verified the locked byte length and SHA-256 digest for all 28 files. Result:

`[story2-assets-live] PASS expected present · 28/28 objects · 9071006 bytes verified`

Runtime assets are therefore **hosted and verified**. Publication remains closed for the separate preview/render/localization/product-shell gates below.

## CI checkpoint

Latest verified PR CI at this checkpoint:

- workflow: `Seven Roads CI`
- asset-verification run: `#752` — **success**
- gated-preview build run: `#756` — **success**
- multi-story shell integration run: `#780` — **success**
- stable-origin resume/Gallery run: `#791` — **success**

Passed gates include:

- Story 1 authored validation;
- Story 2 V4 authored validation;
- Story 2 runtime inventory validation;
- backend access boundary;
- authored progress backend contract;
- Seven Roads product shell;
- TypeScript;
- production build;
- unpublished Story 2 bundle-closure verification;
- Story 2 Storage uploader syntax guard.

## Rendered preview checkpoint — 2026-10-02

The gated preview build has now been rendered at a 430 × 932 mobile viewport using the exact CI-built reader bundle and locked Story 2 assets.

Rendered path coverage:

- Choice 3A + Choice 4A — PASS
- Choice 3A + Choice 4B — PASS
- Choice 3B + Choice 4A — PASS
- Choice 3B + Choice 4B — PASS

Each path rendered exactly 26 scene images, with no duplicate or unchosen branch image. Choice 3/4 illustrations appeared only after their exact approved V4 anchor paragraphs. Deferred Choice 3 payoff prose remained branch-correct.

Detailed evidence is recorded in:

`docs/qissa/story2/2026-10-01_story2_runtime_visual_sequence_audit.md`

## Season / story product-shell model — resolved 2026-10-02

The public model no longer assumes `1 season = 1 authored story`.

The hierarchy is now explicit:

`season → ordered stories → reader episodes/parts`

Key release semantics:

- `PublishedSeason` owns an ordered `stories[]` collection.
- Every published story has its own authored package, status, progress namespace, reader unit, and completion scope.
- Season 1 remains visually unchanged: its single story completes the season and keeps the existing 6-series UX.
- Multi-story seasons get a story-selection screen before entering the reader.
- Gallery grouping is story-aware, so repeated episode numbers from different stories cannot collide.
- Story-level completion can say “Сказка N завершена” and does not falsely show “Сезон N завершён”.
- Story 2 preview is explicitly `seasonNumber=2`, `storyNumber=2`, `completionScope=story`, `readerUnit=part`.
- Per-story reading position and choices remain separated by the existing authored-story persistence keys (`story_id + story_version`).
- Resetting a multi-story season clears each published story package in that season rather than only the currently open story.
- The public Season 2 collection is still empty while Season 2 remains `coming_soon`; unpublished Story 2 metadata therefore does not leak into the normal production bundle.

This contract is enforced by `scripts/check-seven-roads-product-shell.mjs` and `scripts/check-authored-story2-v4.mjs`.

## Stable-origin reload/resume + Gallery checkpoint — 2026-10-02

A real Chromium smoke now runs against the gated Story 2 build on a stable local HTTP origin:

`http://127.0.0.1:4173/qissa_app/`

Viewport: **430 × 932**.

The smoke performs actual reader interactions and real page reloads. It verified:

- Choice 3A progress survives reload;
- a non-zero Story 2 reading position survives reload and is restored;
- Choice 4B progress survives a second reload;
- selected-only Gallery discovery persists for `seven_roads_story2_p6a_img_03_v1` and `seven_roads_story2_p8b_img_01_v1`;
- unchosen branch art `seven_roads_story2_p6b_img_03_v1` and `seven_roads_story2_p8a_img_01_v1` remains locked;
- no browser runtime exception occurred during the smoke.

The test also exposed and fixed one real UX bug: part-based Story 2 was briefly using the episode-boundary CTA (“Следующая серия”) between internal parts. The reader now applies episode-boundary UI only when `readerUnit === 'episode'`; Story 2 correctly uses ordinary continuation between its ten internal parts.

Automated command:

`npm run smoke:story2-resume-gallery`

CI result: **Seven Roads CI #791 — success**.

## Remaining publication blockers

Do not publish Story 2 until all of the following are complete:

1. Add and accept the Uzbek localization overlay before enabling Story 2 in Uzbek.
2. Approve/host a Story 2 cover if the final product shell requires one.
3. Only after all release gates pass, change Story 2 publication state from `coming_soon`.

No production release flag should be flipped as part of the current PR.
