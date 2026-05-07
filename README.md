# QISSA App

QISSA is a family AI storytelling clickable prototype for children in Central Asia.

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
4. Create production build:
   ```bash
   npm run build
   ```
5. Preview production build locally:
   ```bash
   npm run preview
   ```

## Deploy preview (GitHub Pages)

This prototype can be deployed as a static Vite app through GitHub Pages without secrets.

### GitHub settings

1. Open repository **Settings** → **Pages**.
2. In **Build and deployment**, set **Source** to **GitHub Actions**.
3. Keep workflow file `.github/workflows/deploy-pages.yml` on `main`.

After deployment, the expected URL pattern is:

`https://jteshaboev1984-ops.github.io/qissa_app/`

Direct deployed prototype link:
https://jteshaboev1984-ops.github.io/qissa_app/

### Local validation before push

```bash
npm ci
npm run typecheck
npm run build
npm run preview
```

## Manual smoke test (prototype flow)

- Welcome
- Onboarding
- Create first series
- Select choice
- Continue next episode
- Refresh page and confirm story state persists
- Open Aa settings
- Switch read/listen mode
- Reset story


## Release candidate QA flow

- Open deploy link
- Test RU
- Test UZ
- Test KZ
- Create first story
- Select choice
- Continue to Episode 2
- Return home
- Refresh
- Check Aa settings
- Check listen mode
- Reset story

## Constraints preserved

This prototype intentionally keeps local/mock behavior only:
- no real AI API calls;
- no real TTS;
- no backend;
- no auth;
- no payments;
- no voice cloning;
- no AI image generation.
