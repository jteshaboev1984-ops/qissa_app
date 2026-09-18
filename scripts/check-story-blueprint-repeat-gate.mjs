import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { buildArchitectPrompts, buildNarratorPrompts, validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'

// Only structural synthetic cases. Repeated meaning in paraphrases and literary quality require human review.
// No provider, DB, user story, credentials or paid call.
const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'synthetic-v104-repeat-gate', sessionId: 'synthetic-v104-session', sessionIndex: 1, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
assert.ok(context && context.episodeIndex === 1)
const patch = (event) => ({ last_event: event, new_friend: null, hero_trait: null, open_arc: 'Xatning siri', relationship_updates: [], canon_updates: [] })
const blueprint = {
  plan_version: 'split-v1', central_goal: 'Xatning sirini tushunish', setting_anchor: 'o‘rmon chetidagi daraxt', continuity_callbacks: [],
  beats: [
    '{{HERO}} daraxt tagida kichkina xat topadi.',
    '{{HERO}} xatdagi belgi haqida olmaxondan so‘raydi.',
    'Olmaxon boshqa daraxtda ham shu belgini ko‘rsatadi.',
    '{{HERO}} ikkinchi belgining ostidagi yangi yozuvni payqaydi.',
    '{{HERO}} xatning sirini ochish uchun yangi yo‘l tanlamoqchi.',
  ],
  decision_point: '{{HERO}} endi nima qiladi?',
  choices: [
    { choice_id: 'a', text: 'Yozuvni o‘qib ko‘rish', effect_summary: '{{HERO}} yozuvni diqqat bilan o‘qiydi.', resolution_goal: '{{HERO}} yozuvdagi sirning bir qismini tushunadi.', tomorrow_seed: 'Xatdagi sir esda qoladi.', choice_icon: '✉️', state_patch: patch('Yozuvdagi ma’no topildi.'), value_alignment: ['curiosity'] },
    { choice_id: 'b', text: 'Olmaxondan yordam so‘rash', effect_summary: '{{HERO}} olmaxondan belgini tushuntirishni so‘raydi.', resolution_goal: '{{HERO}} olmaxon ko‘rsatgan belgini tushunadi.', tomorrow_seed: 'Olmaxonning yordami esda qoladi.', choice_icon: '🐿️', state_patch: patch('Olmaxon belgini tushuntirdi.'), value_alignment: ['mutual_help'] },
  ],
  state_patch: patch('Xatning sirini ochish kerak.'), next_episode_preview: 'Daraxtdagi eski xatning siri ochiladi.',
}
const base = validateStoryBlueprint(context, blueprint)
assert.deepEqual(base, [], `valid baseline fixture: ${base.join(',')}`)
for (const replacement of [
  blueprint.beats[1],
  `  ${blueprint.beats[1].replace('.', '!').toLocaleUpperCase('en-US')}  `,
]) {
  const broken = structuredClone(blueprint)
  broken.beats[3] = replacement
  assert.ok(validateStoryBlueprint(context, broken).includes('blueprint_duplicate_beat'), 'exact or punctuation/case variant of whole beat must fail E1')
}
const changed = structuredClone(blueprint)
changed.beats[3] = '{{HERO}} ikkinchi belgidan xatning egasi haqida yangi ma’lumot oladi.'
assert.ok(!validateStoryBlueprint(context, changed).includes('blueprint_duplicate_beat'), 'same clue with a new consequence may recur')
const e2 = { ...context, episodeIndex: 2 }
const e2Errors = validateStoryBlueprint(e2, { ...blueprint, beats: [blueprint.beats[0], blueprint.beats[0], ...blueprint.beats.slice(2)], choices: [], decision_point: '', next_episode_preview: '' })
assert.ok(!e2Errors.includes('blueprint_duplicate_beat'), 'scope duplicate gate to E1; no E2 contract drift')
const architecture = buildArchitectPrompts(context).system
const narration = buildNarratorPrompts(context, blueprint).system
assert.ok(architecture.includes('warm, non-threatening mystery'), 'allow mystery as a child-scale goal')
assert.ok(architecture.includes('do not default to a shy singer'), 'avoid the v102/v103 unrequested default trope')
assert.ok(narration.includes('one active companion'), 'remove contradictory 2–3 mandatory cast from Narrator')
assert.ok(!narration.includes('2-3 memorable living forest characters'), 'old cast quota must be gone')
const source = readFileSync('supabase/functions/story-generate/story-architecture.ts', 'utf8')
assert.ok(source.includes("errors.push('blueprint_duplicate_beat')"), 'runtime blueprint validator must use the gate')
console.log('V104 synthetic exact duplicate beat gate and coherent forest cast/mystery guidance PASS; no semantic-quality claim, HTTP or cost.')
