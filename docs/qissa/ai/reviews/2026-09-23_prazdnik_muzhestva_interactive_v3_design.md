# «Праздник мужества» — Interactive V3 Design

> Status: owner-approved interactive design direction; V2 prose remains unchanged.  
> Date: 2026-09-23  
> Source literary text: `2026-09-23_prazdnik_muzhestva_working_v2.md`  
> Goal: produce an app-ready interactive adaptation with 7 story parts and 4 meaningful choices without creating divergent full-story branches.

## 1. Versioning decision

- **V1** = preserved owner-approved literary snapshot.
- **V2** = linear canonical literary master with current editorial/world refinements.
- **V3 Interactive** = app adaptation derived from V2.

Do **not** insert UI decision metadata or alternate branches into V2.

V2 remains readable as a normal complete fairy tale. V3 restructures the same story into common story parts + short branch resolutions + explicit merge states.

## 2. Why V3 must be separate

Current QISSA runtime is built around `split-v1`:
- Episode 1 has exactly 2 choices.
- Episode 2 has 0 choices.
- Story status is hard-coded around episode 1 / episode 2.
- Story generation explicitly strips choices from episode 2.

«Праздник мужества» needs 4 choice moments. Forcing them into the current split contract would either:
1. destroy the approved story rhythm, or
2. require hidden rewriting inside one text blob that the UI cannot safely resume from.

Therefore V3 should define a reusable **multi-choice authored-story contract** first, while the existing Story AI `split-v1` remains untouched until the player is proven.

## 3. Core interaction model

The story is mostly linear.

Each choice has:
- one shared pre-choice scene;
- 2 concrete actions;
- a short branch-specific resolution;
- one explicit merge state;
- the next common part.

The child changes **how** a moment happens, not whether the main canon happens.

No full binary tree.

For 4 choices this avoids 16 complete story variants.

## 4. Seven-part structure

### Part 1 — «Праздник мужества»
Capital, festival, selection, Temur/Samira, King’s mission, horses and road books.

**Choice:** none.

### Part 2 — «Первая развилка»
Departure, fallen tree, Samira’s lie, Temur consciously trusts her because she studied the book, Temur bolts toward the forest before Samira is ready.

**Choice:** none.

Samira’s lie is authored canon and must not become a player choice.

### Part 3 — «Восточный лес»
Bandit sign, ambush, rope, sabre escape, Temur’s road book lost beneath the roots of the forked oak, pursuit.

**Choice 1:** how Temur gets past the ditch / terrain.

### Part 4 — «Дорога Самиры»
Flooded river, unsafe ford, road-sign/book logic, old stone crossing.

**Choice 2:** how Samira searches for / identifies the safe crossing.

### Part 5 — «Заран»
Samira arrives first and receives sealed reply.

**Choice 3:** leave immediately or wait only until Temur is visible far down the road.

Then common story continues: Samira departs before Temur reaches the city; Temur later arrives and reports the bandits/sign.

### Part 6 — «Обратная дорога»
Landslide; Samira chooses on her own to stay and warn Temur; fall; adult rescue; confession.

**Choice 4:** after confession, how Temur handles renewed trust when Samira proposes the route.

### Part 7 — «Возвращение»
Return to capital, replies opened, truth told, king’s decision, standing bahadur ceremony with ceremonial belts and sheathed sabres, humor, unresolved bandit-symbol hook.

**Choice:** none.

The ending must remain continuous and authored.

## 5. Choice 1 — Temur: jump or precise control

### Decision setup

Bandits are still pursuing. Temur’s road book has already fallen and remains under the large forked oak. Ahead, the trail meets dangerous terrain / ditch.

### A — V2 baseline
**Action:** Temur commits to the jump and Shamol clears the ditch.

**Memory idea:**
`choice.temur_escape_method = "jumped_ditch"`

**Meaning:** speed, nerve, horse/rider trust.

### B — approved alternative
**Action:** Temur spots a narrow usable line near the edge and actively guides Shamol through it: shortens the reins, changes direction, controls speed, threads between stones, then returns to the main trail.

**Memory idea:**
`choice.temur_escape_method = "precise_control"`

**Meaning:** riding skill, observation, control under pressure.

### Mandatory merge state

After either choice:
- Temur escaped immediate pursuit;
- royal letter intact;
- Temur’s road book remains lost under the forked oak;
- Temur and Shamol remain together;
- bandits remain unresolved;
- Temur continues toward Zaran.

No later plot paragraph may require knowing A/B unless used as a memory callback.

## 6. Choice 2 — Samira: identify the warning or search first

### A — V2 baseline
Samira sees the stone marker, recognizes it from the road book, checks the entry, learns the lower ford is dangerous and finds the old crossing upstream.

**Memory idea:**
`choice.samira_river_method = "marker_then_book"`

