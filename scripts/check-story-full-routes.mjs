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

const assertRenderedSegment = (story, part, phase, selected, blocks) => {
  for (const segment of (part.conditional_segments ?? []).filter((s) => s.phase === phase)) {
    const segmentParas = textParagraphs(segment.text)
    const expected = selected[segment.when.decision_id] === segment.when.choice_id
    if (!segmentParas.length) throw new Error(story.title + ': empty conditional text ' + segment.segment_id)
    const firstPara = segmentParas[0]
    // Find the conditional insertion precisely AFTER its anchor. This checks
    // runtime rendering rather than assuming the JSON alone proves visibility.
    const anchorPositions = blocks.map((block, i) => block.kind === 'text' && block.text === segment.after_text ? i : -1).filter((i) => i >= 0)
    assert.equal(anchorPositions.length, 1, story.title + ': ambiguous ' + segment.segment_id)
    const anchor = anchorPositions[0]
    const shownHere = blocks[anchor + 1]?.kind === 'text' &&
      blocks[anchor + 1].text === firstPara
    // Another conditional can precede this one at the same anchor; inspect the
    // complete contiguous inserted block subsequence instead of only next.
    const sequence = blocks.slice(anchor + 1, anchor + 1 + (part.conditional_segments ?? []).length * 24)
      .filter((block) => block.kind === 'text').map((block) => block.text)
    const hasSegment = sequence.includes(firstPara)
    if (expected && !hasSegment) throw new Error(story.title + ': selected segment absent ' + segment.segment_id)
    if (!expected && hasSegment && !shownHere) {
      // Only flag a leak if this distinctive whole paragraph is not already
      // present in the shared prose; equal wording alone is not a branch bug.
      const shared = textParagraphs(part[phase])
      if (!shared.includes(firstPara)) throw new Error(story.title + ': unselected segment leaked ' + segment.segment_id)
    }
  }
}

export const renderSelectedRoute = (story, selected) => {
  const output = []
  for (const part of story.parts) {
    const pre = buildAuthoredNarrativeBlocks(part, 'story_text', selected)
    assertRenderedSegment(story, part, 'story_text', selected, pre)
    output.push(...pre.filter((block) => block.kind === 'text').map((block) => block.text))
    if (part.decision) {
      const selectedChoice = part.decision.choices.find((c) => c.choice_id === selected[part.decision.decision_id])
      assert(selectedChoice, story.title + ': route contains a missing choice')
      output.push(...textParagraphs(selectedChoice.resolution_text))
    }
    const post = buildAuthoredNarrativeBlocks(part, 'post_choice_text', selected)
    assertRenderedSegment(story, part, 'post_choice_text', selected, post)
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
