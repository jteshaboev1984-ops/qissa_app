# QISSA MVP Prototype QA Checklist

## Core flows
- First launch: welcome → onboarding → home.
- Edit setup: open from Home, keep story if setup unchanged.
- Reset story: progress is reset, but language, onboarding selections, and reader settings stay.
- Series mode: episode 1 choice preview → confirm → explicit "Open next episode" CTA.
- One-time mode: no series continuation prompt.
- One-time story: after choice confirm, a distinct final card appears with Home / Start new / Reopen actions.
- Series episode 2: no choice cards and no confirm button are shown.
- Series episode 2: final card is visually separate from narrative text.
- Completed Home state: one-time and series use distinct completion tone.
- Launch confirmation Home (not_started): clear “ready” state, compact summary, expandable details, and no reset-progress block.
- Home page title must match story state and should not show launch-ready wording after story starts.
- Completed one-time Home: “История завершена” tone with open-again/new-story/edit-choice actions.
- Completed series Home: “Серия завершена” tone with open-last/new-story/edit-choice actions.
- Completed series Home must not show “continue” wording when no next episode exists.
- RU/UZ/KZ: final-state buttons and labels are visible in each locale.

## Story and reader checks
- Vocabulary list is hidden by default and opens only on click.
- Reader settings (Aa) open, change text style, persist after reload.
- Listen mode works as placeholder UI (no real TTS).
- Refresh on Home restores usable state.
- Refresh on Story restores episode or safely falls back to Home if episode is missing.
- Read-again opens full current episode from the top in one vertical scroll (no fragment feel).
- Read-again from final card always switches to read mode, closes extra panels, and scrolls to narrative top.
- Long stories remain readable with natural page scroll; final/actions remain below narrative flow.
- Episode 1 memory transition card title/body are not duplicated; CTA stays “Open next episode”.
- Vocabulary expanded state keeps the section title and uses separate hide action.
- Story text card remains visually separate from choice, memory, and system/action cards.
- Choice consequence card appears before next-episode continuation action card.
- Listening mode is clearly a prototype-style placeholder and does not promise real audio playback.
- Vocabulary section stays optional, collapsed by default, and visually secondary.
- Reader settings remain easy to access from Read mode and selections stay saved.

## Localization checks
- Switch RU/UZ/KZ from header and confirm key UI labels update.
- Run `npm run check:i18n` before RC and before deploy.

## Persistence repair notes
- Corrupted JSON in localStorage is ignored by safe parsing.
- If onboarding exists and seriesState is missing, state is repaired locally.
- Story screen without stored episode must return to Home.

## Deploy verification (GitHub Pages)
- Run local validation: `npm ci && npm run check:i18n && npm run typecheck && npm run build`.
- Confirm deployed URL loads and full flow works:
  https://jteshaboev1984-ops.github.io/qissa_app/

## Known prototype limitations
- Local mock story generation only.
- No real AI API.
- No real TTS.
- No backend/auth/payments.
- No multi-device sync.
- No parent account.
- localStorage data may be cleared by browser/user.

- After Series Episode 1 confirm, user sees explicit “Open next episode” CTA; no hidden auto-transition.
- No user-facing “demo” wording appears in RU/UZ/KZ UI.


## RC polish verification
- Home states are clear for not_started / in_progress / completed one_time / completed series.
- No user-facing demo wording appears in active UI.
- Active CTA/navigation copy uses consistent story terminology across RU/UZ/KZ.
- Story narrative card is visually separate from system and action cards.
- Consequence card appears before next-series CTA.
- Series Episode 2 has no choices and no next-episode CTA.
- Listening screen is an honest placeholder and does not promise real audio.
- Reader settings stay accessible and remain saved after reload.
- Vocabulary section stays optional and visually secondary.
- Reset progress keeps setup, language, and reader preferences.


- Bottom nav is visible on Home, Library, Parent only.
- Story screen remains immersive and has no bottom nav.
- Library shows empty and current story states correctly.
- Parent screen includes setup, reading comfort, narrator voice, and reset progress section.
- Style-pack covers are local CSS motifs only (no remote AI scene URLs).
- Parent can comfortably read aloud in Read mode.
- Listening remains an honest placeholder.
- Reset keeps language, setup, and reader preferences.

- Parent reader settings section has no non-working close button.
- Bottom nav does not cover Home/Library/Parent final actions.
- Narrative card does not include world/system helper text.
- StylePack cover title/subtitle remain readable on light and dark palettes.
