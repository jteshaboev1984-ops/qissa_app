# QISSA — Azure Uzbek TTS + reusable choice-aware audio (implementation checkpoint)

Status: **Draft / provider-free**, 2026-11-20. Owner requested Azure, cached audio from database and choice-dependent narration. No live Azure calls, billing activation, story publication, migration execution, or production deployment has been authorized or performed.

Canonical implementation workstream: [Issue #296](https://github.com/jteshaboev1984-ops/qissa_app/issues/296). Preserve World Bible V2 and locked source hashes/choice IDs.

## Product contract

1. Synthesized audio is an **asset of a particular approved text version**, narrator voice and language. Playing the same content repeatedly uses cached Storage audio; playback speed is applied by the client, not by re-rendering.
2. For authored stories, split a readable part into: `before_choice` (shared); `choice_resolution:<choice_id>` (only confirmed branch); and `after_choice` (shared). The current reader progress and inherited selections determine which text is eligible. **Never preemptively play both resolutions**.
3. On an unresolved choice the narrator stops, and the child chooses without a countdown. On confirmation resume at the corresponding `choice_resolution` segment, **not** at the previous `before_choice` segment. Continue with shared after-choice text. The next part uses the saved choice history. Reopening resumes the correct segment and offset.
4. Only approved and accessible story sources may be read aloud. Never read image captions, choice buttons, editorial anchors, debug markers or unsupported unpublished scenes. All audio must match the exact RU/UZ text and its approved hash, with only speech formatting (e.g. not pronouncing Markdown markup).
5. Family-generated episodes remain private per owner and use existing `audio_assets`. Authored/public story segments must use separate `authored_audio_assets` rows and **private** Storage objects, with server-side publication/entitlement checks and short-lived signed URLs. A cache hit must not bypass access checks.
6. Azure candidates: `uz-UZ-MadinaNeural` for soft female, `uz-UZ-SardorNeural` for calm male. They remain `quality_status=qa_pending` and `is_active=false` until human native-Uzbek and child-safety review. The default neutral preset stays on device fallback until explicitly approved. The existing OpenAI Russian path is preserved.

## Technical implementation in this branch

- `supabase/functions/audio-request/azure.ts`: server-only, allowlisted Azure Uzbek SSML REST adapter, XML escaping, timeout, MP3 output and error-size checks.
- Existing `audio-request`: provider-specific cache identity and generation path for **owned, saved, approved** personal episodes. Requires existing `QISSA_TTS_ENABLED=true`, valid parental consent, an active approved DB voice, and server-only `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`. OpenAI behavior remains available separately. No secrets on frontend or in Git.
- `authoredAudioPlan.ts`: generates bounded, stable audio chunks from the **same conditional visible text blocks** used by the reader; unselected resolutions and inherited branches are excluded. Additive conditional-block support has been ported into the older branch's engine and reader. This does not supersede the later approved `main` implementation; real E5/E6/E7 packages must be reconciled before release.
- Prepared migration `20261120_000001_azure_uz_authored_audio_cache.sql`: allows `azure`, leaves voice presets dormant pending human QA, adds unpublished/unapproved-by-default **RLS-closed source registry**, and deduplicates authored MP3 by text SHA-256, language, voice preset, exact provider voice ID and model. **Migration is not applied**.
- `supabase/functions/authored-audio/index.ts`: new **read-only cache lookup**; refuses disabled/unpublished/unapproved/incorrect source version/hash or unapproved voices before issuing a 15-minute private signed URL. It performs **no Azure generation**. Enabled only by `QISSA_AUTHORED_AUDIO_CATALOG_ENABLED=true` after explicit release GO.
- `AuthoredListeningControls.tsx` and `authoredAudioRemoteClient.ts`: draft actual reader controls call the released cache **only after Play** (never send raw source text), use the exact selected continuation and stop at choices. If cache/endpoint is unavailable, attempt a matching OS narration voice; if absent, preserve read mode. Local listening progress is cleared by privacy cleanup.
- `scripts/check-azure-authored-narration.mjs`: executable provider-free checks with the approved RU Story 1 fixture, plus synthetic opposite E5 inherited-route conditions, text chunk bounds and exact after-choice resume. No real UZ/season2 audio acceptance is claimed.
- Provider-free CI covers public source gates, private storage boundaries, route transitions, TypeScript (browser/backend) and build. It does **not** prove real Azure sound quality, live database operation or browser playback.

## Required remaining work before the feature is usable in authored Seven Roads

1. Confirm current authoring source locks and the active `main` versus `product/seven-roads` divergence; reconcile recent inherited/conditional route logic and published episode gates. Do not overwrite PRs from illustration workstreams.
2. After source/branch reconciliation, create a **reviewable, approved text-segment registry importer**, matching each voice chunk to immutable RU/UZ literary source hashes and release flags. Develop a strictly owner-gated Azure pre-generation/reservation flow (idempotent concurrency, spend ceilings, private MP3 upload and rollback) that fills the cache. The current public handler is **cache-read-only**, does not take story text from clients, and cannot create new audio.
3. Upgrade the draft reader controls to the final listening specification: speed/seek/resume precision, night audio-only presentation, iPhone autoplay handling, reliable OS voice detection, and verified matching of all published/staged **RU/UZ** episodes including the real E5 inherited passage and all 12 E6/E7 paths. The current UI is a provider-free, code-built integration, **not** a human-audited device playback acceptance.
4. Enforce moderation/QA and limit unpaid trial spend, text length/chunking, startup latency, streaming/download size, abusive calls, cache invalidation and failed-asset retries. Do not enable Azure billing without a separate explicit owner GO and an operator kill switch.
5. Conduct native Uzbek human audition (Madina/Sardor, proper names, SSML punctuation, prose, dialogues, bedtime intensity). Run all authored route tests, real-device Android + iPhone playback, restore, RLS/consent/delete checks, specific route/version hash checks and CI on the exact branch SHA.
6. Owner approval is needed separately for approved voice activation, production migrations/deployment, publication and any paid Azure TTS.

## Documentation

Official Microsoft REST: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech

Official language catalog: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support

The privacy and no-cloning MVP requirements remain unchanged. No child voice recording is involved.

## Verification note (2026-11-20 continuation)

PR #357 remains Draft against `product/seven-roads`; the inherited-branch logic there is older than `main`, which has the later 30-series reader and UZ overlays. No main merge, migration, provider call, Storage upload, external beta or production changes were performed. Exact-SHA CI run `44744809450` verified the new contracts, approved RU choice route test, server and app TypeScript and build, while the **full overall CI failed** at the pre-existing development dependency audit (`vite`, `source-map-js`, `postcss-selector-parser`). Production dependency audit reported zero vulnerabilities. This is not a release-ready verdict.

## Deterministic automatic source segmentation (2026-11-20)

Owner asked if the narration stages can be identified **automatically from the text**. Yes, where the authored source is a valid structured package: the engine must use **existing editorial fields**, not infer semantic boundaries with an LLM.

| Narration phase | Source in approved authored package | Playback rule |
| --- | --- | --- |
| Pre-choice | `part.story_text` | Read once; stop at the visible decision |
| Selected consequence | `part.decision.choices[confirmed_choice_id].resolution_text` | Read only the confirmed branch; never the other resolution |
| Shared continuation | `part.post_choice_text` | Read after selected resolution, or after the main text when there is no decision |
| Inherited conditional passages | `part.conditional_segments` + `external_choice_context` + saved selected choices | Insert only matching paragraphs at their locked `after_text` anchors; a visible conditional continuation is NOT globally shared |

If source fields are missing, a decision references an unknown choice, an inherited anchor is missing, or a decision depends on a future unconfirmed choice, the compiler must **fail closed**, not ask a model to guess or fabricate a new literary boundary. If an unstructured prose story has no explicit `decision` and `resolution_text`, automatic segmentation cannot be considered editorially reliable: propose a separate reviewable annotation, never modify the approved story automatically.

### Automatic manifest preview (NO PROVIDER CALLS)

- `audioManifest.ts` enumerates only combinations of inherited decisions actually used in each part, the unresolved choice pause, and the two possible confirmed resolutions; rejects unknown inherited choice IDs and uncontrolled combinatorial explosion.
- `scripts/compile-authored-audio-manifest.mjs` derives audio chunks and SHA-256 values from a **complete** authored package, labels every row `is_approved=false`, `is_published=false` and `approvalStatus=review_required`, and never inserts into Supabase. The package SHA-256 is an **integrity checksum of that JSON input**, not a substitute for independent literary source approval.
- A read-only summary (no story text written):
  `npm run review:azure-audio-manifest -- --source src/data/authored/prazdnikMuzhestvaV3.ru.json`
- An optional local review file (private, never committed blindly):
  `npm run review:azure-audio-manifest -- --source <complete-package.json> --out <review-draft.json>`
- The current product branch contains only the complete RU Story 1 package. The preview reported **15 part-level cases and 24 unique audio chunks** for that version. This is NOT an assertion that all 16 full-story route sequences or 30 series have been fully auditioned.
- Uzbek `.uz.json` files on current `main` are localization **overlays**, not complete packages. They must first be composed with the exact approved RU base using the approved `localizeAuthoredStoryPackage` logic (with conditional segment anchors checked), then the **localized full package** must be compiled. Never feed the overlay alone as a released audio source.

### Current main source cross-check (read only)

- Season 2 historical Story 6, RU source `src/data/authored/staging/season2Story6TwoReinforcements.ru.json`, has one decision with two outcomes and two mutually exclusive conditional text insertions inherited from `story5_choice_1_road_post_approach`. The context explicitly enumerates forest-edge and open-ridge choices.
- The UZ source `season2Story6TwoReinforcements.uz.json` supplies translated paragraphs and choices; it does not itself repeat the inherited structural condition list. That is expected for an overlay, but a raw overlay cannot be used as a full audio source.
- Story 7 `season2Story7BackToOrdan.ru.json` has two outcomes; the UZ overlay carries its corresponding translated text. These packages on `main` are **not yet integrated into the old PR #357 product-branch runtime**.
- The source architecture supports the requested **8 Story-6 routes plus 4 Story-7 routes** across RU/UZ once full localization, previous-choice inheritance and source-version reconciliation are complete. That statement is about **source structure**, not real audio acceptance.

**No voice or source is automatically editorially approved.** Publication, SQL application, Azure generation/billing and production remain separate explicit owner gates.

## Exact main RU/UZ E6/E7 route + 30-series split regression (continuation)

Added `scripts/check-azure-main-routes.mjs` and a read-only GitHub Actions checkout of current `main` as **external source fixture**, automatically removed after the test. The script pins Git blob hashes for the E6/E7 RU literary packages, UZ overlays, localization transformer and `src/data/sevenRoadsReadingSeries.ts`. If any source changes upstream, the test **fails closed** until the new content is explicitly reviewed: it must never silently rebind approved voice assets to edited literary text.

The test performs two checks for each actual route:
1. Resolve UZ overlay with `localizeAuthoredStoryPackage`, then build the app's `series-30-v1` presentation with `withReadingSeries`. For E6 enumerate both E5 inherited decisions × both E6 outcomes in RU and UZ (8 routes); for E7 enumerate both outcomes in RU and UZ (4 routes). The selected conditional paragraph must appear verbatim and the opposite paragraph must not; after selection the next fragment must be exactly the chosen resolution, not a replay of the intro. Every playback segment must match a draft manifest entry.
2. Reconstruct the **complete** spoken literary text from the split 30-series reading presentation and independently reconstruct it from the unsplit original localized authored package for each route. Their normalized ordered text must match exactly. This guards against dropping or duplicating words when splitting an original authored part across displayed episodes.

**Confirmed provider-free exact-SHA run `44751476552` (PR SHA `279a2df0258a49ad18206fc78f24091bb3aa47be`)**:
- 12/12 real RU/UZ routes and exact 30-series spoken text conservation **PASS**.
- 30-series-layout source segment totals: E6 RU **11**, E6 UZ **13**, E7 RU **7**, E7 UZ **8** (39 segment entries across four full localized story packages). These counts differ from the earlier unsplit 12+12+7+7 preview by design; they are not Azure MP3 files or publication authorizations.
- Earlier Azure contract/manifest checks, automated authored-v3, app shell, backend and frontend typechecks, and build **PASS**. Production dependency audit reports 0 vulnerabilities.
- **Overall CI FAILS** at the separate existing `audit:all` check for development dependencies (Vite / source-map-js high, postcss-selector-parser moderate). Security gate was not disabled.

This is automated content and route correctness only. No claims of native Uzbek human literary acceptance, actual speech intelligibility, iOS/Android playback, Azure billing or live database operation. Do not merge to the divergent main/old product branch without coordinated release reconciliation.

## All 30 reading episodes and offline Azure cost preflight

Latest provider-free expansion, verified against the actual RU and UZ source files in `main` with pinned Git blob hashes, the approved localization overlay transform, the Four Seasons chronology presentation patch and the `series-30-v1` reader splitter:

- `scripts/check-azure-main-series30.mjs` enumerates all eight literary packages × RU/UZ, **30 episode titles per language** and **136 fully selected paths** in total. Every spoken text segment is compared, in order, with the unsplit literary package and is required to exist in its deterministic source manifest. This includes inherited choices across literary stories.
- The resulting **284 manifest segment entries** contain **135 unique RU** and **141 unique UZ** text chunks once identical text in the same language is deduplicated. These are **source text chunks, not MP3 assets or provider requests**.
- One UZ voice would require roughly **214,459 JavaScript UTF-16 text units** in the current draft. Two UZ voices would require **428,918** before retries, edited text, provider billing rules, SSML and other overhead. RU similarly has **196,010** unique units per narrator, but this rollout has **no approved Azure RU voice**. These are **offline estimates, not a quote or a statement of free quota eligibility**.
- An optional offline cap exists: `npm run check:azure-main-series30 -- <read-only-main-checkout> --uz-voices 2 --max-uz-character-units 450000`. The script throws before any upload/provider activity if the planned UZ character units exceed the caller-specified cap. The **450,000 value is a CI test envelope**, NOT a production billing limit, purchase authorization or Azure spend ceiling.
- **CI on SHA `af2ebbb262ac6d442bdba1df848b9d2d75f0d75a` (run `44754463600`)**: both provider-free audio test steps (including all 30-series checks and two-voice preflight), TypeScript, authored/reader checks and build PASSED; production dependency audit 0 vulnerabilities; overall workflow FAILED on the **existing development dependency** audit (Vite, source-map-js high). Audit remains enabled.

Next code work must focus on an explicitly approved source import/release authorization and a fail-closed, operator-only, idempotent pre-generation worker with real spend controls and rollback. Until the owner separately authorizes use of Azure Speech, **do not configure or call the paid provider**. The owner requested step-by-step Azure Portal instructions at the point when Azure credentials/resource setup is actually needed. When that stage is reached, instruct them to select an eligible Speech resource/tier/region, inspect subscription and budget alerts, securely configure the server-only region and key, and **never share API keys in chat or GitHub**. All voices remain QA-pending, source manifests unpublished, SQL unapplied and authored audio catalog disabled.
