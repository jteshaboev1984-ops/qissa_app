import assert from 'node:assert/strict'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { buildTextLengthRepairPrompts, buildTextLengthRepairOutputSchema } from '../supabase/functions/story-generate/prompt.ts'

// Deterministic synthetic MODERATE deficit: Narrator underlength, first Repair
// corrects choice bridges but still returns story_too_short; do not use real child text.
const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'synthetic-length-retry', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
assert.ok(context && context.episodeIndex === 1)
const patch = () => ({last_event:'Momiq kutmoqda.',new_friend:null,hero_trait:null,open_arc:'Sovg‘a',relationship_updates:[],canon_updates:[]})
const candidate = {
  title:'Momiqning sovg‘asi',
  story_text: Array(301).fill('Momiq').join(' ') + ' {{HERO}}.\n\nMomiq tanlovni kutadi.',
  choices: [
    {choice_id:'choice-a',text:'Rasm yasash',effect_summary:'Momiq rasmni oldi.',resolution_text:Array(30).fill('Momiq').join(' '),tomorrow_seed:'Momiq eslaydi.',choice_icon:'🎁',state_patch:patch(),value_alignment:['kindness']},
    {choice_id:'choice-b',text:'Qo‘shiq aytish',effect_summary:'Momiq tingladi.',resolution_text:Array(30).fill('Momiq').join(' '),tomorrow_seed:'Momiq eslaydi.',choice_icon:'🎵',state_patch:patch(),value_alignment:['friendship']},
  ],
  nextEpisodePreview:'Momiq yana keladi.',state_patch:patch(),vocabulary:[],
}
const original = structuredClone(candidate)
const words = candidate.story_text.trim().split(/\s+/u).filter(Boolean).length
assert.equal(words, 305)
const errors = ['story_too_short']
const first = JSON.parse(buildTextLengthRepairPrompts(context, candidate, errors).user).repair_plan.story_expansion
assert.equal(first.desired_total_after_insertion, 365, 'first repair plan remains unchanged')
const retryFeedback = 'Previous text repair failed deterministic validation: story_too_short. Rejected repair metrics: story_words=315, choice_1_resolution_words=30, choice_2_resolution_words=30.'
const retry = JSON.parse(buildTextLengthRepairPrompts(context, candidate, errors, retryFeedback).user).repair_plan.story_expansion
assert.equal(retry.desired_total_after_insertion, 400, 'underlength retry needs larger bounded target, not identical budget')
assert.equal(retry.absolute_minimum_additional_words, 320 - words, 'hard shortfall from immutable original')
assert.equal(retry.retry_previous_story_words, 315)
assert.equal(retry.retry_remaining_deficit_words, 5)
assert.ok(Number(retry.target_additional_words.split('-')[0]) > Number(first.target_additional_words.split('-')[0]))
assert.ok(Number(retry.target_additional_words.split('-')[1]) <= 470 - words - 10, 'headroom protects hard maximum')
assert.match(retry.counting_scope, /story_expansion/u)
assert.equal(JSON.parse(buildTextLengthRepairPrompts(context, candidate, errors, 'Unrelated correction').user).repair_plan.story_expansion.desired_total_after_insertion, 365, 'no blind boost')
assert.equal(JSON.parse(buildTextLengthRepairPrompts(context, candidate, errors, 'Rejected repair metrics: story_words=350.').user).repair_plan.story_expansion.desired_total_after_insertion, 365, 'no boost when previous story met minimum')
const schema = buildTextLengthRepairOutputSchema(context, errors, candidate)
assert.equal(schema.properties.story_expansion.type, 'string')
assert.equal(schema.properties.story_rewrite.type, 'null')
assert.equal(schema.properties.choice_resolutions.properties.choice_1.type, 'null')
assert.equal(schema.properties.choice_resolutions.properties.choice_2.type, 'null')
assert.deepEqual(candidate, original, 'no mutation of immutable Narrator candidate or branch state')
console.log('Synthetic bounded E1 repair-retry word budget PASS; 0 model/network/database calls.')
