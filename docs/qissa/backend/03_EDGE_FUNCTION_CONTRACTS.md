# QISSA Supabase Edge Function Contracts (Draft)

Status: design contract only; no function implementation in current prototype.

## 1) `story-generate`
Purpose: generate safe episode via Story Agent + Safety Agent pipeline.

Input contract:
```ts
interface StoryGenerateInput {
  sessionId: string
  requestedEpisodeNo: number
  previousChoiceEventId?: string
}
```

Output contract:
```ts
interface StoryGenerateOutput {
  episode: EpisodeRecord
  choices: StoryChoiceRecord[]
  safetyResult: SafetyResultRecord
  vocabulary: VocabularyItem[]
}
```

Validation:
- session exists;
- session ownership valid (future auth context);
- episode_no continuity checks;
- block if previous episode unresolved when required.

Idempotency notes:
- key: `(sessionId, requestedEpisodeNo)`;
- if already generated, return existing record.

Failure behavior:
- safe error if blocked by safety;
- no partial writes on generation failure (transaction).

Security boundary:
- client calls function endpoint;
- function uses service role to insert episode/choices/safety fields.
- `story_choices.choice_id` remains the visible choice key (choiceKey); confirmation uses `storyChoiceId` UUID.

## 2) `story-confirm-choice`
Purpose: confirm selected choice and apply state patch to memory.

Input contract:
```ts
interface StoryConfirmChoiceInput {
  sessionId: string
  episodeId: string
  storyChoiceId: string // DB UUID from story_choices.id
}
```

Output contract:
```ts
interface StoryConfirmChoiceOutput {
  choiceEvent: StoryChoiceEventRecord
  updatedSession: StorySessionRecord
}
```

Validation:
- storyChoiceId belongs to `episodeId`;
- episode belongs to `sessionId`;
- prevent duplicate confirmation per session+episode.

Idempotency notes:
- repeated same payload should return existing event if already confirmed.

Failure behavior:
- conflict response for duplicate alternate choice;
- transaction rollback on memory patch failure.

Security boundary:
- only trusted function updates `canon_state`, `relationship_state`, `active_arc`.

## 3) `story-reset`
Purpose: reset session progress while preserving child profile setup.

Input contract:
```ts
interface StoryResetInput {
  childProfileId?: string
  sessionId?: string
}
```

Output contract:
```ts
interface StoryResetOutput {
  session: StorySessionRecord
  resetAt: string
}
```

Validation:
- require exactly one identifier;
- ensure ownership;
- handle active/completed session states.

Idempotency notes:
- repeat reset should return same clean state.

Failure behavior:
- reject ambiguous identifiers;
- avoid deleting child profile.

Security boundary:
- trusted path can archive or recreate session records safely.

## 4) `safety-review`
Purpose: run/record stricter safety pipeline (future stage).

Input contract:
```ts
interface SafetyReviewInput {
  episodeId: string
  force?: boolean
}
```

Output contract:
```ts
interface SafetyReviewOutput {
  review: SafetyReviewRecord
  episodeSafetyStatus: 'approved' | 'needs_review' | 'blocked'
}
```

Validation:
- episode exists;
- safety payload schema conforms to policy fields.

Idempotency notes:
- by default, skip duplicate review for unchanged episode unless `force=true`.

Failure behavior:
- if review unavailable, keep prior safety state and return actionable error.

Security boundary:
- not writable by child-facing direct client;
- service role only in function runtime.
