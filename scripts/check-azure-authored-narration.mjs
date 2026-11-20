import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { build } from 'esbuild'

const result = await build({
  entryPoints: ['src/features/authoredStory/authoredAudioPlan.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  target: 'node24',
  logLevel: 'silent',
})
const moduleUrl = 'data:text/javascript;base64,' +
  Buffer.from(result.outputFiles[0].contents).toString('base64')
const { buildAuthoredAudioPlan, chunkNarrationText, nextAuthoredAudioSegment } = await import(moduleUrl)
const approved = JSON.parse(readFileSync('src/data/authored/prazdnikMuzhestvaV3.ru.json', 'utf8'))

const decisionIndex = approved.parts.findIndex((p) => p.decision)
assert.ok(decisionIndex >= 0, 'approved fixture needs a choice')
const part = approved.parts[decisionIndex]
const progress = {
  story_id: approved.story_id,
  story_version: approved.story_version,
  current_part_index: decisionIndex,
  selected_choices: {},
  shown_resolution_decisions: [],
  choice_history: [],
  memory: { lastEvent: '', canonState: {}, relationshipState: {} },
  completed: false,
  updated_at: '2026-11-20T00:00:00Z',
}
const waiting = buildAuthoredAudioPlan(approved, progress)
assert.equal(waiting.pauseForChoice, true)
assert.ok(waiting.segments.length > 0)
assert.ok(waiting.segments.every((x) => x.phase === 'before_choice'))
assert.ok(waiting.segments.every((x) => x.text.length <= 2500))
assert.equal(nextAuthoredAudioSegment(waiting, waiting.segments.at(-1).segmentId), null)

const [a, b] = part.decision.choices
const selected = (choiceId) => buildAuthoredAudioPlan(approved, {
  ...progress,
  selected_choices: { [part.decision.decision_id]: choiceId },
  shown_resolution_decisions: [part.decision.decision_id],
})
const planA = selected(a.choice_id)
const planB = selected(b.choice_id)
for (const plan of [planA, planB]) {
  assert.equal(plan.pauseForChoice, false)
  assert.ok(plan.segments.every((x) => x.text.length <= 2500))
  assert.equal(plan.segments.filter((x) => x.phase === 'choice_resolution').length > 0, true)
  assert.deepEqual(
    plan.segments.filter((x) => x.phase === 'before_choice').map((x) => x.text),
    waiting.segments.map((x) => x.text),
  )
}
assert.notDeepEqual(
  planA.segments.filter((x) => x.phase === 'choice_resolution').map((x) => x.text),
  planB.segments.filter((x) => x.phase === 'choice_resolution').map((x) => x.text),
)
const firstAfterChoice = nextAuthoredAudioSegment(planA, waiting.segments.at(-1).segmentId)
assert.equal(firstAfterChoice.segmentId, planA.nextSegmentAfterChoice)
assert.equal(firstAfterChoice.choiceId, a.choice_id)
assert.ok(planA.segments.every((x) => x.choiceId !== b.choice_id))
assert.ok(planB.segments.every((x) => x.choiceId !== a.choice_id))

// Simulate inherited E5 choice markers without mutating locked literary source.
const firstParagraph = part.story_text.split(/\n\n+/).map((x) => x.trim()).find(Boolean)
const variant = structuredClone(approved)
variant.parts[decisionIndex].conditional_segments = [
  {
    segment_id: 'test-e5-forest', phase: 'story_text', after_text: firstParagraph,
    when: { decision_id: 'e5-route', choice_id: 'forest' },
    text: 'FOREST ROUTE ONLY',
  },
  {
    segment_id: 'test-e5-plateau', phase: 'story_text', after_text: firstParagraph,
    when: { decision_id: 'e5-route', choice_id: 'plateau' },
    text: 'PLATEAU ROUTE ONLY',
  },
]
const inherited = (route) => buildAuthoredAudioPlan(variant, {
  ...progress,
  selected_choices: { 'e5-route': route },
})
const forest = inherited('forest')
const plateau = inherited('plateau')
const forestText = forest.segments.map((s) => s.text).join('\n')
const plateauText = plateau.segments.map((s) => s.text).join('\n')
assert.ok(forestText.includes('FOREST ROUTE ONLY'))
assert.ok(!forestText.includes('PLATEAU ROUTE ONLY'))
assert.ok(plateauText.includes('PLATEAU ROUTE ONLY'))
assert.ok(!plateauText.includes('FOREST ROUTE ONLY'))
assert.notEqual(forest.segments[0].segmentId, plateau.segments[0].segmentId)

// Breaking long prose into bounded API calls preserves all words in order.
const original = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(' ')
const chunks = chunkNarrationText(original)
assert.ok(chunks.length > 2)
assert.ok(chunks.every((x) => x.length <= 2500))
assert.equal(chunks.join(' ').replace(/\s+/g, ' '), original)

assert.throws(() => buildAuthoredAudioPlan(approved, { ...progress, story_version: 'other' }))
console.log('Authored RU choice, inherited variant, no-replay and chunk tests passed (provider-free).')
