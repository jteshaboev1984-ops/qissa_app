import assert from 'node:assert/strict'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { buildTextLengthRepairPrompts, buildTextLengthRepairOutputSchema } from '../supabase/functions/story-generate/prompt.ts'
import { textRepairRequiresFullStoryRewrite } from '../supabase/functions/story-generate/repair-routing.ts'
import { validateCandidate } from '../supabase/functions/story-generate/safety.ts'
import { narrationToCandidate, validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'

// DIAGNOSTIC only. This script proves existing defects; its PASS is NOT a product PASS.
// Never invoke fetch(), story-generate, a model, or a Supabase database from this test.
const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'synthetic-audit-series', sessionId: 'synthetic-audit-session', sessionIndex: 1, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
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
const baselineErrors = validateStoryBlueprint(context, blueprint)
assert.deepEqual(baselineErrors, [], `Audit fixture must be valid: ${baselineErrors.join(',')}`)
const narration = {
  title: 'Momiqning sovg‘asi', story_text: '{{HERO}} do‘sti Momiqqa sovg‘a tayyorladi.', vocabulary: [],
  choice_resolutions: [
    { choice_id: 'choice-a', resolution_text: 'Birinchi tanlovning natijasi aniq.' },
    { choice_id: 'choice-b', resolution_text: 'Ikkinchi tanlovning natijasi aniq.' },
  ],
}
const candidate = narrationToCandidate(context, blueprint, narration)
const confirmed = []
const record = (label, condition) => { assert.ok(condition, `${label}: source no longer reproduces; update audit expectations`); confirmed.push(label); console.log(`CONFIRMED SOURCE DEFECT: ${label}`) }

// #1: a full story rewrite is demanded by routing+JSON but contradicted by the prompt.
for (const error of ['story_choice_menu_scaffolding', 'invalid_title', 'story_language_mismatch']) {
  const errors = [error]
  const schema = buildTextLengthRepairOutputSchema(context, errors)
  const prompt = buildTextLengthRepairPrompts(context, candidate, errors)
  record(`full-rewrite-null contradiction on ${error}`,
    textRepairRequiresFullStoryRewrite(context, errors) &&
    schema.properties.story_rewrite.type === 'string' &&
    prompt.system.includes('If there is no story length or Episode 2 bedtime-coda failure, return both story_rewrite and story_expansion as null.'))
}

// #2: output fields owned by Architect are admitted, then fail final candidate checks.
for (const [label, mutate, expectedError] of [
  ['short tomorrow_seed', b => { b.choices[0].tomorrow_seed = 'Bor.' }, 'invalid_tomorrow_seed'],
  ['blank choice_icon', b => { b.choices[0].choice_icon = ' ' }, 'invalid_choice_icon'],
  ['empty value_alignment', b => { b.choices[0].value_alignment = [] }, 'invalid_value_alignment'],
]) {
  const mutated = structuredClone(blueprint)
  mutate(mutated)
  const architectErrors = validateStoryBlueprint(context, mutated)
  const finalErrors = validateCandidate(context, narrationToCandidate(context, mutated, narration))
  record(`Architect/final validator mismatch: ${label}`, architectErrors.length === 0 && finalErrors.includes(expectedError))
}

// #3: Narrator sends duplicate branch IDs. Mapping silently accepts the last duplicate.
const extraNarration = structuredClone(narration)
extraNarration.choice_resolutions.push({ choice_id: 'choice-b', resolution_text: 'DUPLICATE OVERRIDES THE ORIGINAL.' })
const duplicateResult = narrationToCandidate(context, blueprint, extraNarration)
record('Narrator duplicate resolution silently replaces previous result', duplicateResult.choices[1].resolution_text === 'DUPLICATE OVERRIDES THE ORIGINAL.')

// #4: E1 blueprint decision_point can already contain forbidden option-menu scaffolding.
const menuBlueprint = structuredClone(blueprint)
menuBlueprint.decision_point = 'Buni qilish mumkin, yoki boshqacha qilish mumkin?'
record('Architect accepts choice-menu scaffolding in immutable decision_point', validateStoryBlueprint(context, menuBlueprint).length === 0)

// #5: malformed non-string preview is classified but throws before returning errors.
const previewCandidate = structuredClone(candidate)
previewCandidate.nextEpisodePreview = null
record('Candidate validator throws on malformed preview instead of returning invalid_preview', (() => {
  try { validateCandidate(context, previewCandidate); return false } catch (error) { return error instanceof TypeError }
})())

assert.equal(confirmed.length, 9)
console.log('PROVIDER-FREE AUDIT COMPLETE: 9 source-level reproductions across 5 defect classes; NOT a fix, NOT beta GO, zero paid calls.')
