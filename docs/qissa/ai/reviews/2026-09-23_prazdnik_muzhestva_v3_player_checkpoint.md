# «Праздник мужества» — Interactive V3 player checkpoint

> Date: 2026-09-23  
> Status: authored multi-choice player core implemented behind a disabled-by-default preview flag.  
> Story V1/V2 prose: unchanged by this engineering work.

## Implemented

### Runtime authored-story contracts
- 7 ordered parts;
- optional decision per part;
- exactly two choices for Story 1 decisions;
- required `resolution_text`;
- shared illustration slots;
- choice illustration slots;
- explicit merge state;
- branch state patches;
- stable asset IDs.

Files:
- `src/features/authoredStory/types.ts`
- `src/features/authoredStory/engine.ts`

### Progress / memory engine
Supports:
- initial progress;
- current part resolution;
- locked confirmed choice;
- branch-specific state patch;
- common merge-state application;
- relationship-memory preservation;
- marking resolution shown;
- guarded advance;
- completion;
- exact text/image block construction.

### Persistence
Local progress is stored separately from generated Story AI state under:
`qissa:v1:authoredStoryProgress:<story_id>:<story_version>`

Privacy/profile deletion now also clears authored-story progress.

Files:
- `src/lib/authoredStoryPersistence.ts`
- `src/lib/localPersistence.ts`

### Runtime package
The approved docs fixture has an exact runtime copy:
- docs: `docs/qissa/ai/fixtures/prazdnik_muzhestva_interactive_v3.ru.json`
- runtime: `src/data/authored/prazdnikMuzhestvaV3.ru.json`

A CI check fails if they drift.

### Exact inline image anchors
All 18 shared images now specify:
- `phase`: `story_text` or `post_choice_text`;
- `after_text`: one exact paragraph.

The contract check requires each anchor to match exactly once.

This allows the reader to render:
`text → image → text`
at the approved editorial location.

### Player component
`src/features/authoredStory/AuthoredStoryPlayer.tsx`

Supports:
- part counter/progress;
- story text split into paragraphs;
- shared illustrations embedded at exact anchors;
- A/B choice cards;
- choice-specific image slots;
- confirmation lock;
- selected resolution only;
- common continuation;
- restart-safe progress;
- end state;
- no fake final art when runtime URLs are missing.

### Preview route
Default production behavior is unchanged.

Preview is available only when:
- `VITE_QISSA_AUTHORED_V3_PREVIEW=true`;
- query parameter `authoredStory=prazdnik-muzhestva` is present.

When disabled, the current generated-story flow is untouched.

### Asset resolver
Final images are addressed by stable `asset_id`.

`src/data/authoredStoryAssets.ts` is the app-facing registry layer.

Current registry is intentionally empty. Only owner-approved, app-hosted assets should be added.

The player resolves:
1. registry URL by `asset_id`;
2. optional inline runtime URL as fallback;
3. otherwise no production image.

This prevents ChatGPT Library paths from leaking into runtime code.

## Deterministic verification

New command:
`npm run check:authored-v3`

CI validates:
- docs/runtime fixture parity;
- 7 parts;
- 4 decisions;
- exactly 2 options each;
- 16 path combinations;
- V3 baseline reconstructs V2 exactly;
- all 18 shared image anchors are exact/unique;
- 27 asset IDs are unique;
- branch choices do not contradict required final invariants;
- all paths converge to one common non-branch canon state;
- all 16 branch-memory combinations remain distinguishable.

The check is now part of `.github/workflows/ci.yml`.

## CI evidence

- QISSA CI #629: success after authored engine/player core.
- QISSA CI #631: success after preview-route integration.

## Intentionally not implemented yet

- preview flag is not enabled in production;
- final 27 illustration files are not registered;
- no authored-story remote/cloud progress sync yet;
- authored TTS/listening flow not yet connected;
- authored story is not yet exposed through normal Home/Library UI;
- no production rollout;
- 10–12 age taxonomy remains a separate product decision.

## Next engineering sequence

1. complete/approve final illustration assets;
2. upload approved assets to app-controlled storage;
3. fill `asset_id → URL` registry;
4. visually QA all 7 parts and 4 choice pairs in preview;
5. add authored narration plan/TTS branch filtering;
6. add durable remote progress sync;
7. run all 16 paths in UI/reload tests;
8. only then expose the story in normal app flow.
