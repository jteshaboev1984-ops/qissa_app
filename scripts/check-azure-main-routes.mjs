/**
 * Provider-free release-blocker test of the REAL approved-source-compatible
 * RU/UZ Season 2 E6/E7 source packages from main (read-only checkout).
 *
 * Invoke from the PR branch:
 *   node scripts/check-azure-main-routes.mjs .qissa-main-fixtures
 *
 * Git blob pins prevent a moving "main" from changing our test silently.
 * No story text, temporary sources, audio or family data is uploaded.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const fixtureRoot = process.argv[2]
if (!fixtureRoot || fixtureRoot.startsWith('-')) {
  throw new Error('Usage: check-azure-main-routes.mjs <read-only-main-checkout>')
}
const sourceFiles = {
  readingLayout: ['src/data/sevenRoadsReadingSeries.ts', '05385936d2525362d47224043aee2b8d9fa2a648'],
  localizer: ['src/features/authoredStory/localizePackage.ts', 'd0e256d9e1523fbd6022f12a6d960893ece5909d'],
  e6ru: ['src/data/authored/staging/season2Story6TwoReinforcements.ru.json', '3130df982b8f64ad756ef5e60c2794c066463ebf'],
  e6uz: ['src/data/authored/staging/season2Story6TwoReinforcements.uz.json', '70b48c7d84a2a63e0dba6977eb5fa98e9342fd22'],
  e7ru: ['src/data/authored/staging/season2Story7BackToOrdan.ru.json', 'e5fde8ac773375a334ffab1c80fe621967674a3a'],
  e7uz: ['src/data/authored/staging/season2Story7BackToOrdan.uz.json', '67101f138790269f3929f0c2ad3c4cd218242651'],
}
const actualSources = {}
for (const [key, [filePath, expectedSha]] of Object.entries(sourceFiles)) {
  const bytes = readFileSync(join(fixtureRoot, filePath))
  const computed = createHash('sha1')
    .update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
  assert.equal(computed, expectedSha,
    `${filePath} changed in main: recheck canon and update blob pin intentionally`)
  actualSources[key] = bytes.toString('utf8')
}

const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const dataUrl = (code) => 'data:text/javascript;base64,' +
  Buffer.from(code).toString('base64')
const engineUrl = dataUrl(transpile(readFileSync('src/features/authoredStory/engine.ts', 'utf8')))
const plannerUrl = dataUrl(
  transpile(readFileSync('src/features/authoredStory/authoredAudioPlan.ts', 'utf8'))
    .replace(/from ['"]\.\/engine['"]/, `from '${engineUrl}'`),
)
const manifestUrl = dataUrl(
  transpile(readFileSync('src/features/authoredStory/audioManifest.ts', 'utf8'))
    .replace(/from ['"]\.\/authoredAudioPlan['"]/, `from '${plannerUrl}'`),
)
const { localizeAuthoredStoryPackage } = await import(dataUrl(transpile(actualSources.localizer)))
const { withReadingSeries } = await import(dataUrl(transpile(actualSources.readingLayout)))
const { buildAuthoredAudioPlan, nextAuthoredAudioSegment } = await import(plannerUrl)
const { compileDraftAuthoredAudioManifest } = await import(manifestUrl)

const e6base = JSON.parse(actualSources.e6ru)
const e7base = JSON.parse(actualSources.e7ru)
const sources = [
  { ep: 6, lang: 'ru', original: e6base },
  { ep: 6, lang: 'uz', original: localizeAuthoredStoryPackage(e6base, JSON.parse(actualSources.e6uz)) },
  { ep: 7, lang: 'ru', original: e7base },
  { ep: 7, lang: 'uz', original: localizeAuthoredStoryPackage(e7base, JSON.parse(actualSources.e7uz)) },
].map(({ ep, lang, original }) => ({
  ep, lang, original,
  story: withReadingSeries(original, ep === 6 ? 'reinforcements' : 'ordan', ep === 6 ? 6 : 8).story,
}))
const progressFor = (story, index, chosen) => ({
  story_id: story.story_id,
  story_version: story.story_version,
  current_part_index: index,
  selected_choices: chosen,
  shown_resolution_decisions: [],
  choice_history: [], completed: false,
  memory: { lastEvent: '', canonState: {}, relationshipState: {} },
  updated_at: '2026-11-20T00:00:00.000Z',
})
const flatten = (segments) => segments.map((x) => x.text).join('\n\n').replace(/\s+/g, ' ').trim()
let verifiedPaths = 0
const counts = {}
for (const { ep, lang, original, story } of sources) {
  assert.equal(story.language, lang)
  assert.equal(story.reader_layout?.version, 'series-30-v1')
  assert.equal(story.parts.length, ep === 6 ? 3 : 2)
  assert.equal(story.parts.length, story.reader_layout.source_part_by_part.length)
  assert.equal(story.parts.filter((part) => part.decision).length, 1)
  const partIndex = story.parts.findIndex((part) => part.decision)
  const choicePart = story.parts[partIndex]
  const ownDecisionId = choicePart.decision.decision_id
  const [choiceA, choiceB] = choicePart.decision.choices
  const inherited = ep === 6 ? story.external_choice_context?.[0] : null
  if (ep === 6) {
    assert.equal(inherited?.decision_id, 'story5_choice_1_road_post_approach')
    assert.equal(inherited.allowed_choice_ids.length, 2)
    assert.equal(story.parts.flatMap((part) => part.conditional_segments ?? []).length, 2)
  }
  const manifest = compileDraftAuthoredAudioManifest(story)
  assert.equal(manifest.isApproved, false)
  assert.equal(manifest.isPublished, false)
  const available = new Map(manifest.segments.map((s) => [s.segmentId, s.text]))
  assert.ok(available.size > 0)
  const inheritedChoices = inherited?.allowed_choice_ids ?? [null]
  for (const e5choiceId of inheritedChoices) {
    const previouslySelected = e5choiceId ? { [inherited.decision_id]: e5choiceId } : {}
    const waiting = buildAuthoredAudioPlan(story, progressFor(story, partIndex, previouslySelected))
    assert.equal(waiting.pauseForChoice, true)
    assert.ok(waiting.segments.length > 0)
    assert.ok(waiting.segments.every((s) => s.phase === 'before_choice'))
    // A split reading episode can place the inherited scene in an earlier
    // fragment, so include every preceding visible part before this choice.
    const waitingText = flatten(story.parts.slice(0, partIndex + 1).flatMap((part, index) =>
      buildAuthoredAudioPlan(story, progressFor(story, index, previouslySelected)).segments))

    if (ep === 6) {
      const allConditional = story.parts.flatMap((part) => part.conditional_segments ?? [])
      const chosenConditional = allConditional.find(s => s.when.choice_id === e5choiceId)
      const otherConditional = allConditional.find(s => s.when.choice_id !== e5choiceId)
      assert.ok(chosenConditional && otherConditional)
      assert.ok(waitingText.includes(chosenConditional.text.replace(/\s+/g, ' ').trim()),
        'Expected exact inherited E5 paragraph in E6 listening')
      assert.ok(!waitingText.includes(otherConditional.text.replace(/\s+/g, ' ').trim()),
        'Unselected inherited E5 paragraph leaked into E6 listening')
    }
    for (const selectedChoice of [choiceA, choiceB]) {
      const confirmed = progressFor(story, partIndex, {
        ...previouslySelected, [ownDecisionId]: selectedChoice.choice_id,
      })
      confirmed.shown_resolution_decisions = [ownDecisionId]
      const plan = buildAuthoredAudioPlan(story, confirmed)
      assert.equal(plan.pauseForChoice, false)
      assert.deepEqual(
        plan.segments.filter(s => s.phase === 'before_choice').map(s => s.text),
        waiting.segments.map(s => s.text),
        'Choice must not change earlier common/inherited narration',
      )
      const firstAfterChoice = nextAuthoredAudioSegment(
        plan, waiting.segments.at(-1).segmentId,
      )
      assert.ok(firstAfterChoice && firstAfterChoice.phase === 'choice_resolution')
      assert.equal(firstAfterChoice.choiceId, selectedChoice.choice_id)
      assert.equal(firstAfterChoice.segmentId, plan.nextSegmentAfterChoice)
      assert.equal(
        flatten(plan.segments.filter(s => s.phase === 'choice_resolution')),
        selectedChoice.resolution_text.replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\s+/g, ' ').trim(),
      )
      const opposite = selectedChoice.choice_id === choiceA.choice_id ? choiceB : choiceA
      assert.ok(plan.segments.every(s => s.choiceId !== opposite.choice_id))
      assert.ok(plan.segments.every(s =>
        s.text.length <= 2500 && available.get(s.segmentId) === s.text),
        'Exact playback chunks must exist in the unpublished source manifest')
      // Prove the 30-series presentation split does not omit, change,
      // repeat or reorder a single spoken word from the literary package.
      const spokenWholeStory = (pkg) => flatten(pkg.parts.flatMap((part, index) => {
        const selected = {
          ...previouslySelected, [ownDecisionId]: selectedChoice.choice_id,
        }
        const progress = progressFor(pkg, index, selected)
        if (part.decision) progress.shown_resolution_decisions = [part.decision.decision_id]
        return buildAuthoredAudioPlan(pkg, progress).segments
      }))
      assert.equal(
        spokenWholeStory(story),
        spokenWholeStory(original),
        '30-series reader layout must preserve exact ordered literary narration',
      )
      verifiedPaths += 1
    }
  }
  counts[`E${ep}_${lang}`] = {
    routes: inheritedChoices.length * 2,
    draftChunks: manifest.segments.length,
    sourceVersion: story.source_literary_version,
  }
}
assert.equal(verifiedPaths, 12, 'Expected 8 E6 and 4 E7 RU/UZ paths')
assert.deepEqual(Object.values(counts).map(c => c.routes), [4, 4, 2, 2])
console.log('[azure-main-routes] PASS: 12 source-pinned RU/UZ E6/E7 reading-layout routes with exact text conservation')
console.log(JSON.stringify({ paths: verifiedPaths, ...counts }, null, 2))
