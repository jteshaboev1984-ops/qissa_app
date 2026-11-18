// The owner replaced the historical seven-episode Season 2 presentation with
// four chronological seasons on 12 November 2026. The old product model JSON is
// intentionally retained as an archival source; this release-wiring check now
// enforces the new model without touching the approved authored packages.
import './check-four-season-layout.mjs'
import fs from 'node:fs'

const read = (name) => JSON.parse(fs.readFileSync(name, 'utf8'))
const story2 = read('src/data/authored/taynaVostochnogoKaravanaV4.ru.json')
const story3 = read('src/data/authored/staging/season2Story3TwoTowers.ru.json')
const story5 = read('src/data/authored/staging/season2Story5FalseRoad.ru.json')
const story6 = read('src/data/authored/staging/season2Story6TwoReinforcements.ru.json')
const historicModel = read('docs/qissa/season2/season2_product_model.json')
const fail = (message) => { console.error('[four-season-wiring] ' + message); process.exitCode = 1 }

if (historicModel.version !== 'season2-product-model-1' ||
  historicModel.owner_decision !== 'option-2') {
  fail('the prior two-season historical product model was overwritten')
}
if (story2.story_id !== 'seven_roads_tayna_vostochnogo_karavana' ||
  story2.story_version !== 'interactive-v4-continuity-sync') {
  fail('legacy Eastern Caravan progress key changed')
}
if (story3.external_choice_context?.[0]?.source_story_id !== story2.story_id ||
  story3.external_choice_context?.[0]?.decision_id !== 'story2_choice_3_sarvan_check') {
  fail('Two Towers no longer inherits the Eastern Caravan Sarvan decision')
}
if (story6.external_choice_context?.[0]?.source_story_id !== story5.story_id ||
  story6.external_choice_context?.[0]?.decision_id !== 'story5_choice_1_road_post_approach') {
  fail('Two Reinforcements no longer inherits the False Road decision')
}
const payoffs = story6.parts.flatMap((part) => part.conditional_segments ?? [])
  .filter((segment) => segment.when?.decision_id === 'story5_choice_1_road_post_approach')
if (payoffs.length !== 2 ||
  !payoffs.some((part) => part.when.choice_id === 'story5_choice_1a_forest_edge') ||
  !payoffs.some((part) => part.when.choice_id === 'story5_choice_1b_open_ridge')) {
  fail('both choice payoffs in Two Reinforcements must survive the season split')
}
if (!process.exitCode) console.log('[four-season-wiring] PASS: preserved legacy progress and both inherited-choice contracts')
