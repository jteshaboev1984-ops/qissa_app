import assert from 'node:assert/strict'
import fs from 'node:fs'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { repairBlueprintDecisionPoint, validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'

const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'decision-repair-series', sessionId: 'decision-repair-session', sessionIndex: 1, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
assert.ok(context && context.episodeIndex === 1)
const patch = (last_event) => ({ last_event, new_friend: null, hero_trait: null, open_arc: 'Momiqning sovg‘asi', relationship_updates: [], canon_updates: [] })
const blueprint = {
  plan_version: 'split-v1', central_goal: 'Momiq uchun sovg‘a tayyorlash', setting_anchor: 'shinam o‘rmon', continuity_callbacks: [],
  beats: ['{{HERO}} Momiq bilan gaplashadi', 'Momiq bir narsani ko‘rsatadi', '{{HERO}} fikrni tinglaydi', 'Momiq javobni kutadi'],
  decision_point: 'Barglardan rasm yasash mumkin yoki birgalikda qo‘shiq aytish mumkin?',
  choices: [
    { choice_id: 'choice-a', text: 'Barglardan rasm yasash', effect_summary: '{{HERO}} Momiqqa barglardan rasm yasaydi.', resolution_goal: '{{HERO}} rasmni tugatadi.', tomorrow_seed: 'Momiq rasmni do‘stiga ko‘rsatadi.', choice_icon: '🎁', state_patch: patch('Rasm tayyor bo‘ldi.'), value_alignment: ['kindness'] },
    { choice_id: 'choice-b', text: 'Birgalikda qo‘shiq aytish', effect_summary: '{{HERO}} Momiqqa qo‘shiq aytadi.', resolution_goal: '{{HERO}} qo‘shiqni tugatadi.', tomorrow_seed: 'Momiq qo‘shiqni eslaydi.', choice_icon: '🎵', state_patch: patch('Qo‘shiq aytildi.'), value_alignment: ['friendship'] },
  ],
  state_patch: patch('Momiq sovg‘ani kutmoqda.'), next_episode_preview: 'Sovg‘a tayyorlash davom etadi.',
}

const menuErrors = validateStoryBlueprint(context, blueprint)
assert.ok(menuErrors.includes('blueprint_choice_menu_meta_phrasing') || menuErrors.includes('blueprint_choice_menu_repeats_cards'))
const repaired = repairBlueprintDecisionPoint(context, blueprint, menuErrors)
assert.equal(repaired.repaired, true)
assert.deepEqual(validateStoryBlueprint(context, repaired.blueprint), [])
assert.equal(repaired.blueprint.decision_point, '{{HERO}} endi nima qiladi?')
assert.deepEqual(repaired.blueprint.choices, blueprint.choices, 'repair must not touch structured choices')
assert.deepEqual(repaired.blueprint.beats, blueprint.beats, 'repair must not touch plot beats')
assert.deepEqual(repaired.blueprint.state_patch, blueprint.state_patch, 'repair must not touch memory state')

const unrelatedInvalid = structuredClone(blueprint)
unrelatedInvalid.central_goal = 'x'
const unrelatedErrors = validateStoryBlueprint(context, unrelatedInvalid)
const blocked = repairBlueprintDecisionPoint(context, unrelatedInvalid, unrelatedErrors)
assert.equal(blocked.repaired, false, 'never repair when a non-choice-menu blueprint defect is present')
assert.equal(blocked.blueprint.decision_point, unrelatedInvalid.decision_point)

const episode2 = { ...context, episodeIndex: 2 }
const episode2Attempt = repairBlueprintDecisionPoint(episode2, blueprint, menuErrors)
assert.equal(episode2Attempt.repaired, false, 'Episode 2 has no decision-point repair path')

for (const [language, expected] of [['ru', 'Что {{HERO}} сделает дальше?'], ['kz', '{{HERO}} енді не істейді?']]) {
  const localizedContext = { ...context, language }
  const localized = repairBlueprintDecisionPoint(localizedContext, blueprint, ['blueprint_choice_menu_repeats_cards'])
  assert.equal(localized.repaired, true)
  assert.equal(localized.blueprint.decision_point, expected)
}

const orchestrator = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
assert.ok(orchestrator.includes('repairBlueprintDecisionPoint(context, blueprint, blueprintErrors)'), 'orchestrator must apply the local repair before blueprint fallback')
assert.ok(orchestrator.includes("'X-QISSA-Blueprint-Decision-Repair': blueprintDecisionPointRepaired ? 'template' : 'none'"), 'repair outcome must be observable')

console.log('Blueprint decision-point deterministic repair contract PASS: only isolated E1 choice-menu defects receive a localized neutral question; plot, choices and state remain immutable; orchestration is wired before fallback; zero provider/HTTP/database calls.')
