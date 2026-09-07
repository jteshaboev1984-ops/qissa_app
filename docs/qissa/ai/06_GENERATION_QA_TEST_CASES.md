# 06 — Generation QA Test Cases

Status: QA reference aligned with current contracts and the September 2026 closed-beta release slice.

## Closed-beta release matrix
The release-hardening matrix is intentionally narrower than the full internal Story Agent contract:

- Languages: RU, UZ (UZ marked Beta)
- Age group: 5–7
- Mood: bedtime
- Mode: series
- Worlds: `cozy_forest`, `magic_garden`, `stars_and_space`
- Choice branches: A and B

This produces **12 mandatory production scenarios**: 2 languages × 3 worlds × 2 confirmed choices.

Each production scenario must verify:
1. Episode 1 is returned successfully.
2. Episode 1 contains exactly two safe choices.
3. Episode 1 and its state persist remotely.
4. One selected choice is confirmed and persisted.
5. The continuation visibly reflects the selected branch.
6. Episode 2 is a full calm continuation, not a short technical bridge.
7. Episode 2 contains zero choices.
8. Closing/reloading restores the current persisted Episode 2 state.
9. Full profile deletion succeeds.
10. Loading after deletion returns no profile snapshot.

Provider-free launch-hardening runs must also verify `safe-fallback` while Story AI is disabled, so CI/release regression does not create provider spend.

## Full internal contract matrix
For later expansion, manual and automated QA should cover the broader contract:
- Languages: RU, UZ, KZ
- Age groups: 3–4, 5–7, 8–9
- Moods: bedtime, kind_adventure
- Modes: series, one_time
- Hero types: girl_hero, boy_hero, animal, magical_hero, custom
- All style packs before each becomes publicly exposed

Values `3-5`, `6-8`, `9-10` are legacy client inputs only and must not be used as current generation contract values.

## Case template
For each case capture:
1. Input
2. Expected behavior
3. Red flags
4. Persistence/memory expectations
5. Pass/fail checklist

## Example case A — current closed beta
- Input: `ru`, `5-7`, `bedtime`, `series`, `animal`, `cozy_forest`, Episode 1
- Expected:
  - warm, calm, full bedtime scene;
  - exactly two gentle but genuinely different choices;
  - no fear escalation;
  - child-friendly effect summary, resolution and tomorrow seed;
  - selected branch persists before Episode 2 generation.
- Red flags:
  - threats, punishment, guilt, humiliation;
  - right/wrong language;
  - more or fewer than two Episode 1 choices;
  - technical phrases such as state/patch/episode exposed to the child;
  - Episode 2 that ignores the confirmed choice.
- Checklist:
  - language preserved;
  - bedtime tone calm;
  - story length is a full scene;
  - state patch is small;
  - safety action is expected;
  - persisted reload keeps the same branch.

## Example case B — future contract regression
- Input: `kz`, `8-9`, `kind_adventure`, `one_time`, `custom`, `silk_road`
- Expected:
  - no continuation promise;
  - complete single story moment;
  - no language switching;
  - vocabulary empty under the current backend contract.
- Red flags:
  - “next episode” or “series continues” language;
  - unresolved danger;
  - language switching mid-story.

This case protects the internal contract but is **not** a reason to expose KZ, 8–9, one-time mode or Silk Road in the current closed beta.

## Required regression tests
- Series Episode 1 must contain exactly two choices.
- Confirmed A and B branches must produce different remembered consequences.
- Episode 2 must visibly use the confirmed Episode 1 branch.
- Episode 2 must contain zero choices and no Episode 3 promise.
- one_time must not mention “series/next episode”.
- bedtime stories must resolve without scary or overstimulating content.
- choices must not be right/wrong framed.
- RU vocabulary must remain within the current 2–3 item contract; UZ/KZ vocabulary must remain empty until that product decision changes.
- language must not switch mid-story.
- remote generation must wait for pending reset and confirmed-choice state writes.
- irreversible profile deletion must complete remotely before local identity/data are cleared.
