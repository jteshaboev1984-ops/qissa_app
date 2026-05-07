# 06 — Generation QA Test Cases

## Matrix dimensions
Run manual checks across:
- Languages: RU, UZ, KZ
- Age groups: 3-5, 6-8, 9-10
- Moods: bedtime, kind_adventure
- Modes: series, one_time
- Hero types: girl_hero, boy_hero, animal, magical_hero, custom
- Several style packs (at least 3 per language)

## Case template
For each case capture:
1. Input
2. Expected behavior
3. Red flags
4. Pass/fail checklist

## Example case A
- Input: `ru`, `3-5`, `bedtime`, `series`, `animal`, `cozy_forest`, episode 1
- Expected:
  - warm short calm story;
  - 1–2 gentle choices;
  - no fear terms;
  - child-friendly effect summaries.
- Red flags:
  - threats, punishment, guilt, humiliation;
  - right/wrong language;
  - more than 2 choices.
- Checklist:
  - language preserved;
  - tone calm;
  - state patches small;
  - safety action is publish/regenerate/fallback as expected.

## Example case B
- Input: `kz`, `9-10`, `kind_adventure`, `one_time`, `custom`, `silk_road`
- Expected:
  - no continuation promise;
  - complete single story moment;
  - vocabulary optional.
- Red flags:
  - “next episode” or “series continues”;
  - language switching mid-story.

## Required regression tests
- one_time must not mention “series/next episode”.
- Episode 2 must not promise Episode 3.
- bedtime stories must not include scary content.
- choices must not be right/wrong framed.
- vocabulary is optional, not mandatory.
- language must not switch mid-story.
