// Exercise every authored RU/UZ path, including inherited Season 2 decisions.
// Structural path replay is NOT a substitute for literary reading of semantics.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { localizeAuthoredStoryPackage } from '../src/features/authoredStory/localizePackage.ts'
import { buildAuthoredNarrativeBlocks } from '../src/features/authoredStory/engine.ts'
import { AUTHORED_STORIES } from './check-story-canon-literary.mjs'

const root = process.cwd()
const textParagraphs = (s) => String(s ?? '').split(/\n\s*\n/u).map((x) => x.trim()).filter(Boolean)
const load = (stem, lang) => JSON.parse(fs.readFileSync(
  path.join(root, 'src/data/authored', stem + '.' + lang + '.json'), 'utf8',
))

export const enumerateRoutes = (story) => {
  const dimensions = [
    ...(story.external_choice_context ?? []).map((item) => ({
      decision: item.decision_id, choices: item.allowed_choice_ids,
    })),
    ...story.parts.filter((p) => p.decision).map((p) => ({
      decision: p.decision.decision_id,
      choices: p.decision.choices.map((c) => c.choice_id),
    })),
  ]
  return dimensions.reduce((paths, dimension) =>
    paths.flatMap((selected) => dimension.choices.map((choice) => ({
      ...selected, [dimension.decision]: choice,
    }))), [{}])
}

// Strictly compare the text stream against the selected route. Checking only
// whether a conditional segment is present can miss leaked unselected prose.
export const assertRenderedTextBlocks = (story, part, phase, selected, blocks) => {
  const segments = (part.conditional_segments ?? []).filter((s) => s.phase === phase)
  const expected = []
  for (const paragraph of textParagraphs(part[phase])) {
    expected.push(paragraph)
    for (const segment of segments) {
      if (segment.after_text !== paragraph) continue
      if (selected[segment.when.decision_id] !== segment.when.choice_id) continue
      expected.push(...textParagraphs(segment.text))
    }
  }
  const actual = blocks.filter((block) => block.kind === 'text').map((block) => block.text)
  assert.deepEqual(actual, expected,
    story.title + ': wrong conditional text in ' + part.part_id + '/' + phase)
}

// Mutations exercise both failure modes: omitted selected branch and leaked
// unselected branch. Green CI must not mean merely "some segment appeared".
const fixturePart = {
  part_id: 'synthetic',
  story_text: 'Opening\\n\\nAnchor\\n\\nClosing',
  post_choice_text: '',
  image_slots: [],
  conditional_segments: [
    { segment_id: 'synthetic-a', phase: 'story_text', after_text: 'Anchor',
      when: { decision_id: 'synthetic-decision', choice_id: 'a' }, text: 'Route A' },
    { segment_id: 'synthetic-b', phase: 'story_text', after_text: 'Anchor',
      when: { decision_id: 'synthetic-decision', choice_id: 'b' }, text: 'Route B' },
  ],
}
fixturePart.story_text = fixturePart.story_text.replaceAll('\\n','\n')
const fixtureSelected = { 'synthetic-decision': 'a' }
const fixtureBlocks = buildAuthoredNarrativeBlocks(fixturePart, 'story_text', fixtureSelected)
assertRenderedTextBlocks({ title: 'fixture' }, fixturePart, 'story_text', fixtureSelected, fixtureBlocks)
assert.throws(() => assertRenderedTextBlocks(
  { title: 'fixture' }, fixturePart, 'story_text', fixtureSelected,
  [...fixtureBlocks, { kind: 'text', text: 'Route B' }],
), /wrong conditional text/u, 'must reject leaked unselected branch')
assert.throws(() => assertRenderedTextBlocks(
  { title: 'fixture' }, fixturePart, 'story_text', fixtureSelected,
  fixtureBlocks.filter((block) => block.text !== 'Route A'),
), /wrong conditional text/u, 'must reject missing chosen branch')

export const renderSelectedRoute = (story, selected) => {
  const output = []
  for (const part of story.parts) {
    const pre = buildAuthoredNarrativeBlocks(part, 'story_text', selected)
    assertRenderedTextBlocks(story, part, 'story_text', selected, pre)
    output.push(...pre.filter((block) => block.kind === 'text').map((block) => block.text))
    if (part.decision) {
      const selectedChoice = part.decision.choices.find((c) => c.choice_id === selected[part.decision.decision_id])
      assert(selectedChoice, story.title + ': route contains a missing choice')
      output.push(...textParagraphs(selectedChoice.resolution_text))
    }
    const post = buildAuthoredNarrativeBlocks(part, 'post_choice_text', selected)
    assertRenderedTextBlocks(story, part, 'post_choice_text', selected, post)
    output.push(...post.filter((block) => block.kind === 'text').map((block) => block.text))
  }
  return output.join('\n\n')
}

let routeCount = 0
const totals = []
for (const stem of AUTHORED_STORIES) {
  const base = load(stem, 'ru')
  const overlay = load(stem, 'uz')
  const uz = localizeAuthoredStoryPackage(base, overlay)
  const ruRoutes = enumerateRoutes(base)
  const uzRoutes = enumerateRoutes(uz)
  assert.equal(ruRoutes.length, uzRoutes.length)
  let minWords = Number.POSITIVE_INFINITY
  let maxWords = 0
  for (let i = 0; i < ruRoutes.length; i++) {
    assert.deepEqual(ruRoutes[i], uzRoutes[i], 'bilingual selected-choice IDs differ')
    for (const [story, selected] of [[base, ruRoutes[i]], [uz, uzRoutes[i]]]) {
      const rendered = renderSelectedRoute(story, selected)
      assert(rendered.trim(), story.title + ': empty route')
      const n = rendered.trim().split(/\s+/u).length
      minWords = Math.min(minWords, n)
      maxWords = Math.max(maxWords, n)
      routeCount += 1
    }
  }
  totals.push({ title: base.title, path_pairs: ruRoutes.length, min_words: minWords, max_words: maxWords })
  console.log('[full-routes]', base.title, ruRoutes.length + ' RU + ' + ruRoutes.length + ' UZ routes; inherited decisions=' + (base.external_choice_context?.length ?? 0))
}
assert.equal(routeCount, 136, 'unexpected total complete-path count')
assert.equal(totals.reduce((a, b) => a + b.path_pairs, 0), 68)
console.log('[full-routes] PASS: 136 rendered end-to-end paths across 16 authored packages.')
console.log('[full-routes] Verified both localized choices, inherited branch insertions and all continuation segments; semantics still require editor.')
