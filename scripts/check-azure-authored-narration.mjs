import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const transpile = (path) => ts.transpileModule(readFileSync(path, 'utf8'), {
  fileName: path,
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const engineUrl = 'data:text/javascript;base64,' + Buffer.from(
  transpile('src/features/authoredStory/engine.ts'),
).toString('base64')
const plannerJs = transpile('src/features/authoredStory/authoredAudioPlan.ts')
  .replace(/from ['"]\.\/engine['"]/, `from '${engineUrl}'`)
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(plannerJs).toString('base64')
const { buildAuthoredAudioPlan, chunkNarrationText, nextAuthoredAudioSegment } = await import(moduleUrl)
const manifestJs = transpile('src/features/authoredStory/audioManifest.ts')
  .replace(/from ['"]\.\/authoredAudioPlan['"]/, `from '${moduleUrl}'`)
const manifestUrl = 'data:text/javascript;base64,' + Buffer.from(manifestJs).toString('base64')
const { compileDraftAuthoredAudioManifest } = await import(manifestUrl)
const approved = JSON.parse(readFileSync('src/data/authored/prazdnikMuzhestvaV3.ru.json', 'utf8'))
const rawManifest = compileDraftAuthoredAudioManifest(approved)
assert.equal(rawManifest.isApproved, false)
assert.equal(rawManifest.isPublished, false)
assert.ok(rawManifest.scenariosChecked >= approved.parts.length)
assert.ok(rawManifest.segments.length > 0)
assert.ok(rawManifest.segments.every((s) => s.text.length <= 2500))
for (const part of approved.parts.filter((p) => p.decision)) {
  for (const choice of part.decision.choices) {
    assert.ok(rawManifest.segments.some((item) =>
      item.partId === part.part_id && item.choiceId === choice.choice_id &&
      item.phase === 'choice_resolution'))
  }
}


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
variant.external_choice_context = [{
  decision_id: 'e5-route', allowed_choice_ids: ['forest', 'plateau'],
  source_story_id: 'earlier-story', source_story_version: 'approved-version',
}]
const draftVariantManifest = compileDraftAuthoredAudioManifest(variant)
assert.equal(draftVariantManifest.isApproved, false)
assert.equal(draftVariantManifest.isPublished, false)
assert.ok(draftVariantManifest.segments.some((s) => s.text.includes('FOREST ROUTE ONLY')))
assert.ok(draftVariantManifest.segments.some((s) => s.text.includes('PLATEAU ROUTE ONLY')))
const noContext = structuredClone(variant)
delete noContext.external_choice_context
assert.throws(() => compileDraftAuthoredAudioManifest(noContext), /Unknown inherited decision/)
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
console.log('Authored RU choice, inherited variants, manifest enumeration, no-replay and chunk tests passed (provider-free).')
