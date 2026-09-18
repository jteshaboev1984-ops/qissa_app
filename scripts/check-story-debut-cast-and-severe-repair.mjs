import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { storyArchitectEditorialGuidance, storyNarratorEditorialGuidance } from '../supabase/functions/story-generate/editorial-guidance.ts'
import { textRepairRequiresFullStoryRewrite } from '../supabase/functions/story-generate/repair-routing.ts'
import { buildTextLengthRepairOutputSchema, buildTextLengthRepairPrompts } from '../supabase/functions/story-generate/prompt.ts'

// Synthetic prompt/schema contracts only. This cannot measure story quality or validate natural names.
// No external API, personal data, provider credentials, SQL, or paid model requests.
const fresh = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'synthetic-v103', sessionId: 'synthetic-v103-session', sessionIndex: 1, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
assert.ok(fresh && fresh.episodeIndex === 1)
const architecture = storyArchitectEditorialGuidance(fresh)
const narration = storyNarratorEditorialGuidance(fresh)
for (const fragment of ['FIRST-ENCOUNTER NAME POLICY', 'at most ONE newly named companion', 'species', 'appearance', 'matching diminutive', 'no mandatory name', 'CAUSAL CHAIN', 'new information']) {
  assert.ok(architecture.includes(fragment), `missing first-encounter name/plot guidance: ${fragment}`)
}
for (const fragment of ['DEBUT CAST', 'one named companion', 'first appearance', 'what has changed']) {
  assert.ok(narration.includes(fragment), `missing first-encounter narration rule: ${fragment}`)
}
const returning = { ...fresh, recurringCharacters: ['EstablishedName'] }
assert.ok(!storyArchitectEditorialGuidance(returning).includes('FIRST-ENCOUNTER NAME POLICY'), 'never rename established identities')
assert.ok(!storyNarratorEditorialGuidance(returning).includes('DEBUT CAST'), 'no redundant first meeting in continuing series')

const patch = { last_event: 'Do‘stlar uchrashdi.', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] }
const resolution = Array(32).fill('do‘st').join(' ')
const candidate = {
  title: 'Sinov', story_text: Array(261).fill('voqea').join(' '),
  choices: [
    { choice_id: 'a', text: 'Birinchi ish', effect_summary: '{{HERO}} bir ish qildi.', resolution_text: resolution, tomorrow_seed: 'Ertangi esdalik.', state_patch: patch },
    { choice_id: 'b', text: 'Ikkinchi ish', effect_summary: '{{HERO}} boshqa ish qildi.', resolution_text: resolution, tomorrow_seed: 'Boshqa esdalik.', state_patch: patch },
  ],
  state_patch: patch, vocabulary: [], nextEpisodePreview: 'Davomi.',
}
const original = structuredClone(candidate)
const errors = ['story_too_short']
assert.equal(textRepairRequiresFullStoryRewrite(fresh, errors, 261), true, 'v102-sized 261-word narration needs full rewrite, not prop insertion')
assert.equal(textRepairRequiresFullStoryRewrite(fresh, errors, 299), true, 'severe threshold lower bound')
assert.equal(textRepairRequiresFullStoryRewrite(fresh, errors, 300), false, 'moderate 300-word shortfall keeps bounded insertion')
assert.equal(textRepairRequiresFullStoryRewrite(fresh, errors), false, 'legacy two-argument callers still get known route')
assert.equal(textRepairRequiresFullStoryRewrite({ ...fresh, storyMode: 'one_time' }, errors, 261), false, 'one-time routing unchanged')
assert.equal(textRepairRequiresFullStoryRewrite({ ...fresh, ageGroup: '3-4' }, errors, 60), false, 'younger-child routing unchanged')
assert.equal(textRepairRequiresFullStoryRewrite(fresh, ['story_too_short', 'story_language_mismatch'], 310), true, 'language defect always rewrites')
const severeSchema = buildTextLengthRepairOutputSchema(fresh, errors, candidate)
assert.equal(severeSchema.properties.title_rewrite.type, 'string')
assert.equal(severeSchema.properties.story_rewrite.type, 'string')
assert.equal(severeSchema.properties.story_expansion.type, 'null')
assert.equal(severeSchema.properties.choice_resolutions.properties.choice_1.type, 'null', 'healthy A resolution immutable')
assert.equal(severeSchema.properties.choice_resolutions.properties.choice_2.type, 'null', 'healthy B resolution immutable')
const severePlan = JSON.parse(buildTextLengthRepairPrompts(fresh, candidate, errors).user).repair_plan
assert.ok(severePlan.story_rewrite && severePlan.story_expansion === null, 'Repair prompt must agree with schema and route')
const moderate = { ...candidate, story_text: Array(310).fill('voqea').join(' ') }
const moderateSchema = buildTextLengthRepairOutputSchema(fresh, errors, moderate)
assert.equal(moderateSchema.properties.story_rewrite.type, 'null')
assert.equal(moderateSchema.properties.story_expansion.type, 'string')
assert.ok(JSON.parse(buildTextLengthRepairPrompts(fresh, moderate, errors).user).repair_plan.story_expansion)
assert.deepEqual(candidate, original, 'no synthetic candidate or branch mutation')
const merger = readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')
assert.ok(merger.includes('textRepairRequiresFullStoryRewrite(context, validationErrors, candidate.story_text'), 'server merge must use same exact original word count as schema and prompt')
console.log('V103 first-encounter naming, causal progression, severe-vs-moderate Repair schema/plan/merge PASS; provider-free. Literary outcomes remain unverified.')
