import assert from 'node:assert/strict'
import { auditSyntheticStages } from './audit-story-synthetic-stages.mjs'

// All fixture content is synthetic. No child/production data, network, provider, DB or logs.
const patch = { last_event: 'Hikoya davom etadi.', new_friend: null }
const blueprint = {
  beats: ['Malika xatni topdi.', 'Malika kalitni ko‘rdi.', 'Malika belgini topdi.', 'Malika javobni kutdi.'],
  choices: [
    { effect_summary: '{{HERO}} belgini o‘qiydi.', resolution_goal: '{{HERO}} yozuvni tushunadi.', state_patch: patch },
    { effect_summary: '{{HERO}} yordam so‘raydi.', resolution_goal: '{{HERO}} do‘sti bilan sirni ochadi.', state_patch: patch },
  ],
}
const makeCandidate = (words) => ({ title: 'Secret fixture title never logged', story_text: Array(words).fill('sun’iy').join(' ') })
const fixture = { schema: 1, stages: [
  { stage: 'architect_raw', data: blueprint },
  { stage: 'architect_validation', data: { blueprint, errors: [] } },
  { stage: 'narrator_initial', data: makeCandidate(284) },
  { stage: 'narrator_validation', data: { errors: ['story_too_short'] } },
  { stage: 'repair_first', data: makeCandidate(359) },
], outcome: { source: 'openai-structured' } }
const result = auditSyntheticStages(fixture)
assert.equal(result.narration.initial.story_words, 284)
assert.equal(result.narration.final.story_words, 359)
assert.equal(result.narration.word_delta, 75)
assert.equal(result.architect.exact_repeated_beats, 0)
assert.equal(result.architect.identical_choice_resolution_goals, false)
assert.deepEqual(result.warnings, ['initial_story_under_320_words'])
assert.equal(result.root_cause_identified, false)
assert.equal(result.literary_quality_verified, false)
assert.ok(!JSON.stringify(result).includes('Secret fixture title'))
assert.ok(!JSON.stringify(result).includes('sun’iy'))
const repeated = structuredClone(fixture)
repeated.stages[0].data.beats[2] = 'MALIKA XATNI TOPDI!'
repeated.stages[1].data.blueprint.beats[2] = 'MALIKA XATNI TOPDI!'
repeated.stages[1].data.blueprint.choices[1].resolution_goal = repeated.stages[1].data.blueprint.choices[0].resolution_goal
const duplicateResult = auditSyntheticStages(repeated)
assert.equal(duplicateResult.architect.exact_repeated_beats, 1)
assert.equal(duplicateResult.architect.identical_choice_resolution_goals, true)
assert.ok(duplicateResult.warnings.includes('exact_repeated_plan_beats_review'))
assert.ok(duplicateResult.warnings.includes('same_normalized_choice_outcome_review'))
const noRepair = structuredClone(fixture)
noRepair.stages = noRepair.stages.filter((stage) => stage.stage !== 'repair_first')
assert.equal(auditSyntheticStages(noRepair).narration.final_stage, 'narrator_initial')
const missing = { schema: 1, stages: [{ stage: 'architect_raw', data: blueprint }] }
assert.ok(auditSyntheticStages(missing).warnings.includes('stage_missing_narrator_initial'))
assert.throws(() => auditSyntheticStages({ schema: 2, stages: [] }))
assert.throws(() => auditSyntheticStages({ schema: 1, stages: [{ stage: 'unexpected', data: {} }] }))
assert.throws(() => auditSyntheticStages({ schema: 1, stages: [fixture.stages[0], fixture.stages[0]] }))
console.log('Provider-free synthetic stage audit regression PASS: distinct stages, original-vs-repair word metrics, exact duplicate indicators, missing-stage provenance, no raw text in report; no quality claim.')
