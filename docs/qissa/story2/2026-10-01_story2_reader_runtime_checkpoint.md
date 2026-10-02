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
- Uzbek localization + RU→UZ persistence run: `#800` — **success**
- hosted cover + final RU/UZ mobile reader run: `#822` — **success**

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

## Uzbek localization checkpoint — 2026-10-02

Story 2 now has a gated Uzbek localization overlay:

`src/data/authored/taynaVostochnogoKaravanaV4.uz.json`

Canonical authority remains the Russian V4 continuity-sync source. The Uzbek literary-tightening source was used only as native wording reference and was reconciled back to V4 where it diverged.

Reconciliation completed:

- restored the V4 old-Aras-passage continuity omitted by the tightened Uzbek wording;
- removed the non-V4 guard names `Kamol` and `Rahim`, keeping role-based `sardor` / `katta qo‘riqchi`;
- preserved all 10 parts, 4 decisions, 24 shared image anchors, 4 selected-branch image anchors and 5 deferred Choice-3 payoff segments;
- preserved the real-road-seal canon and Nadir continuity;
- kept the exact Story 2 identity/version so reading progress and choices survive language changes.

The stable-origin Chromium smoke now also switches the active Story 2 reader from Russian to Uzbek after real saved choices and reloads. It verified that:

- the same part remains open;
- Choice 3A and Choice 4B remain selected;
- selected Gallery art remains unlocked;
- unchosen branch art remains locked;
- Uzbek title, part label and selected branch prose render successfully.

CI result: **Seven Roads CI #800 — success**.

Detailed reconciliation notes:

`docs/qissa/story2/2026-10-02_story2_uz_localization_reconciliation.md`

## Story 2 cover checkpoint — 2026-10-02

The corrected Story 2 cover candidate has been **accepted** as:

`seven_roads_story2_cover_v1`

Approved PNG master is stored in QISSA Library at:

`/QISSA/production/seven_roads/story2_v2/approved/seven_roads_story2_cover_v1.png`

Locked runtime derivative:

- format: WebP
- dimensions: **1024 × 1536**
- aspect ratio: **2:3 portrait**
- size: **293,120 bytes**
- SHA-256: `eefdcb674febb46f4ecebc209cdbd1c13f5d9977360d5d4c95633f83eab00d8b`
- Library runtime path: `/QISSA/production/seven_roads/story2_v2/runtime_webp/seven_roads_story2_cover_v1.webp`
- intended Supabase object: `story-images/seven-roads/story2_v2/seven_roads_story2_cover_v1.webp`

The authored package marks the cover as `approved`.

Production Supabase object:

`story-images/seven-roads/story2_v2/seven_roads_story2_cover_v1.webp`

Live verification completed in **Seven Roads CI #822**:

- HTTP/public object: PASS
- MIME: `image/webp`
- dimensions exercised in reader: **1024 × 1536**
- bytes: **293,120**
- SHA-256: `eefdcb674febb46f4ecebc209cdbd1c13f5d9977360d5d4c95633f83eab00d8b`
- gated mobile reader: cover rendered successfully in fresh **RU and UZ** sessions at 430 × 932.

The cover inventory is now `approved_hosted_verified`.

## Release-candidate state

All content/runtime QA gates are now complete:

- Russian V4 package: PASS;
- Uzbek overlay: PASS;
- 16 logical choice paths: PASS;
- exact text → image ordering: PASS;
- 28 scene runtime assets: hosted + byte/hash verified;
- Story 2 cover: hosted + byte/hash verified;
- cover-enabled RU and UZ mobile reader: PASS;
- reload/resume: PASS;
- Gallery selected-only discovery: PASS;
- production bundle remains closed while Story 2 is unreleased.

The current branch intentionally keeps:

- Season 2 = `coming_soon`;
- public Season 2 `stories: []`;
- Story 2 preview/runtime flags disabled in the production Pages workflow.

Therefore there is **no remaining content-production blocker**. The next operation is a deliberate release-state change, followed by production deployment and post-release smoke.

No production release flag is flipped automatically by this checkpoint.
