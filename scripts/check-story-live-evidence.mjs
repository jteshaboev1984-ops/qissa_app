import assert from 'node:assert/strict'
import { collectStoryLiveEvidence, requireUsableStoryResponse, selectActualStoryChoices } from './story-live-evidence.mjs'
import { applyChoiceToSeriesState, applyEpisodeToSeriesState, createInitialSeriesState } from '../src/lib/memoryAgent.ts'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { buildArchitectPrompts, enforceStoryBlueprintContextContract, validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'

// No network, no production credentials, no AI requests, no fabricated provider output.
const headers = new Headers({
  'X-QISSA-Generation-Source': 'safe-fallback',
  'X-QISSA-Fallback-Reason': 'generation-or-safety-failed',
  'X-QISSA-Generation-Failure-Class': 'validation',
  'X-QISSA-Generation-Failure-Trace': 'synthetic-validation:story_too_short[story_words=280]',
  'X-QISSA-Provider-Calls': '4',
  'X-QISSA-Generation-Repair': 'text-length',
  authorization: 'DO_NOT_RECORD',
  apikey: 'DO_NOT_RECORD',
})
const evidence = collectStoryLiveEvidence(headers)
assert.equal(evidence.metadata['x-qissa-generation-failure-class'], 'validation')
assert.match(evidence.metadata['x-qissa-generation-failure-trace'], /story_too_short/u)
assert.equal(evidence.metadata['x-qissa-provider-calls'], '4')
assert.equal(evidence.metadata['authorization'], undefined)
assert.equal(evidence.metadata['apikey'], undefined)
assert.deepEqual(evidence.diagnosticErrors, [])
assert.throws(() => requireUsableStoryResponse(evidence), /Expected openai-structured/u)
const missing = collectStoryLiveEvidence(new Headers({
  'x-qissa-generation-source': 'safe-fallback',
  'x-qissa-fallback-reason': 'generation-or-safety-failed',
}))
assert.equal(missing.diagnosticErrors.length, 2, 'Missing failure metadata must never be silently treated as sufficient evidence')
assert.throws(() => requireUsableStoryResponse(missing), /Missing required server diagnostic/u)
const approved = collectStoryLiveEvidence(new Headers({ 'x-qissa-generation-source': 'openai-structured' }))
assert.doesNotThrow(() => requireUsableStoryResponse(approved))
const off = collectStoryLiveEvidence(new Headers({ 'x-qissa-generation-source': 'safe-fallback', 'x-qissa-fallback-reason': 'runtime-disabled' }))
assert.deepEqual(off.diagnosticErrors, [], 'Deliberately disabled runtime is not a generation failure')
assert.throws(() => requireUsableStoryResponse(off), /safe-fallback/u)

const selections = { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' }
const basePatch = { last_event: 'Malika Tikan uchun qo‘shiq boshlamoqchi', new_friend: 'Tikan', hero_trait: null,
  open_arc: 'O‘rmon do‘stlari birga qo‘shiq aytishni o‘rganmoqda', relationship_updates: { 'tikan.with_hero': 'Tikan Malika bilan qo‘shiq aytadi' },
  canon_updates: { 'forest.song_circle': 'Eman tagida do‘stlar davrasi bor' } }
const choices = [
  { choice_id: 'choice_song_circle', text: 'Navbat bilan kuylash', effect_summary: 'Malika navbat bilan qo‘shiqni boshladi', resolution_text: 'Malika qo‘shiqni boshladi. Qanotcha, Baqa va Shirin navbat bilan qo‘shildi. Tikan ham kulib kuyladi.', tomorrow_seed: 'Kelajakda yangi qo‘shiq', state_patch: { last_event: 'Do‘stlar navbat bilan kuyladi', hero_trait: null, open_arc: basePatch.open_arc, relationship_updates: {}, canon_updates: { 'song.type': 'circle' } } },
  { choice_id: 'choice_song_echo', text: 'Aks-sado qo‘shig‘ini kuylash', effect_summary: 'Malika aks-sado qo‘shig‘ini boshladi', resolution_text: 'Malika qo‘shiqni boshladi. Qanotcha, Baqa va Shirin navbat bilan javob berdi. Tikan kulib kuyladi.', tomorrow_seed: 'Kelajakda yangi aks-sado', state_patch: { last_event: 'Do‘stlar aks-sado qo‘shig‘ini kuyladi', hero_trait: null, open_arc: basePatch.open_arc, relationship_updates: {}, canon_updates: { 'song.type': 'echo' } } },
]
const episode = { episode_id: 'ep-1-cozy_forest', state_patch: basePatch, choices }
const actualChoices = selectActualStoryChoices(episode)
assert.deepEqual(actualChoices.map((choice) => choice.choice_id), ['choice_song_circle', 'choice_song_echo'])
assert.throws(() => selectActualStoryChoices({ choices: [choices[0], choices[0]] }), /duplicate choice_id/u)
assert.throws(() => selectActualStoryChoices({ choices: [choices[0]] }), /exactly two/u)
const initial = createInitialSeriesState(selections)
const afterE1 = applyEpisodeToSeriesState(initial, episode)
assert.equal(afterE1.episodeCount, 1)
assert.equal(afterE1.canonState['forest.song_circle'], basePatch.canon_updates['forest.song_circle'])
const contexts = actualChoices.map((choice) => {
  const afterChoice = applyChoiceToSeriesState(afterE1, episode, choice)
  const context = normalizeStoryRequest({ selections, seriesState: afterChoice })
  assert.ok(context)
  assert.equal(context.episodeIndex, 2)
  assert.equal(context.heroName, 'Malika')
  assert.equal(context.choiceHistory.length, 1)
  assert.equal(context.choiceHistory[0].choice_id, choice.choice_id)
  assert.equal(context.choiceHistory[0].resolution_text, choice.resolution_text)
  assert.equal(context.canonState['forest.song_circle'], basePatch.canon_updates['forest.song_circle'])
  assert.equal(context.canonState['song.type'], choice.state_patch.canon_updates['song.type'])
  assert.ok(!context.choiceHistory.some((entry) => entry.choice_id !== choice.choice_id))
  const { user, system } = buildArchitectPrompts(context)
  const request = JSON.parse(user)
  assert.equal(request.segment, 2)
  assert.equal(request.confirmed_choice_bridge.resolution_text, choice.resolution_text)
  assert.equal(request.output_contract.choices, 'exactly 0')
  assert.match(system, /do not replay/iu)
  return context
})
assert.notEqual(contexts[0].canonState['song.type'], contexts[1].canonState['song.type'])

const mockE2Blueprint = {
  plan_version: 'split-v1', central_goal: 'Tikan bilan qo‘shiqni yakunlash', setting_anchor: 'Eman tagidagi maysazor',
  continuity_callbacks: ['Tikan qo‘shiq boshlangani uchun quvondi'],
  beats: ['Tikan yangi kuyga quloq tutdi', 'Do‘stlar mayin kuyni davom ettirdi', 'Tikan qo‘shiqni do‘stlari bilan kuyladi', 'Eman tagida kech sokin yakunlandi'],
  decision_point: '', choices: [], next_episode_preview: '',
  state_patch: { last_event: '{{HERO}} do‘stlari bilan qo‘shiqni yakunladi', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] },
}
for (const context of contexts) {
  const blueprint = enforceStoryBlueprintContextContract(context, mockE2Blueprint)
  assert.deepEqual(validateStoryBlueprint(context, blueprint), [], 'A structurally valid E2 blueprint must be possible for either independently remembered choice')
}
console.log('Provider-free live evidence and dual-choice E2 context regression PASS; zero AI requests.')
