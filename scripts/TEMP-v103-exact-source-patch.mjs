import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

// Ephemeral offline patcher: only exact reviewed source anchors, no secrets/provider/DB.
assert.equal(process.env.GITHUB_REF, 'refs/heads/fix/v103-story-character-and-severe-repair-20260918')
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1')
const pending = new Map()
const one = (text, before, after, label) => {
  assert.equal(text.split(before).length - 1, 1, `${label}: original anchor must occur exactly once`)
  return text.replace(before, after)
}
const edit = (path, fn) => {
  const original = readFileSync(path, 'utf8')
  const updated = fn(original)
  assert.notEqual(updated, original, `${path}: no changes`)
  pending.set(path, updated)
}

edit('supabase/functions/story-generate/editorial-guidance.ts', old => {
  let s = one(old, "  'In the first 40-80 words", "  'FIRST-ENCOUNTER NAME POLICY: for a new bedtime series, introduce at most ONE newly named companion before the first choice; other incidental animals can remain unnamed, and there is no mandatory name when no companion is needed. At first encounter identify species and the name together in natural prose. A character name is an independent fictional identity: do not automatically derive it from species, body parts, fur, color, texture, food or an animal pun; avoid matching diminutive endings and near-rhyming names for distinct characters. Choose a distinct, easy-to-say proper or meaningful invented name suited to the language, not necessarily a human name for every animal. Make the character memorable through an action with a causal result rather than relying on the name. Previously established memory names are immutable.',\n  'In the first 40-80 words", 'fresh Architect name contract')
  s = one(s, "  'Spend the next paragraphs", "  'DEBUT CAST: introduce at most one named companion when that character matters; identify species and name naturally at first appearance. Other incidental animals need no invented proper names. Do not derive new names mechanically from an animal, its food or appearance, or make a row of similar-sounding diminutives. Do not rename any memory character. Make the one named companion recognizable through what they DO, not a list of traits.',\n  'Spend the next paragraphs", 'fresh Narrator cast contract')
  s = one(s, "  'For the planned 5-7 meaningful pre-choice beats,", "  'CAUSAL CHAIN: after orientation and one child-scale problem, let {{HERO}} make a concrete attempt. Show its specific result, then NEW information or a changed character response that makes a different next action sensible. Let the hero adjust before reaching an unresolved consequential choice. Each step must change the situation; repeatedly moving or examining a blanket, leaf, key or other prop with no new information does not form a chain. For a mystery, clues must narrow the question; for a social story, replies must alter what the characters can do. If the chain cannot be planned, redesign the same central problem rather than inventing a second problem or padding.',\n  'For the planned 5-7 meaningful pre-choice beats,", 'Architect causal chain')
  s = one(s, "  'Show an earned gentle joke", "  'At the end of each paragraph ask what has changed since the last one. If nothing has changed, condense that paragraph and give the existing Architect beat an observable attempt, consequence or useful discovery instead; do not invent durable canon or enact a choice prematurely. Repeating prop handling, praise, smiling, watching or waiting is not momentum. A single prop may recur only when its meaning or effect changes.',\n  'Show an earned gentle joke", 'Narrator paragraph change')
  return s
})

edit('supabase/functions/story-generate/repair-routing.ts', old => {
  let s = one(old, "  context: Pick<NormalizedStoryContext, 'episodeIndex'>,\n  errors: string[],\n): boolean => {", "  context: Pick<NormalizedStoryContext, 'episodeIndex'> & Partial<Pick<NormalizedStoryContext, 'ageGroup' | 'storyMode' | 'storyMood'>>,\n  errors: string[],\n  storyWords?: number,\n): boolean => {", 'scoped optional word count')
  s = one(s, "  if (errors.some((error) => fullStoryRewriteErrors.has(error))) return true\n", "  if (errors.some((error) => fullStoryRewriteErrors.has(error))) return true\n  // Severe initial E1 deficits have repeatedly produced filler when insertion preserves\n  // a weak original. Rewrite the whole EXISTING plot instead, without adding canon.\n  if (context.episodeIndex === 1 && context.ageGroup === '5-7' &&\n    context.storyMode === 'series' && context.storyMood === 'bedtime' &&\n    errors.includes('story_too_short') && typeof storyWords === 'number' &&\n    Number.isFinite(storyWords) && storyWords < 300) return true\n", 'severe short story branch')
  s = one(s, '  // Short Episode 1 can use bounded insertion.', '  // Moderate short Episode 1 can use bounded insertion.', 'accurate insertion comment')
  return s
})

