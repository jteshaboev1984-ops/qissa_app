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


## Prototype QA checklist

- Test RU flow
- Test UZ flow
- Test KZ flow
- Create first story
- Select choice
- Continue next episode
- Refresh page
- Reader settings
- Listen mode
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
