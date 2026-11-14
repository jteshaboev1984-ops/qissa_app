import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Execute the actual TypeScript presentation adapter after type-only imports
// are stripped. No duplicate split implementation is used in this test.
const code = fs.readFileSync('src/data/sevenRoadsReadingSeries.ts', 'utf8')
const output = ts.transpileModule(code, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
})
const moduleExports = {}
vm.runInNewContext(output.outputText, { exports: moduleExports, console }, { filename: 'sevenRoadsReadingSeries.js' })
const { withReadingSeries } = moduleExports
assert.equal(typeof withReadingSeries, 'function')

const sources = [
  ['festival', 'src/data/authored/prazdnikMuzhestvaV3', 5, 7, 0],
  ['silver', 'src/data/authored/staging/season2Story1RoyalSilver', 4, 4, 0],
  ['caravan', 'src/data/authored/taynaVostochnogoKaravanaV4', 8, 12, 0],
  ['towers', 'src/data/authored/staging/season2Story3TwoTowers', 3, 3, 8],
  ['waited', 'src/data/authored/staging/season2Story4WaitedMan', 4, 5, 0],
  ['falseRoad', 'src/data/authored/staging/season2Story5FalseRoad', 2, 2, 4],
  ['reinforcements', 'src/data/authored/staging/season2Story6TwoReinforcements', 2, 3, 6],
  ['ordan', 'src/data/authored/staging/season2Story7BackToOrdan', 2, 2, 8],
]
const read = (path) => JSON.parse(fs.readFileSync(path, 'utf8'))
const paragraphs = (text) => String(text || '').split(/\n\n+/).map(x => x.trim()).filter(Boolean)
function localizedPackage(root, language) {
  const original = read(root + '.ru.json')
  if (language === 'ru') return original
  const overlay = read(root + '.uz.json')
  assert.equal(original.story_id, overlay.story_id)
  assert.equal(original.story_version, overlay.story_version)
  return { ...original, language: 'uz', title: overlay.title, parts: original.parts.map((part, index) => {
    const loc = overlay.parts[index]
    assert.equal(part.part_id, loc.part_id)
    return {
      ...part,
      story_text: loc.story_text,
      post_choice_text: loc.post_choice_text,
      title: loc.title,
      image_slots: part.image_slots.map(slot => ({ ...slot, after_text: loc.image_anchor_texts[slot.slot_id] })),
      decision: part.decision && {
        ...part.decision,
        prompt: loc.decision.prompt,
        choices: part.decision.choices.map(choice => {
          const lChoice = loc.decision.choices.find(candidate => candidate.choice_id === choice.choice_id)
          assert.ok(lChoice, 'choice translation must exist')
          return {
            ...choice,
            text: lChoice.text,
            resolution_text: lChoice.resolution_text,
            illustration: choice.illustration
              ? { ...choice.illustration, after_text: lChoice.illustration_after_text }
              : null,
          }
        }),
      },
      conditional_segments: (part.conditional_segments ?? []).map(segment => ({
        ...segment,
        text: loc.conditional_segment_texts[segment.segment_id].text,
        after_text: loc.conditional_segment_texts[segment.segment_id].after_text,
      })),
    }
  }) }
}
function chronologicalPackage(story) {
  if (story.story_id !== 'seven_roads_dve_bashni') return story
  const old = story.language === 'ru'
    ? 'К вечеру дорога поднялась на последний невысокий холм.'
    : 'Kechga yaqin yo‘l oxirgi past tepalikka ko‘tarildi.'
  const updated = story.language === 'ru'
    ? 'На третий день после отъезда из Араса дорога к вечеру поднялась на последний невысокий холм.'
    : 'Arasdan jo‘nab ketganlarining uchinchi kuni, kechga yaqin yo‘l oxirgi past tepalikka ko‘tarildi.'
  assert.equal(story.parts[0].story_text.split(old).length, 2, 'chronology replacement must match once')
  return {
    ...story, parts: [{ ...story.parts[0], story_text: story.parts[0].story_text.replace(old, updated) }, ...story.parts.slice(1)],
  }
}
function rendered(story, choiceIds) {
  const text = [], images = []
  const phase = (part, name) => {
    const slots = part.image_slots.filter(item => item.phase === name)
    const additions = (part.conditional_segments ?? []).filter(item => item.phase === name)
    for (const paragraph of paragraphs(part[name])) {
      text.push(paragraph)
      images.push(...slots.filter(slot => slot.after_text === paragraph).map(slot => slot.asset_id))
      for (const insertion of additions.filter(segment => segment.after_text === paragraph)) {
        if (choiceIds[insertion.when.decision_id] === insertion.when.choice_id)
          text.push(...paragraphs(insertion.text))
      }
    }
  }
  for (const part of story.parts) {
    phase(part, 'story_text')
    if (part.decision) {
      const choice = part.decision.choices.find(option => option.choice_id === choiceIds[part.decision.decision_id])
      assert.ok(choice, 'decision requires selected branch: ' + part.decision.decision_id)
      for (const paragraph of paragraphs(choice.resolution_text)) {
        text.push(paragraph)
        if (choice.illustration?.after_text === paragraph) images.push(choice.illustration.asset_id)
      }
    }
    phase(part, 'post_choice_text')
  }
  return { text, images }
}
function selectedCombinations(story, inherited = {}) {
  const choices = story.parts.flatMap(part => part.decision ? [part.decision] : [])
  const combos = []
  for (let mask = 0; mask < 2 ** choices.length; mask++) {
    const selections = { ...inherited }
    choices.forEach((decision, index) => {
      selections[decision.decision_id] = decision.choices[(mask >> index) & 1].choice_id
    })
    combos.push(selections)
  }
  return combos
}
const counts = { ru: [0, 0, 0, 0], uz: [0, 0, 0, 0] }
let renderedPaths = 0, anchorChecks = 0
for (const language of ['ru', 'uz']) {
  for (const [key, root, expectedEpisodes, expectedParts, offset] of sources) {
    const original = chronologicalPackage(localizedPackage(root, language))
    const { story, episodes } = withReadingSeries(original, key, offset)
    assert.equal(story.story_id, original.story_id)
    assert.equal(story.story_version, original.story_version)
    assert.equal(story.parts.length, expectedParts, key + '/' + language + ' virtual part count')
    assert.equal(episodes.length, expectedEpisodes, key + '/' + language + ' episode count')
    assert.equal(story.reader_layout.episode_by_part.length, story.parts.length)
    assert.equal(story.reader_layout.source_part_by_part.length, story.parts.length)
    assert.deepEqual(Array.from(new Set(story.reader_layout.episode_by_part)), Array.from({ length: expectedEpisodes }, (_, i) => i + 1))
    episodes.forEach((ep, index) => {
      assert.equal(ep.number, index + 1)
      assert.equal(ep.seasonNumber, offset + index + 1)
      assert.ok(ep.title)
    })
    for (const part of original.parts) {
      assert.equal(story.parts.filter(p => p.part_id === part.part_id).length, 1,
        key + ': original part ID must survive exactly once')
    }
    assert.deepEqual(
      story.parts.flatMap(p => p.decision ? [p.decision.decision_id] : []),
      original.parts.flatMap(p => p.decision ? [p.decision.decision_id] : []),
      key + ': decision positions/order must survive split',
    )
    for (const part of story.parts) {
      for (const slot of part.image_slots) {
        assert.equal(paragraphs(part[slot.phase]).filter(x => x === slot.after_text).length, 1,
          key + ': image anchor ' + slot.slot_id + ' must remain unique')
        anchorChecks++
      }
      for (const segment of part.conditional_segments ?? []) {
        assert.equal(paragraphs(part[segment.phase]).filter(x => x === segment.after_text).length, 1,
          key + ': conditional insertion ' + segment.segment_id + ' must stay anchored')
        anchorChecks++
      }
    }
    const inheritedPaths = key === 'towers'
      ? [{ story2_choice_3_sarvan_check: 'story2_choice_3a_old_sarvan_yard' }, { story2_choice_3_sarvan_check: 'story2_choice_3b_azim' }]
      : key === 'reinforcements'
        ? [{ story5_choice_1_road_post_approach: 'story5_choice_1a_forest_edge' }, { story5_choice_1_road_post_approach: 'story5_choice_1b_open_ridge' }]
        : [{}]
    for (const inherited of inheritedPaths) {
      for (const selection of selectedCombinations(original, inherited)) {
        const oldText = rendered(original, selection)
        const newText = rendered(story, selection)
        assert.equal(JSON.stringify(oldText), JSON.stringify(newText),
          key + '/' + language + ': full branch-specific text/images changed')
        renderedPaths++
      }
    }
    const season = key === 'festival' ? 0 : key === 'silver' ? 1 : ['caravan', 'towers'].includes(key) ? 2 : 3
    counts[language][season] += episodes.length
  }
  assert.deepEqual(counts[language], [5, 4, 11, 10], language + ': season counts')
}
console.log('[series-30] PASS RU+UZ, 5/4/11/10 = 30 series per language')
console.log('[series-30] ' + renderedPaths + ' rendered choice paths preserve every literary paragraph and illustration in order')
console.log('[series-30] ' + anchorChecks + ' illustration and conditional anchors verified; original IDs/versions preserved')
