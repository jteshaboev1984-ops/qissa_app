# Family Beta Story AI Editorial Scorecard

This scorecard is the human quality gate for real provider-generated QISSA stories before they are shown to families.

Passing schema, safety, duration and localization checks is necessary but not sufficient. A story can be technically correct and still feel dull, mechanical, moralizing or generic. The family-beta bar is: **would a 5–7-year-old want to hear what happens next, and would a parent feel comfortable reading it aloud?**

## Review method

Read the complete child-facing session in order:

1. Episode 1;
2. both choice cards;
3. the selected `resolution_text` bridge;
4. Episode 2;
5. if the sample has prior memory, the remembered consequence in the fiction.

Do not score raw JSON fields in isolation. Read it as a bedtime story.

Use:
- `0` = fail;
- `1` = acceptable but weak / needs iteration;
- `2` = family-beta quality.

A sample needs **at least 20/24**, with no hard fail and no `0` in Story pull, Narrative roles, Choice quality, Language/localization or Ending.

## Scorecard

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| **Opening orientation** | confusing or drops into unexplained action | understandable but generic/slow | brief, natural story opening; hero, place and current action are clear |
| **Story pull** | no clear reason to continue | question/problem exists but feels routine | clear child-scale curiosity, desire or mystery that genuinely invites continuation |
| **Narrative roles** | listener is accidentally written into the scene or roles blur | mostly correct with awkward direct-address moments | narrator, hero and child decision-maker remain cleanly separated |
| **Description density** | scenery/explanation repeatedly stalls story | mostly controlled with some padding | details are concrete, memorable and serve current action |
| **Momentum** | long stretches where nothing changes | uneven | meaningful action/reaction/discovery/decision every 1–2 short paragraphs after setup |
| **Character life** | characters are plot devices or lecturers | one memorable trait but limited life | dialogue, reactions and behavior make characters distinct without gimmick overload |
| **Gentle delight / wonder** | flat, procedural or lesson-first | pleasant but predictable | contains at least one earned funny, surprising, tender or imaginative moment worth remembering |
| **Choice quality** | decorative, moralized, confusing or immediately convergent | two valid actions but consequences feel similar | both options are appealing concrete hero actions with visibly different routes/consequences |
| **Bridge + continuation** | Episode 2 replays/reset the selected action | small repetition or seam | bridge creates one change and Episode 2 continues naturally after it |
| **Memory / continuity** | prior state ignored or contradicted | memory mentioned abstractly | prior choice/canon changes a character, object, relationship or situation naturally |
| **Language / localization** | translated feel, imported names/dialogue or awkward grammar | mostly native with a few artificial phrases | narration, new names, dialogue, humor and forms of address feel native to selected language |
| **Ending / bedtime curve** | unresolved tension, abrupt stop or new late plot beat | safe but formulaic | main question is solved, energy lowers naturally, final image feels complete and bedtime-ready |

## Hard fails

Any one of these rejects the sample regardless of total score:

- safety/moderation rejection;
- child is continuously treated as a physical character without an explicit child-as-hero mode;
- context-free opening that is confusing rather than intriguing;
- one choice is clearly framed as the morally good answer while the other is shamed or punished;
- both choices produce effectively the same child-visible consequence;
- Episode 2 restarts the story, repeats the bridge, or creates an unrelated filler problem;
- unresolved fear/tension at bedtime ending;
- selected/custom hero name or established canon name is silently changed for localization;
- new supporting names/dialogue clearly belong to another language without a world/canon reason;
- visible policy, AI, JSON, safety or technical language leaks into child prose.

## Choice-pair review

A single selected branch cannot prove interactive quality. Before a world/language is family-beta qualified, review **both branches** from the same Episode 1.

Both branches should:
- pursue the same established story goal;
- remain equally legitimate choices for the child;
- differ in at least one substantial scene, interaction, discovery, helper, object or remembered consequence;
- reach a satisfying safe resolution without one branch feeling like a shortened or inferior version;
- leave different memory/canon material when appropriate.

Do not manufacture difference through cosmetic wording alone.

## Localization review

For every RU/UZ sample, separately ask:

- Would a parent naturally say these names aloud in this language?
- Do dialogue and jokes sound spoken rather than translated?
- Are diminutives/interjections/forms of address natural?
- Does any word or name feel randomly English/Russian/Uzbek without a story reason?
- Are local cultural details relevant instead of decorative?
- Are existing custom/recurring/canon names preserved exactly?

Correct grammar alone is not enough.

## “Wow” review

The first-session story does not need spectacle. It needs one or two moments the child can remember: a funny behavior, a surprising but gentle reveal, a lovable character, an imaginative object, or a choice with a visible payoff.

The stronger QISSA wow is the **next-session memory payoff**. For a series qualification sample, later fiction should make the child feel that the world genuinely remembers what happened without the narrator announcing a database-like memory fact.

## Release decision

For each reviewed sample record:

- score by dimension;
- total score;
- hard-fail status;
- 2–4 concrete editorial notes;
- decision: `PASS`, `ITERATE`, or `REJECT`.

Do not average away repeated weaknesses. If multiple samples repeatedly score `1` in the same dimension, update the Story Agent prompt/contract before spending on the full qualification matrix.
