# QISSA Bedtime Narrative and Duration Contract — September 2026

Status: launch-hardening product contract for the age 5–7 bedtime series.

## Product intent

QISSA should feel like one complete bedtime story with a meaningful child decision inside it. Backend Episode 1 and Episode 2 are delivery segments, not separate literary stories.

The required causal arc is:

`orientation → one gentle goal/problem → development → meaningful child choice → visible consequence → resolution of the original goal → calm bedtime coda`

A story must not resolve one plot, ask a decorative choice, and then start a different plot. It must not reset to the next morning before the selected choice has produced its consequence and the original goal is resolved.

## Duration

For age 5–7 bedtime series, the primary editorial target is **6–8 minutes** at the release acceptance pace of **140 words per minute**.

- preferred complete-session band: approximately **840–1,080 words**;
- hard release envelope: **700–1,400 words**, equivalent to 5–10 minutes at 140 WPM;
- the hard envelope remains intentionally wider than the editorial target so safety fallback and language variation are not padded artificially.

The measured complete session is:

`Episode 1 story + confirmed choice resolution + Episode 2 story`.

## Narrative pacing

The child choice should normally arrive around **50–60%** of the complete spoken story. The hard deterministic acceptance window for current closed-beta reference stories remains wider to allow RU/UZ language variation.

Recommended editorial allocation:

1. orientation / bedtime atmosphere — about 10–13%;
2. one clear need or problem — about 11–14%;
3. exploration and build-up — about 19–24%;
4. choice setup — about 12–15%;
5. selected action and immediate reaction — short bridge;
6. consequence and working solution — about 25–32%;
7. resolution and calm coda — final 10–15%, with the core problem already solved before the last paragraph.

The last paragraph is denouement. It must reduce sensory and emotional energy, close loose ends, and avoid a new mission, cliffhanger, countdown, threat, or requirement to continue tonight.

## Story AI generation target

Current Story AI guidance for the age 5–7 bedtime series targets:

- Episode 1: **450–520 words**;
- selected choice resolution: **20–60 words**;
- Episode 2: **370–480 words**.

Runtime validation permits a modestly wider range so natural language generation is not rejected for harmless variation:

- Episode 1: **430–560 words**;
- Episode 2: **340–520 words**.

Length must never be achieved by repetition, an unrelated second problem, a next-morning reset, or filler exposition.

## Safe fallback

Deterministic safe-fallback stories are allowed to sit near the lower part of the 5–10 minute hard envelope. Reliability and a coherent closed arc take priority over padding fallback text merely to match the 6–8 minute primary editorial target.

The current RU/UZ reference fallback matrix remains release-gated for total duration, meaningful choice position, distinct choice consequences, continuity, and calm ending.

## Production status

As of 2026-09-07:

- repository contract merged in PR #74;
- production `story-generate` Edge Function deployed as **v18**, `verify_jwt=true`;
- v18 imports immutable Git commit `679e9707774cfde1bac11286da44ec80fa34689d`;
- Story AI and provider TTS were **not enabled** by this change;
- source CI, Story Core Proof and privacy smoke passed before merge;
- a fresh manual live Story AI smoke remains a separate acceptance gate before claiming real provider generation is production-proven.

This contract does not expand closed-beta worlds, public languages, age groups, family voice, AI images, payments, or other launch scope.