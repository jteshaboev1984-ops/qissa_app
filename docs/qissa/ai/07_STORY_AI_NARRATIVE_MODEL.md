# Story AI Narrative Model

This document defines how QISSA should tell stories for the first real family beta. It sits above individual world motifs and below the safety/privacy/cost boundaries.

The goal is a story that feels authored and child-friendly while preserving the product's interactive core: the child chooses what the hero should do and later sees the world remember that decision.

## 1. The three roles

QISSA must keep three roles separate.

### Narrator

The narrator tells the story. The narrator may describe the world, actions and dialogue, but should not continuously address the listener as though the listener is physically inside the scene.

### Hero

The selected hero is the in-world protagonist. The story follows the hero's goal, problem, discovery and consequence.

The hero may be personalized by type and display name, but the model must not infer a child's personality, morality or abilities from gender.

### Child

The child is the listener/reader and decision-maker. The child's agency occurs at explicit choice moments in the UI and through remembered consequences in later story state.

The child is not automatically a character in the prose. Ordinary story text should not use second-person narration such as "you walked", "you saw", or "you ran" unless a future product mode explicitly defines the child as the hero.

## 2. What personalization means

Personalization is not simulated physical immersion.

The first real beta should personalize through:
- the selected hero and world;
- recurring characters;
- remembered choices;
- relationship changes;
- canon facts introduced by prior stories;
- active arcs;
- language and age fit;
- branch-specific consequences.

A strong second-session moment looks like this structurally:

1. previous story records a child choice;
2. later story state includes that choice or its consequence;
3. a character, object, relationship or situation visibly reflects it;
4. the narrator tells that consequence naturally inside the world;
5. the UI may separately remind the parent/child what was chosen.

## 3. Opening architecture for ages 5–7 bedtime

A strong opening should feel like the beginning of a real children's story, not a trailer or game event.

### First paragraph: orientation

Use one short paragraph to establish:
- where the story is;
- who the hero is;
- what the hero is doing right now.

This paragraph should be concrete and compact. It may contain one or two sensory details, but it should not become a scenery catalogue.

### Early curiosity

Within roughly 60–120 words, introduce one thing that makes the listener want to continue:
- something is missing;
- something behaves strangely;
- a friend needs help;
- the hero wants something specific;
- a small mystery appears;
- an ordinary plan goes slightly wrong in a funny way.

By roughly the first 100–120 words, the central question, desire or problem should be understandable.

### Cold-open rule

Do not force a sound effect, exclamation or unexplained action into sentence one merely to satisfy a hook metric. A cold open is acceptable only when the scene remains immediately understandable without orientation debt.

## 4. Episode 1 role

Episode 1 is the pre-choice half of one continuous bedtime story.

Recommended shape for 5–7 bedtime series:

1. **Orientation:** ~50–80 words.
2. **Curiosity/problem:** ~50–80 words.
3. **Development:** ~180–220 words of action, dialogue, discovery and reactions.
4. **Choice setup:** ~55–75 words that naturally creates two different hero actions.

The choice should occur around 40–50% of the full read-aloud session.

Episode 1 should not solve the original problem before the choice.

## 5. Choice model

The story pauses at a natural decision point. The UI asks what the hero should do.

Good choices:
- are phrased as concrete hero actions;
- are immediately understandable to a 5–7-year-old;
- are both emotionally safe;
- produce visibly different routes or consequences;
- preserve the same original story goal.

Bad choices:
- ask the child to choose abstract values;
- present technical mechanisms;
- differ only in wording;
- immediately converge to the same narrated result;
- make one branch morally "correct" and punish the other.

The child controls the decision, but the prose remains about the hero.

## 6. Resolution bridge

`resolution_text` is a short child-facing bridge shown after confirmation.

It should:
- be about 30–45 words;
- stay under 320 characters when practical;
- begin the selected hero action;
- show one visible change;
- stop before replaying the whole consequence.

Episode 2 begins after that visible change.

## 7. Episode 2 role

Episode 2 is the post-choice half of the same story.

