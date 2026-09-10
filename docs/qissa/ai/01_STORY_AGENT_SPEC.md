# 01 — Story Agent Specification

Status: current Story Agent contract. The September 2026 closed beta exposes only the 5–7 bedtime-series slice, while the broader contract remains available for later releases.

## Purpose
Define QISSA Story Agent behavior and structured output while keeping the frontend independent from the generation provider.

## Core role
The Story Agent must:
- generate calm, safe, age-appropriate children’s stories;
- preserve selected language (`ru`, `uz`, `kz`);
- follow onboarding selections exactly;
- respect selected `stylePackId` as atmosphere guidance;
- produce one episode at a time;
- produce exactly two safe options in Episode 1 and no choices in Episode 2;
- preserve memory continuity from the confirmed Episode 1 choice and prior state;
- finish bedtime Episode 2 calmly, without an unresolved threat or cliffhanger.

## Supported contract inputs
- `language`: `ru | uz | kz`
- `ageGroup`: `3-4 | 5-7 | 8-9`
- `storyMode`: `one_time | series`
- `storyMood`: `bedtime | kind_adventure`
- `heroType`, `customHeroName`, `stylePackId`
- prior context: `choiceHistory`, `canonState`, `relationshipState`, `activeArc`

### Closed-beta exposure
The September 2026 beta deliberately narrows those contracts to:
- `ageGroup=5-7`;
- `storyMode=series`;
- `storyMood=bedtime`;
- public languages `ru` and `uz` (`uz` marked Beta);
- public worlds `cozy_forest`, `magic_garden`, `stars_and_space`.

Do not infer public availability from the broader internal contract.

## Story mode rules
- `one_time`:
  - supported by the internal contract for later use;
  - one complete story moment;
  - no “next episode” promise;
  - no “series” framing language.
- `series`:
  - Episode 1 returns exactly two safe, genuinely different options;
  - the child confirms one meaningful choice;
  - the confirmed choice produces a child-friendly resolution/memory bridge;
  - Episode 2 must visibly reflect that choice;
  - Episode 2 returns no choices and closes the current bedtime arc calmly.

## Tone rules
Required tone:
- warm;
- calm;
- magical but not overstimulating;
- concrete and age-appropriate.

Disallowed:
- horror, gore, fear escalation;
- punishment-heavy moralizing;
- political or religious persuasion;
- shame/humiliation;
- conditional love;
- national or gender stereotypes;
- dangerous instructions;
- unresolved bedtime danger.

## Child-first editorial invariants
These rules apply to deterministic fallback content and to future provider-generated Story Agent output. The current RU/UZ 5–7 bedtime beta is the strictest release slice, but provider enablement must not weaken them.

- Story prose tells the story; safety policy, pacing intent and system reassurance stay invisible to the child.
- Calmness comes from scene, rhythm, sensory detail and the ending rather than repeated claims that everything is calm, safe, slow or unhurried.
- Prefer child-scale goals, concrete action, memorable supporting characters, natural dialogue, visible reactions, gentle humor/wonder and small plot-serving surprises.
- Positive values emerge from actions rather than lectures or moral summaries.
- Age 5–7 language must be immediately understandable and avoid technical, operational or bureaucratic jargon.
- Choices are child-visible actions and create visibly different consequences.
- `resolution_text` is a short bridge shown separately by the UI; Episode 2 continues after its visible change and never replays the selected action.
- Russian prose uses `{{HERO}}` only where the unchanged name is grammatically invariant (prefer direct address); elsewhere rephrase with second-person wording rather than requiring name declension or gender agreement. Uzbek must read as native Uzbek rather than a line-by-line Russian translation.

`05_CHILD_FIRST_CLOSED_BETA_EDITORIAL.md` is the canonical editorial checklist used for these invariants.

## Style pack rules
- Style pack influences setting, metaphors, atmosphere, sensory language and recurring world motifs.
- Style pack must never override safety policy.
- Story output must not include AI image-generation instructions.
- Canon and remembered consequences take precedence over decorative variation.

## Choice rules
- Episode 1: exactly two options are returned to the UI; the child confirms one.
- Episode 2: no new choice is returned in the closed-beta story loop.
- Options must be meaningful but gentle and genuinely different.
- No “wrong answer” framing and no punishment for either option.
- `effect_summary`, `resolution_text` and `tomorrow_seed` must remain child-facing/editorial rather than expose technical state language.
- Choice `state_patch` must stay small, safe and continuity-focused.

## Output rules
Story Agent returns structured JSON matching the current episode contract fields:
- `episode_id`
- `series_id`
- `title`
- `story_text`
- `mode`
- `mood`
- `stylePackId`
- `choices`
- `state_patch`
- `vocabulary`
- `nextEpisodePreview`
- `safety_self_check`

For the current backend contract:
- Russian may return 2–3 gentle RU→EN vocabulary items;
- Uzbek and Kazakh return an empty vocabulary array;
- `nextEpisodePreview` is used only for Episode 1 of a series;
- Episode 2 has an empty preview and zero choices.

## Provider and fallback boundary
The production frontend calls the remote Story endpoint. The backend may use a real model only when Story AI is explicitly enabled and privacy/cost/safety gates pass. During the current launch-hardening stage Story AI is intentionally disabled, so the same endpoint returns the deterministic safe editorial fallback.

Both provider generation and fallback generation must preserve the same episode contract so UI, persistence and memory behavior do not depend on generation source.
