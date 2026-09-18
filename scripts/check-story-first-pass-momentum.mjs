import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { storyArchitectEditorialGuidance, storyNarratorEditorialGuidance } from '../supabase/functions/story-generate/editorial-guidance.ts'
import { buildNarratorPrompts } from '../supabase/functions/story-generate/story-architecture.ts'

// Provider-free prompt contract, NOT a literary-quality score or human review.
const context = {
  ageGroup: '5-7', storyMode: 'series', storyMood: 'bedtime', episodeIndex: 1,
  language: 'uz', stylePackId: 'cozy_forest', heroType: 'custom',
  choiceHistory: [], sessionIndex: 1, isFinalSeriesSession: false,
}
const blueprint = { plan_version: 'split-v1', central_goal: 'Do‘stlarning birga qo‘shiq aytishi', beats: [], choices: [], state_patch: {} }
const narrator = buildNarratorPrompts(context, blueprint)
const request = JSON.parse(narrator.user)
const guidance = storyNarratorEditorialGuidance(context)
const architect = storyArchitectEditorialGuidance(context)
const repair = readFileSync('supabase/functions/story-generate/prompt.ts', 'utf8')

assert.equal(request.target_story_words, '380-420', 'single first-pass E1 target')
assert.deepEqual(request.hard_story_word_range, { minimum: 320, maximum: 470 }, 'hard bounds must remain unchanged')
assert.match(guidance, /380-420-word story_text/, 'editorial guidance must match the primary Narrator target')
assert.doesNotMatch(guidance, /350-390-word story_text/, 'stale competing Narrator word target')
assert.match(architect, /something actually changes/, 'Architect must plan causal progress')
assert.match(guidance, /observable change/, 'Narrator must realize causal beats rather than repeat waiting')
assert.match(guidance, /waiting or reassurance/, 'E1 prose must avoid redundant waiting/reassurance')
assert.match(repair, /each inserted paragraph must contain an observable change/, 'Repair must add causal content')
assert.match(repair, /do not repeat waiting or reassurance/, 'Repair must not pad the same emotional beat')
assert.match(repair, /Do not introduce a new durable object, clue, relationship, location, mechanism state, branch consequence, canon fact, problem or mission/, 'Repair must keep canon immutable')
assert.match(repair, /Every pre-choice insertion must remain equally true/, 'Repair must preserve independent branches')
console.log('E1 first-pass/Repair prompt consistency passed (provider-free; not proof of generated quality).')