Recommended shape:

1. **Choice consequence / working solution:** ~280–350 words.
2. **Resolution:** original story question is clearly answered.
3. **Bedtime coda:** ~120–160 words with lower energy and a complete warm ending.

Episode 2 must not restart the chosen action from the beginning, reset to the next morning before resolving the story, or invent a fresh unrelated problem just to fill length.

## 8. Momentum and description

After the short setup, every one or two short paragraphs should change something meaningful.

Examples:
- a character acts;
- a plan fails in a small funny way;
- a clue appears;
- somebody reacts;
- a friend disagrees;
- a character asks a useful question;
- an object behaves unexpectedly;
- the hero makes a decision;
- a previous detail gains meaning.

Description should support what is happening. Prefer one or two concrete details, then move.

Avoid:
- three or more static description sentences in a row;
- decorative lists;
- repeated statements that the place is calm, magical, beautiful or safe;
- explaining emotions that dialogue/action can show;
- moral summaries.

## 9. Dialogue and supporting characters

Supporting characters should have simple, memorable behavior. They should not exist only to explain the plot or lesson.

Useful traits include:
- harmless recurring habits;
- funny misunderstandings;
- contrasting approaches to the same problem;
- small competencies or weaknesses that matter to the plot.

Dialogue should help the story move, reveal character or create humor. It should not become filler.

## 10. Russian narration

Russian output must sound idiomatic and must not rely on second-person child narration as a workaround for hero-name inflection.

`{{HERO}}` should be used where the unchanged token is grammatically safe, preferably as a nominative subject or direct address. If another case would be required, rephrase the sentence so the token remains invariant.

For ambiguous/custom hero types, present-tense action can be used naturally when it helps avoid unnecessary gender assumptions in past-tense verbs.

Do not place raw `{{HERO}}` after a preposition or in a position that requires declension.

## 11. Uzbek narration

Uzbek should be written as native-sounding storytelling in Latin script. Do not translate Russian sentence by sentence. Jokes, phrasing and concrete details may differ as long as the same narrative contract, safety and story state are preserved.

## 12. Bedtime energy curve

Bedtime tone is an energy curve, not a requirement that every paragraph be quiet.

- beginning: warm and clear;
- middle: curious, active, funny or surprising in a gentle way;
- choice/consequence: meaningful and engaging;
- final 10–15%: slower, softer and complete.

The main story question should already be solved before the final coda.

## 13. Human editorial review rubric

Before real Story AI is enabled for families, each representative sample should be read end-to-end and scored on these dimensions:

| Dimension | Pass question |
| --- | --- |
| Orientation | Within the first paragraph, do we understand the world, hero and current situation? |
| Early curiosity | By ~100–120 words, is there a clear reason to keep listening? |
| Narrative roles | Is the child outside the prose except at explicit choice/UI moments? |
| Hero clarity | Is it clear who acts and wants something? |
| Description density | Does description serve the action without long static blocks? |
| Momentum | After setup, does something meaningfully change every 1–2 short paragraphs? |
| Character life | Do dialogue/reactions/traits make the cast memorable? |
| Choice quality | Are both options concrete, understandable hero actions with different consequences? |
| Continuity | Does Episode 2 continue after the bridge without replaying it? |
| Memory | Does prior state affect later fiction in a concrete way when available? |
| Language | Does RU/UZ sound natural rather than generated or translated? |
| Ending | Is the original question solved before a calm complete coda? |

A sample fails family-beta qualification if the structure passes mechanically but the story still feels confusing, generic, overly descriptive, game-like, or emotionally flat.

## 14. Release sequence

1. Lock this narrative model in prompt/spec/CI.
2. Produce and review a small number of real provider-generated samples.
3. Iterate the prompt only when concrete sample failures justify it.
4. Run the full RU/UZ × beta-world × branch qualification matrix.
5. Enable Story AI only for a tiny controlled family cohort.
6. Keep provider TTS OFF initially and preserve deterministic fallback, safety review, moderation and cost guards.
