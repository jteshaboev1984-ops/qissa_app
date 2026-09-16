import assert from 'node:assert/strict'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { buildTextLengthRepairPrompts, buildTextLengthRepairOutputSchema } from '../supabase/functions/story-generate/prompt.ts'
import { textRepairRequiresFullStoryRewrite } from '../supabase/functions/story-generate/repair-routing.ts'
import { validateCandidate } from '../supabase/functions/story-generate/safety.ts'
import { narrationToCandidate, validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'

// Entirely offline. No keys, HTTP, database or model calls. A failing assertion means
// the Architect/Narrator/Repair/final-validator contract has regressed.
const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'cross-layer-series', sessionId: 'cross-layer-session', sessionIndex: 1, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
assert.ok(context && context.episodeIndex === 1)
const patch = (last_event) => ({ last_event, new_friend: null, hero_trait: null, open_arc: 'Momiqning sovg‘asi', relationship_updates: [], canon_updates: [] })
const blueprint = {
  plan_version: 'split-v1', central_goal: 'Momiq uchun sovg‘a tayyorlash', setting_anchor: 'shinam o‘rmon', continuity_callbacks: [],
  beats: ['{{HERO}} Momiq bilan gaplashadi', 'Momiq bir narsani ko‘rsatadi', '{{HERO}} fikrni tinglaydi', 'Momiq javobni kutadi'],
  decision_point: 'Qaysi sovg‘ani tayyorlaymiz?',
  choices: [
    { choice_id: 'choice-a', text: 'Barglardan rasm yasash', effect_summary: '{{HERO}} Momiqqa barglardan rasm yasaydi.', resolution_goal: '{{HERO}} rasmni tugatadi.', tomorrow_seed: 'Momiq rasmni do‘stiga ko‘rsatadi.', choice_icon: '🎁', state_patch: patch('Rasm tayyor bo‘ldi.'), value_alignment: ['kindness'] },
    { choice_id: 'choice-b', text: 'Birgalikda qo‘shiq aytish', effect_summary: '{{HERO}} Momiqqa qo‘shiq aytadi.', resolution_goal: '{{HERO}} qo‘shiqni tugatadi.', tomorrow_seed: 'Momiq qo‘shiqni eslaydi.', choice_icon: '🎵', state_patch: patch('Qo‘shiq aytildi.'), value_alignment: ['friendship'] },
  ],
  state_patch: patch('Momiq sovg‘ani kutmoqda.'), next_episode_preview: 'Sovg‘a tayyorlash davom etadi.',
}
assert.deepEqual(validateStoryBlueprint(context, blueprint), [], 'valid upstream fixture')
const narration = {
  title: 'Momiqning sovg‘asi', story_text: '{{HERO}} do‘sti Momiqqa sovg‘a tayyorladi.', vocabulary: [],
  choice_resolutions: [
    { choice_id: 'choice-a', resolution_text: 'Birinchi tanlovning natijasi aniq.' },
    { choice_id: 'choice-b', resolution_text: 'Ikkinchi tanlovning natijasi aniq.' },
  ],
}
const candidate = narrationToCandidate(context, blueprint, narration)

// C1: schema, routing, system instruction and repair_plan must agree on all paths.
for (const errors of [
  ['story_choice_menu_scaffolding'], ['invalid_title'], ['story_language_mismatch'],
  ['story_too_short', 'choice_resolution_too_short', 'story_choice_menu_scaffolding'],
  ['story_too_short', 'uzbek_child_language_requires_rewrite'],
]) {
  assert.equal(textRepairRequiresFullStoryRewrite(context, errors), true)
  const schema = buildTextLengthRepairOutputSchema(context, errors)
  const prompt = buildTextLengthRepairPrompts(context, candidate, errors)
  assert.equal(schema.properties.story_rewrite.type, 'string')
  assert.equal(schema.properties.story_expansion.type, 'null')
  assert.ok(prompt.system.includes('full-story rewrite takes precedence'), `C1 missing full rewrite precedence: ${errors}`)
  assert.ok(!prompt.system.includes('If there is no story length or Episode 2 bedtime-coda failure, return both story_rewrite and story_expansion as null.'), `C1 contradictory null instruction: ${errors}`)
  const plan = JSON.parse(prompt.user).repair_plan
  assert.ok(plan.story_rewrite && plan.story_expansion === null, `C1 inconsistent repair_plan: ${errors}`)
}
const lengthOnly = ['story_too_short']
assert.equal(textRepairRequiresFullStoryRewrite(context, lengthOnly), false)
assert.equal(buildTextLengthRepairOutputSchema(context, lengthOnly).properties.story_expansion.type, 'string')
assert.ok(JSON.parse(buildTextLengthRepairPrompts(context, candidate, lengthOnly).user).repair_plan.story_expansion)

// C2: reject unrepairable Architect-owned defects BEFORE invoking a paid Narrator.
for (const [name, mutate, expected] of [
  ['seed', b => { b.choices[0].tomorrow_seed = 'Bor.' }, 'invalid_blueprint_tomorrow_seed'],
  ['icon', b => { b.choices[0].choice_icon = ' ' }, 'invalid_blueprint_choice_icon'],
  ['alignment', b => { b.choices[0].value_alignment = [] }, 'invalid_blueprint_value_alignment'],
]) {
  const bad = structuredClone(blueprint)
  mutate(bad)
  assert.ok(validateStoryBlueprint(context, bad).includes(expected), `C2 Architect admitted invalid ${name}`)
}

// C3: each blueprint choice must have exactly one Narrator bridge with its own ID.
for (const rows of [
  [...narration.choice_resolutions, { choice_id: 'choice-b', resolution_text: 'Duplicate.' }],
  [narration.choice_resolutions[0]],
  [narration.choice_resolutions[0], { choice_id: 'unknown', resolution_text: 'Wrong branch.' }],
]) {
  assert.throws(() => narrationToCandidate(context, blueprint, { ...narration, choice_resolutions: rows }), /narration_resolution_contract_mismatch/u, 'C3 ambiguous resolution mapping')
}
assert.equal(narrationToCandidate(context, blueprint, narration).choices[1].resolution_text, narration.choice_resolutions[1].resolution_text)

// C4: upstream rejects its own choice-menu scaffolding; neutral question stays allowed.
const badMenu = structuredClone(blueprint)
badMenu.decision_point = 'Buni qilish mumkin, yoki boshqacha qilish mumkin?'
assert.ok(validateStoryBlueprint(context, badMenu).includes('blueprint_choice_menu_scaffolding'), 'C4 immutable menu evades Architect')
assert.deepEqual(validateStoryBlueprint(context, blueprint), [], 'C4 neutral decision falsely rejected')

// C5: malformed preview returns structured validation errors, never throws.
for (const preview of [null, undefined, 123]) {
  const invalid = structuredClone(candidate)
  invalid.nextEpisodePreview = preview
  assert.ok(validateCandidate(context, invalid).includes('invalid_preview'), 'C5 malformed preview not classified')
}
console.log('Cross-layer story contracts GREEN: C1–C5, standalone/mixed repair, insertion, pre-Narrator validation, exact bridge IDs, neutral decision and malformed preview; zero provider calls.')