### B — approved alternative
Samira studies the muddy water and decides she will not enter a crossing whose bottom she cannot see. She deliberately begins searching upstream for a safer place. During that search she finds the stone marker, then uses the road book to identify the old crossing.

**Memory idea:**
`choice.samira_river_method = "search_then_marker"`

### Mandatory merge state

After either:
- Samira avoids the dangerous ford;
- Samira uses/retains the road book;
- Bulut is safe;
- old stone crossing is used;
- Samira remains ahead and reaches Zaran first.

## 7. Choice 3 — Samira: leave Zaran or wait for proof Temur is coming

Samira has her sealed reply. Temur has not arrived.

### A — V2 baseline
Samira leaves immediately because the mission is still a race.

**Memory idea:**
`choice.samira_zaran_wait = "left_immediately"`

### B — approved alternative
Samira waits at the gate/lookout only until a rider becomes visible far down the eastern road. She recognizes Shamol, knows Temur reached the city road alive, then immediately leaves.

She does **not** wait for Temur to arrive or speak to him.

**Memory idea:**
`choice.samira_zaran_wait = "waited_until_visible"`

### Mandatory merge state

After either:
- Samira leaves Zaran before Temur reaches the ruler;
- Samira still has the lead;
- Temur later reaches Zaran;
- Temur reports bandits and the symbol;
- the ruler sends the warning to the King.

This choice may affect later emotional callbacks: in B, Samira already shows concern before the landslide decision; in A, the later landslide warning is the first time she visibly sacrifices race advantage.

## 8. Choice 4 — Temur: verify or give a second chance

After Samira confesses the first-fork lie, she later says her road book shows a route back to the main road.

### A — cautious rebuilding
Temur pauses, asks «Покажи», reads the entry himself, verifies it, then agrees.

**Memory idea:**
`choice.temur_trust_response = "verified_first"`

### B — second chance
Temur wants to verify, but remembers Samira has just voluntarily told the truth when she could have stayed silent. He decides to trust her once more.

Suggested key beat:
- Samira: «Ты не будешь проверять?»
- Temur: «Буду надеяться, что одного раза тебе хватило.»
- Samira: «Хватило.»
- Temur: «Тогда веди.»

**Memory idea:**
`choice.temur_trust_response = "offered_second_chance"`

### Mandatory merge state

After either:
- route accepted;
- both continue toward the capital;
- Samira’s confession remains canon;
- Temur does not forget the earlier lie;
- relationship is rebuilding;
- final palace sequence remains unchanged.

Branch-specific relationship memory may remain different in later stories.

## 9. Non-interactive canon beats

These must never be turned into choices in this story:
- Samira deliberately lies at the first fork.
- Temur goes through the Eastern Forest.
- bandits confront Temur.
- Temur uses the sabre to cut the rope, not to attack a person.
- Temur loses the road book under the forked oak.
- Samira reaches Zaran first.
- Samira chooses to remain and warn Temur at the landslide.
- Samira falls.
- Temur gets competent adults and ropes for the rescue.
- Samira voluntarily confesses her lie.
- both deliver intact replies.
- the King names both children **юные бахадуры царства** through the standing belt-and-sheathed-sabre ceremony.
- bandit-sign arc remains unresolved.

These authored beats carry the characters’ moral agency. The child’s choices must enrich them, not replace them.

## 10. Proposed V3 app data shape

Do not store the choices inline as prose markers.

Suggested conceptual contract:

```ts
type InteractiveStoryV3 = {
  story_id: string
  story_version: 'interactive-v3'
  world_id: 'seven_roads'
  title: string
  parts: StoryPartV3[]
}

type StoryPartV3 = {
  part_id: string
  order: number
  title: string
  story_text: string
  decision?: {
    decision_id: string
    prompt: string
    choices: [InteractiveChoiceV3, InteractiveChoiceV3]
    merge_state: Record<string, string>
  }
  is_final: boolean
}

type InteractiveChoiceV3 = {
  choice_id: string
  text: string
  resolution_text: string
  state_patch: StatePatch
}
```

### Playback behavior

1. Render common `story_text`.
2. If no decision → Continue.
3. If decision → show two choice cards.
4. Save selection before continuing.
5. Show only selected `resolution_text`.
6. Apply branch `state_patch`.
7. Validate / apply common `merge_state`.
8. Advance to next part.
9. Resume correctly after app restart from current part + selected choice.

## 11. Why resolution_text is the right branch mechanism

The existing QISSA contract already has `resolution_text` attached to each choice.

For this story, branch-specific prose should stay compact enough to live there.

The large common story stays outside the branch.

This gives:

`common prose → choice → short A/B resolution → common prose`

rather than:

`choice → two fully separate stories`.

This is also safer for illustrations, narration/TTS, localization and QA.

## 12. Runtime gap in the current app

