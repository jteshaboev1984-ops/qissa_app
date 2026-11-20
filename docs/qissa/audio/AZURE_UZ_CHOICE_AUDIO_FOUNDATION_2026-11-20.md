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
- `authoredAudioPlan.ts`: pure branch-aware text segmentation from the authored reading engine. The result is a **planner contract only**, not yet a streaming player. The older persistent `product/seven-roads` reader lacks the later inherited conditional segment logic on `main`; this must be ported/reconciled against today's approved source and all 12 E6/E7 paths rather than merged blindly.
- Prepared migration `20261120_000001_azure_uz_authored_audio_cache.sql`: allows `azure` as provider, safely prepares dormant Uzbek presets without activation, introduces RLS-closed authored cache table keyed by source version, language, segment, voice and text SHA-256. **Migration is not applied**.
- Provider-free contract check in CI. This is not live API/voice or playback acceptance.

## Required remaining work before the feature is usable in authored Seven Roads

1. Confirm current authoring source locks and the active `main` versus `product/seven-roads` divergence; reconcile recent inherited/conditional route logic and published episode gates. Do not overwrite PRs from illustration workstreams.
2. Add an authenticated/published-source-checked server handler that loads **approved source text itself**, computes segment SHA-256, looks up `authored_audio_assets`, generates on demand once, stores to the private bucket, returns a signed URL only to eligible users, and has reliable idempotent handling of concurrent requests, retries, cleanup and spend caps.
3. Integrate the authored reading UI player with audio segment queues: start/pause, choice pause, branch continuation, progress restoration, night mode, text+audio and safe read-mode fallback. Include correct Episode 5 inherited passage and E6/E7 conditional variants on both languages.
4. Enforce moderation/QA and limit unpaid trial spend, text length/chunking, startup latency, streaming/download size, abusive calls, cache invalidation and failed-asset retries. Do not enable Azure billing without a separate explicit owner GO and an operator kill switch.
5. Conduct native Uzbek human audition (Madina/Sardor, proper names, SSML punctuation, prose, dialogues, bedtime intensity). Run all authored route tests, real-device Android + iPhone playback, restore, RLS/consent/delete checks, specific route/version hash checks and CI on the exact branch SHA.
6. Owner approval is needed separately for approved voice activation, production migrations/deployment, publication and any paid Azure TTS.

## Documentation

Official Microsoft REST: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech

Official language catalog: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support

The privacy and no-cloning MVP requirements remain unchanged. No child voice recording is involved.
