# QISSA: literary continuity and series nomenclature

Date: 2026-11-13
Scope: PR #334, `qissa/four-seasons-chronological-runtime-20261112`.
Decision: preserve original approved authored text, story IDs, versions,
illustration references, reading positions, choices and historical user progress.

## User-facing terms

- Russian: **Сезон → Серия → Глава** (a chapter is an inner segment of a series).
- Uzbek: **Mavsum → Qism → Bob**.
- These are UI/navigation terms only; do not rename original authoring JSON
  `parts` or rewrite the literary text embedded in its source packages.

## Chronological literary boundary

| Season | Russian title | User-facing series | Inner narrative units |
|---|---|---|---|
| 1 | Праздник мужества | 6 | 7 original parts mapped to 6 episodes |
| 2 | Королевское серебро | 3 | 3 parts in one original package |
| 3 | Тайна восточного каравана | 2: Тайна восточного каравана → Две башни | 10 + 3 chapters in two packages |
| 4 | Королевский пленник | 4: Человек, которого ждут → Ложная дорога → Две подмоги → Обратно в Ордан | 2 + 1 + 2 + 1 chapters |

The source of **Royal Silver** opens about a week after the Festival; its
conclusion leaves Kamran arrested in Ordan, with the network planning to
free him. The **Caravan** story begins several weeks after the Festival,
establishes the Aras theft, Rashid, Barlas, Nadir and a Sarvan lead, and ends
with Temur and Samira leaving Aras for Sarvan. **Two Towers** continues
that same investigation at the old Sarvan caravan yard, resolves the local
token/three-pillars clue, and points the next action toward Ordan.

Therefore the **entire Two Towers source package belongs at the end of
Season 3**, rather than the start of Season 4. Its existing runtime opening
time overlay places arrival on the third day after leaving Aras.
**Waited Man** opens the next day after the events in Sarvan and begins the
prisoner-transfer story. False Road, Two Reinforcements and Back to Ordan
follow its convoy and rescue attempt in order. None of those four
packages has a supported case for transfer elsewhere.

## Preserved continuity contracts

- Caravan choice `story2_choice_3_sarvan_check` feeds Two Towers,
  now **Season 3, series 2**.
- False Road choice `story5_choice_1_road_post_approach` feeds Two
  Reinforcements, now **Season 4, series 3**; both alternatives are preserved.
- No authored `.json` was moved or rewritten: packages are reassigned only
  by the season registry.
- Persistence remains keyed by original `story_id` and `story_version`,
  not by a season or series number. Started historical episodes may resume.
- Images use their existing approved asset IDs/URLs; gallery discovery and
  unread-story spoiler locks remain enforced.
- The old `season2` filenames and historical product-model JSON are
  archival source labels, not the current four-season placement.

## Verification

The regression suite checks RU/UZ chronology, the first playable series,
progress migration, unlocks, inter-story choice inheritance, locked artwork,
gallery discovery, mobile viewport widths, and the user-facing series/chapter
counts. CI also enforces unchanged source-package identities and release wiring.

Literary conclusion is limited to chronology, character journeys and
inter-package causality at this boundary. It is **not** an editorial sign-off
on every paragraph or every branch wording. No user-facing source prose was
altered during this restructuring.