Current code cannot consume V3 directly yet.

Known hard-coded assumptions:
- `story-architecture.ts`: `plan_version = split-v1`.
- `validateStoryBlueprint`: Episode 1 requires exactly 2 choices; Episode 2 requires exactly 0.
- `enforceStoryBlueprintContextContract`: Episode 2 choices are forcibly cleared.
- `storyContracts.ts`: StoryStatus has only `episode_1_active`, `episode_1_choice_saved`, `episode_2_active`, `completed`.
- `storyStatus.ts`: completion is detected from `ep-2`.
- `memoryAgent.ts`: episode progress is collapsed to segment 1 or 2.

The database foundation is closer to what V3 needs:
- `story_episodes.episode_no` already supports arbitrary positive numbers.
- `story_choices` attaches choices to an episode/part.
- `story_choice_events` already permits one confirmed choice per session + episode.

Therefore the main work is runtime/contracts/UI generalization, not rebuilding persistence from zero.

## 13. Recommended implementation strategy

### Phase A — authored V3 player first

Do **not** rewrite Story AI generation immediately.

Add a new authored `multi-choice-v1` story package/player that supports:
- N ordered parts;
- optional choice per part;
- exactly two options at a choice point;
- short resolution text;
- saved progress;
- branch memory;
- common merge.

Run «Праздник мужества» through this deterministic player first.

### Phase B — prove UX and persistence

Test:
- all 16 combinations of 4 choices;
- logout/login resume;
- back/forward behavior;
- selected resolution never replays incorrectly;
- no duplicate choice event;
- all paths reach identical required canon ending;
- branch-specific memory remains available;
- illustrations use correct state;
- TTS reads only selected branch.

### Phase C — only then extend Story AI

Once the multi-choice player is stable, introduce a new AI planning contract (for example `multi-choice-v1`) instead of mutating `split-v1` in place.

The Architect can then generate the same structure:
- common parts;
- optional decision;
- two short branch resolutions;
- explicit merge state;
- limited remembered branch deltas.

Keep `split-v1` available during migration/fallback.

## 13A. Age / safety contract boundary

Interactive V3 is **not** a drop-in replacement for the current generated `split-v1` contract.

Current generic choice guidance was written primarily for the 5–7 bedtime MVP and includes a "no high-stakes danger" rule. Story 1 is editorially aimed at **8–12**, and the current app can represent the **8–9** slice through `age_group = 8-9` + `story_mood = kind_adventure`.

Choice 1 occurs during an active escape from bandits. The selectable actions themselves are nonviolent riding/escape actions, but the surrounding scene is intentionally more intense than the existing 5–7 bedtime choice contract.

Therefore:
- do not route this authored story through the existing 5–7/generated-choice assumptions;
- qualify it as authored `8-9 / kind_adventure` content;
- keep the current `split-v1` safeguards unchanged for existing generated stories;
- add a separate authored multi-choice safety/editorial qualification before enabling V3 in the app;
- if QISSA later supports ages 10–12 explicitly, extend the product age taxonomy deliberately rather than silently mapping those users to 8–9.

This is a product-contract boundary, not permission to increase violence. Existing Story-1 rules remain: no gore, no weapon strike on a person, Temur escapes instead of fighting, and adults perform the dangerous rescue work.

## 13B. Editorial reference assets vs runtime assets

The approved master/scene images currently live in the user's persistent QISSA Library folder and are authoritative **editorial references**.

Those Library paths are not app production URLs.

V3 content uses stable `asset_id` values. Before runtime integration, each final production image must be uploaded to app-controlled storage (for example Supabase Storage/CDN) and the asset registry must resolve `asset_id → runtime URL`.

Do not hard-code ChatGPT Library paths into the app.

---

## 14. Required deterministic acceptance matrix

Four binary decisions = 16 paths.

All 16 must end with these invariant facts:
- Samira lied at first fork.
- Temur encountered bandits.
- Temur lost his road book at the forked oak.
- Samira reached Zaran first.
- Temur delivered bandit intelligence.
- Samira warned Temur about landslide.
- Samira confessed.
- both returned with valid replies.
- both became **юные бахадуры царства**.
- bandit arc remains open.

Only these branch memories vary:
- Temur escape method;
- Samira river method;
- whether Samira waited to see Temur from afar;
- Temur’s trust response after confession.

If any of the 16 paths changes a mandatory invariant, V3 fails.

## 15. Editorial source-of-truth rule

V2 remains the canonical linear literary source.

V3 may move V2’s baseline action into a choice’s `resolution_text`, but must not silently rewrite unrelated V2 prose.

When V2 is intentionally edited later:
1. edit/approve V2 first;
2. calculate the V3 delta;
3. update affected common part / branch resolution;
4. rerun all 16 V3 path checks.

This prevents the literary story and the app story from drifting apart.
