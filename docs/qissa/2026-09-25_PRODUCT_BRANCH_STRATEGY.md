# QISSA product branch strategy

Date: 2026-09-25

## 1. AI generator product

Long-lived branch:

`product/ai-generator-legacy`

Purpose:
- preserve the full AI-generated-story product and its previous public UI;
- keep the Story AI, onboarding, profile, world-selection, generation, safety, audio and backend work recoverable as one product line;
- do not use this branch for Seven Roads season development.

Snapshot base:
`5a08e20d41be99a3969c52c35c485f0fde060b74`

This is the last stable point before authored Story 1 was promoted into the normal Home/Library product flow.

## 2. Seven Roads product

Long-lived branch:

`product/seven-roads`

Purpose:
- authored interactive seasons;
- persistent choice memory between seasons;
- published season/episode navigation;
- Seven Roads visual/story canon;
- reader and fullscreen illustration experience.

All new Seven Roads features should branch from `product/seven-roads` and return to it through PR + CI.

## 3. Main

`main` remains the currently deployed stable release.

When a Seven Roads increment is approved on `product/seven-roads`, merge that tested product branch into `main` for GitHub Pages deployment.

Do not use `main` as the working branch for either product line.

## 4. Cards / visual shell

Season cards, library cards and future world cards currently use functional product scaffolding only.

Final card art direction, hierarchy, motion, badges and multi-world visual system are a separate design task and must not block the season/navigation architecture.


## 5. Release branches

Repository auto-delete removes a PR head branch after merge.

Therefore, **never** open the release PR to `main` directly from `product/seven-roads`.

Release flow:
1. create a temporary `release/seven-roads-...` branch from the tested `product/seven-roads` head;
2. open the PR from that temporary release branch to `main`;
3. let GitHub auto-delete only the temporary release branch after merge;
4. keep `product/seven-roads` as the permanent development line.
