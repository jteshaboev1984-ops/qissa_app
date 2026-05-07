# QISSA MVP Prototype QA Checklist

## Core flows
- First launch: welcome → onboarding → home.
- Edit setup: open from Home, keep story if setup unchanged.
- Reset story: progress is reset, but language, onboarding selections, and reader settings stay.
- Series mode: episode 1 choice preview → confirm → episode 2 opens.
- One-time mode: no series continuation prompt.

## Story and reader checks
- Vocabulary list is hidden by default and opens only on click.
- Reader settings (Aa) open, change text style, persist after reload.
- Listen mode works as placeholder UI (no real TTS).
- Refresh on Home restores usable state.
- Refresh on Story restores episode or safely falls back to Home if episode is missing.

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
