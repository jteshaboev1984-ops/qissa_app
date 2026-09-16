import assert from 'node:assert/strict'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'

const oneTimeContinued = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'one_time', storyMood: 'bedtime' },
  seriesState: { id: 'one-time-stale', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 1 },
})
assert.ok(oneTimeContinued)
assert.equal(oneTimeContinued.episodeIndex, 2, 'C10 reproduction changed: stale one_time episodeCount no longer creates continuation')
console.log('CONFIRMED C10: one_time can incorrectly normalize as Episode 2 when stale episodeCount > 0')

const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'menu-overlap', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
assert.ok(context)
const patch = (last_event) => ({ last_event, new_friend: null, hero_trait: null, open_arc: 'Momiq sovg‘asi', relationship_updates: [], canon_updates: [] })
const blueprint = {
  plan_version: 'split-v1', central_goal: 'Momiq uchun sovg‘a tayyorlash', setting_anchor: 'shinam o‘rmon', continuity_callbacks: [],
  beats: ['{{HERO}} Momiq bilan gaplashadi', 'Momiq sovg‘ani ko‘rsatadi', '{{HERO}} fikrni tinglaydi', 'Momiq javobni kutadi'],
  decision_point: 'Barglardan rasm yasash yoki birgalikda qo‘shiq aytish?',
  choices: [
    { choice_id: 'choice-a', text: 'Barglardan rasm yasash', effect_summary: '{{HERO}} Momiqqa barglardan rasm yasaydi.', resolution_goal: '{{HERO}} rasmni tugatadi.', tomorrow_seed: 'Momiq rasmni do‘stiga ko‘rsatadi.', choice_icon: '🎁', state_patch: patch('Rasm tayyor bo‘ldi.'), value_alignment: ['kindness'] },
    { choice_id: 'choice-b', text: 'Birgalikda qo‘shiq aytish', effect_summary: '{{HERO}} Momiqqa qo‘shiq aytadi.', resolution_goal: '{{HERO}} qo‘shiqni tugatadi.', tomorrow_seed: 'Momiq qo‘shiqni eslaydi.', choice_icon: '🎵', state_patch: patch('Qo‘shiq aytildi.'), value_alignment: ['friendship'] },
  ],
  state_patch: patch('Momiq sovg‘ani kutmoqda.'), next_episode_preview: 'Sovg‘a tayyorlash davom etadi.',
}
const errors = validateStoryBlueprint(context, blueprint)
assert.ok(!errors.includes('blueprint_choice_menu_scaffolding'), `C11 reproduction changed: direct menu overlap rejected: ${errors.join(',')}`)
console.log('CONFIRMED C11: Architect admits decision_point that directly repeats both structured choice labels')

console.log('Third-pass provider-free audit reproduced C10-C11; zero provider calls.')
