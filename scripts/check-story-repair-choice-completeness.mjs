import assert from 'node:assert/strict'
import { buildTextLengthRepairOutputSchema, buildTextLengthRepairPrompts } from '../supabase/functions/story-generate/prompt.ts'

// v91 E1: a language mismatch and short narrator text route to full prose
// rewrite and both choice resolutions. A generic array could omit branch B.
const context = { ageGroup: '5-7', storyMode: 'series', storyMood: 'bedtime', episodeIndex: 1, language: 'uz', choiceHistory: [] }
const patch = { last_event: 'Momiq xursand bo‘ldi.', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] }
const resolution = Array.from({ length: 32 }, (_, i) => i % 2 ? 'do‘stlar' : 'kuldi').join(' ')
const candidate = {
  title: 'Momiqning sovg‘asi',
  story_text: '{{HERO}} Momiq bilan sovg‘a tayyorlashni o‘yladi.\n\nMomiq tanlovni kutdi.',
  choices: [
    { choice_id: 'choice-a', text: 'Rasm yasash', effect_summary: '{{HERO}} rasm yasadi.', resolution_text: resolution, tomorrow_seed: 'Rasm esda qoldi.', state_patch: patch },
    { choice_id: 'choice-b', text: 'Qo‘shiq aytish', effect_summary: '{{HERO}} qo‘shiq aytdi.', resolution_text: resolution, tomorrow_seed: 'Qo‘shiq esda qoldi.', state_patch: patch },
  ],
  state_patch: patch, vocabulary: [], nextEpisodePreview: 'Sovg‘a kutmoqda.',
}
const v91Errors = ['story_language_mismatch', 'story_too_short']
const schema = buildTextLengthRepairOutputSchema(context, v91Errors, candidate)
assert.equal(schema.properties.choice_resolutions.type, 'object', 'An array admits the missing B response that caused v91 fallback')
assert.equal(schema.properties.choice_resolutions.additionalProperties, false)
assert.deepEqual(schema.properties.choice_resolutions.required, ['choice_1', 'choice_2'])
assert.equal(schema.properties.choice_resolutions.properties.choice_1.type, 'string')
assert.equal(schema.properties.choice_resolutions.properties.choice_2.type, 'string')
assert.equal(schema.properties.story_rewrite.type, 'string', 'Language error and short text require one full rewrite')
const v91Plan = JSON.parse(buildTextLengthRepairPrompts(context, candidate, v91Errors).user).repair_plan
assert.deepEqual(v91Plan.choice_resolutions.map(({ slot, choice_id }) => [slot, choice_id]), [
  ['choice_1', 'choice-a'], ['choice_2', 'choice-b'],
])

const lengthSchema = buildTextLengthRepairOutputSchema(context, ['story_too_short'], candidate)
assert.equal(lengthSchema.properties.choice_resolutions.properties.choice_1.type, 'null', 'Do not rewrite healthy choice A')
assert.equal(lengthSchema.properties.choice_resolutions.properties.choice_2.type, 'null', 'Do not rewrite healthy choice B')
assert.deepEqual(JSON.parse(buildTextLengthRepairPrompts(context, candidate, ['story_too_short']).user).repair_plan.choice_resolutions, [])

const aShort = structuredClone(candidate)
aShort.choices[0].resolution_text = 'Juda qisqa.'
const oneSchema = buildTextLengthRepairOutputSchema(context, ['choice_resolution_too_short'], aShort)
assert.equal(oneSchema.properties.choice_resolutions.properties.choice_1.type, 'string')
assert.equal(oneSchema.properties.choice_resolutions.properties.choice_2.type, 'null')
assert.deepEqual(JSON.parse(buildTextLengthRepairPrompts(context, aShort, ['choice_resolution_too_short']).user).repair_plan.choice_resolutions.map(({ slot }) => slot), ['choice_1'])

const e2 = { ...context, episodeIndex: 2 }
const e2Candidate = { ...candidate, choices: [] }
const e2Schema = buildTextLengthRepairOutputSchema(e2, ['story_too_short'], e2Candidate)
assert.equal(e2Schema.properties.choice_resolutions.properties.choice_1.type, 'null')
assert.equal(e2Schema.properties.choice_resolutions.properties.choice_2.type, 'null')
console.log('Repair choice completeness PASS: mandatory two slots, one-target immutability and E2 null slots; provider-free.')