edit('supabase/functions/story-generate/prompt.ts', old => {
  const needle = 'textRepairRequiresFullStoryRewrite(context, validationErrors)'
  assert.equal(old.split(needle).length - 1, 2, 'prompt/schema must have exactly two route calls')
  let s = old.replaceAll(needle, 'textRepairRequiresFullStoryRewrite(context, validationErrors, storyWordCount(candidate.story_text))')
  s = one(s, 'A deterministic prose or language defect is already present in the Narrator output, so rewrite the full title and story_text', 'A severe first-story length deficit or deterministic prose/language defect requires rewriting the full title and story_text', 'rewrite reason not misleading')
  s = one(s, 'For a pure Episode 1 story_too_short failure, do NOT rewrite the existing story.', 'For a MODERATE Episode 1 story_too_short failure only, do NOT rewrite the existing story.', 'moderate insertion branch')
  s = one(s, "    'When full-story rewrite is required, return title_rewrite as a child-facing title in the requested language that describes the same story. Do not rename established characters.',", "    'When full-story rewrite is required, return title_rewrite as a child-facing title in the requested language that describes the same story. Do not rename established characters. If the original Episode 1 is severely short, use existing licensed beats as a connected attempt, result, new information and adjustment; rewrite neighboring paragraphs for causality instead of inserting a repetitive prop scene. Do not add a new durable clue, character, premise or choice result.',", 'full rewrite momentum')
  return s
})

edit('supabase/functions/story-generate/openai.ts', old => one(old,
  'const fullStoryRewrite = textRepairRequiresFullStoryRewrite(context, validationErrors)',
  'const fullStoryRewrite = textRepairRequiresFullStoryRewrite(context, validationErrors, candidate.story_text.trim().split(/\\s+/u).filter(Boolean).length)',
  'server merger routing'))

edit('scripts/check-story-cross-layer-contracts.mjs', old => one(old,
  "const lengthOnly = ['story_too_short']\nassert.equal(textRepairRequiresFullStoryRewrite(context, lengthOnly), false)\nassert.equal(buildTextLengthRepairOutputSchema(context, lengthOnly, candidate).properties.story_expansion.type, 'string')\nassert.ok(JSON.parse(buildTextLengthRepairPrompts(context, candidate, lengthOnly).user).repair_plan.story_expansion)",
  "const lengthOnly = ['story_too_short']\nconst originalWordCount = candidate.story_text.trim().split(/\\s+/u).filter(Boolean).length\nassert.equal(textRepairRequiresFullStoryRewrite(context, lengthOnly, originalWordCount), true, 'severely short synthetic story requires full rewrite')\nassert.equal(buildTextLengthRepairOutputSchema(context, lengthOnly, candidate).properties.story_rewrite.type, 'string')\nassert.equal(buildTextLengthRepairOutputSchema(context, lengthOnly, candidate).properties.story_expansion.type, 'null')\nassert.ok(JSON.parse(buildTextLengthRepairPrompts(context, candidate, lengthOnly).user).repair_plan.story_rewrite)\nconst moderateCandidate = { ...candidate, story_text: Array(310).fill('voqea').join(' ') }\nassert.equal(textRepairRequiresFullStoryRewrite(context, lengthOnly, 310), false, 'moderate shortfall retains insertion')\nassert.equal(buildTextLengthRepairOutputSchema(context, lengthOnly, moderateCandidate).properties.story_expansion.type, 'string')\nassert.ok(JSON.parse(buildTextLengthRepairPrompts(context, moderateCandidate, lengthOnly).user).repair_plan.story_expansion)",
  'cross-layer severe and moderate fixture'))

edit('scripts/check-story-repair-retry-word-budget.mjs', old => {
  let s = one(old, '// Deterministic synthetic v93 failure shape: Narrator underlength, first Repair', '// Deterministic synthetic MODERATE deficit: Narrator underlength, first Repair', 'moderate fixture comment')
  s = one(s, "Array(249).fill('Momiq')", "Array(301).fill('Momiq')", '253 to 305 fixture')
  s = one(s, 'assert.equal(words, 253)', 'assert.equal(words, 305)', 'fixture word count')
  s = one(s, 'story_words=292, choice_1_resolution_words', 'story_words=315, choice_1_resolution_words', 'previous repair metrics')
  s = one(s, 'assert.equal(retry.retry_previous_story_words, 292)', 'assert.equal(retry.retry_previous_story_words, 315)', 'previous word assertion')
  s = one(s, 'assert.equal(retry.retry_remaining_deficit_words, 28)', 'assert.equal(retry.retry_remaining_deficit_words, 5)', 'remaining deficit assertion')
  return s
})

edit('package.json', old => one(old, '&& node scripts/check-story-provider-incomplete.mjs"', '&& node scripts/check-story-provider-incomplete.mjs && node scripts/check-story-debut-cast-and-severe-repair.mjs"', 'register regression in core CI'))

assert.deepEqual([...pending.keys()].sort(), [
  'package.json', 'scripts/check-story-cross-layer-contracts.mjs',
  'scripts/check-story-repair-retry-word-budget.mjs',
  'supabase/functions/story-generate/editorial-guidance.ts',
  'supabase/functions/story-generate/openai.ts',
  'supabase/functions/story-generate/prompt.ts',
  'supabase/functions/story-generate/repair-routing.ts',
].sort())
for (const [path, content] of pending) writeFileSync(path, content, 'utf8')
console.log('V103_EXACT_SOURCE_PATCH_PASS: 7 reviewed existing files, no provider requests or DB changes.')
