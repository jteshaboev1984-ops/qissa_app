import assert from 'node:assert/strict'
import { buildTextLengthRepairOutputSchema, buildTextLengthRepairPrompts } from '../supabase/functions/story-generate/prompt.ts'
import { textRepairRequiresFullStoryRewrite } from '../supabase/functions/story-generate/repair-routing.ts'

// Repair-only contract: this stage must not ask the provider to fill JSON-null story fields.
// No network calls or production state.
const context = { ageGroup: '5-7', storyMode: 'series', storyMood: 'bedtime', episodeIndex: 1, language: 'uz', choiceHistory: [] }
const patch = { last_event: 'Old event.', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] }
const candidate = {
  title: 'Sovg‘a',
  story_text: '{{HERO}} Momiq bilan gaplashdi.\n\nUlar sovg‘ani tayyorlash haqida o‘yladi.',
  choices: [
    { choice_id: 'choice-a', text: 'Rasm chizish', effect_summary: '{{HERO}} rasmni tugatadi.', resolution_text: 'Rasm tayyor.', tomorrow_seed: 'Momiq rasmni ko‘rsatadi.', state_patch: patch },
    { choice_id: 'choice-b', text: 'Qo‘shiq aytish', effect_summary: '{{HERO}} qo‘shiq aytadi.', resolution_text: Array.from({ length: 32 }, () => 'do‘stlar').join(' '), tomorrow_seed: 'Momiq qo‘shiqni aytadi.', state_patch: patch },
  ],
  state_patch: patch, vocabulary: [], nextEpisodePreview: 'Davomi bo‘ladi.',
}
const errors = ['choice_resolution_too_short']
assert.equal(textRepairRequiresFullStoryRewrite(context, errors), false)
const schema = buildTextLengthRepairOutputSchema(context, errors, candidate)
assert.equal(schema.properties.title_rewrite.type, 'null')
assert.equal(schema.properties.story_rewrite.type, 'null')
assert.equal(schema.properties.story_expansion.type, 'null')
const prompts = buildTextLengthRepairPrompts(context, candidate, errors)
const plan = JSON.parse(prompts.user).repair_plan
assert.equal(plan.story_rewrite, null)
assert.equal(plan.story_expansion, null)
assert.deepEqual(plan.choice_resolutions.map((entry) => entry.choice_id), ['choice-a'])
assert.ok(prompts.system.includes('For a choice-resolution-only repair'), 'choice-only stage must explicitly request resolution fields only')
assert.ok(!prompts.system.includes('For a pure Episode 1 story_too_short failure, do NOT rewrite'), 'choice-only stage must not demand insertion that schema forbids')
console.log('Choice-resolution-only Repair prompt/schema/routing contract GREEN without provider calls.')
