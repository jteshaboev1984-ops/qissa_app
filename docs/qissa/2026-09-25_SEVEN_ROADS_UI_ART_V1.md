# Seven Roads UI Art V1

Date: 2026-09-25
Status: approved visual asset contract

## Spatial progression

The app shell moves progressively deeper into the world:

1. Welcome — distant view of the kingdom.
2. Home — approaching the capital along the road.
3. Library — already inside the Hall of Stories.
4. Season page — the published season's own approved cover/key art.
5. Reader — clean reading surface with the story's own illustrations.
6. Season completion — reuse the published season cover with a completion overlay.

Parent consent reuses the Welcome image behind a blurred/dimmed bottom sheet.

## Approved UI environment assets

Library source:
`/QISSA/production/seven_roads/ui_v1/approved/`

Runtime target:
`story-images/seven-roads/ui_v1/`

- `seven_roads_welcome_world_v1.png/.webp`
  - Welcome
  - Parent consent background

- `seven_roads_home_approach_v1.png/.webp`
  - Home / Дом историй

- `seven_roads_library_hall_v1.png/.webp`
  - Library / Библиотека

- `seven_roads_future_season_placeholder_v1.png/.webp`
  - visual for the first season whose status is `coming_soon`

## Future-season placeholder rule

The placeholder is **not tied to Season 2**.

Runtime must find the first season with:
`status === 'coming_soon'`

Today:
- Season 1 = published
- Season 2 = coming soon
- placeholder displays Season 2

When Season 2 becomes published and Season 3 is added as coming soon:
- Season 2 uses its own approved key art
- the same generic placeholder automatically displays Season 3

Repeat the same rule for future seasons.

## Season 1

Season 1 does not get another UI background.

Use the already approved Story 1 cover:
`seven_roads_story1_cover_v1`

It is used for:
- Season 1 overview hero
- Season 1 completion background
- Season 1 content thumbnail/card

## Reader

Do not use environment backgrounds behind long-form story text.

The reader uses a calm reading surface because story illustrations already carry the visual narrative. Existing story illustrations remain tappable fullscreen.

## QISSA logo

V1 uses a restrained text wordmark only.
Final emblem/wordmark design remains a separate visual-design task and must not block the screen composition review.
