# QISSA App

QISSA is a family AI storytelling clickable prototype for children in Central Asia. Current state: local-only MVP prototype (no backend or real model integrations).

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Run typecheck:
   ```bash
   npm run typecheck
   ```
4. Run i18n completeness check:
   ```bash
   npm run check:i18n
   ```
5. Run typecheck:
   ```bash
   npm run typecheck
   ```
6. Create production build:
   ```bash
   npm run build
   ```
7. Preview production build locally:
   ```bash
   npm run preview
   ```

## Deploy preview (GitHub Pages)

This prototype can be deployed as a static Vite app through GitHub Pages without secrets.

### GitHub settings

1. Open repository **Settings** → **Pages**.
2. In **Build and deployment**, set **Source** to **GitHub Actions**.
3. Keep workflow file `.github/workflows/deploy-pages.yml` on `main`.

Expected URL pattern:

`https://jteshaboev1984-ops.github.io/qissa_app/`

Direct deployed prototype link:
https://jteshaboev1984-ops.github.io/qissa_app/

### Local validation before push

```bash
npm ci
npm run check:i18n
npm run typecheck
npm run build
npm run preview
```

## Release-candidate manual QA checklist

- RU full flow.
- UZ full flow.
- KZ full flow.
- First launch → onboarding → world selection shows inline continue CTA near selected card.
- Edit setup opens with existing selections and preserves story unless setup changes.
- Reset story progress keeps child profile/onboarding selections, language, and reader settings.
- Series mode: Episode 1 choice preview A/B/A → confirm → automatic transition to Episode 2.
- Episode 2 shows clean end-state with visible Home action.
- One-time mode ends without next-episode continuation.
- Vocabulary is hidden by default and expands only on user action.
- Refresh on Home restores usable state.
- Refresh on Story restores usable state with visible way home.
- Reader settings (Aa) open and save preferences.
- Listen mode works as local placeholder (no real audio API).
- Back/Home actions are visible and predictable.

## Constraints preserved

This prototype intentionally keeps local/mock behavior only:
- no real AI API calls;
- no real TTS;
- no backend;
- no auth;
- no payments;
- no voice cloning;
- no AI image generation.


## Additional QA doc

Manual checklist: `docs/qissa/QA_CHECKLIST.md`.
Run `npm run check:i18n` before release candidates and before deploy to catch missing localization keys early.
