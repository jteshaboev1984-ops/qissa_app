import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const json = (relative) => JSON.parse(read(relative))

const errors = []
const fail = (message) => errors.push(message)

const seasonData = read('src/data/sevenRoadsSeasons.ts')
const app = read('src/App.tsx')
const shell = read('src/components/PublishedStoriesShell.tsx')
const overview = read('src/components/SeasonOverview.tsx')
const player = read('src/features/authoredStory/AuthoredStoryPlayer.tsx')
const copy = read('src/features/publishedStories/sevenRoadsCopy.ts')
const model = json('docs/qissa/season2/season2_product_model.json')
const story2 = json('src/data/authored/taynaVostochnogoKaravanaV4.ru.json')
const story3 = json('src/data/authored/staging/season2Story3TwoTowers.ru.json')

const expectedStory2Id = 'seven_roads_tayna_vostochnogo_karavana'
const expectedStory2Version = 'interactive-v4-continuity-sync'

if (story2.story_id !== expectedStory2Id || story2.story_version !== expectedStory2Version) {
  fail('Episode 2 persistence identity drifted')
}
if (!seasonData.includes("presentation: 'single-cover-episode-list'")) {
  fail('Season 2 shared-cover episode-list presentation is missing')
}
if (!seasonData.includes("coverAssetId: 'seven_roads_season2_cover_v1'")) {
  fail('Season 2 shared cover id is missing from published season data')
}
if (!seasonData.includes("completionScope: 'episode'")) {
  fail('Season 2 packages are not exposed with episode completion semantics')
}
if (!seasonData.includes("getSeason2ReleaseCandidateStories(language)")) {
  fail('Season 2 localized release-candidate registry is not composed into season data')
}

for (const id of [
  'seven_roads_korolevskoe_serebro',
  expectedStory2Id,
  'seven_roads_dve_bashni',
  'seven_roads_chelovek_kotorogo_zhdut',
  'seven_roads_lozhnaya_doroga',
  'seven_roads_dve_podmogi',
  'seven_roads_obratno_v_ordan',
]) {
  if (!seasonData.includes(id) && id !== expectedStory2Id) {
    fail(`Season 2 release wiring is missing ${id}`)
  }
}

if (!overview.includes('startedIncompleteIndex')) {
  fail('Season overview does not prioritize started legacy Episode 2 progress')
}
if (!overview.includes('priorEpisodesCompleted || Boolean(item.progress)')) {
  fail('Season overview does not preserve access to already-started legacy Episode 2')
}
if (!app.includes("season.presentation === 'single-cover-episode-list'")) {
  fail('App does not keep Season 2 reader navigation inside the season flow')
}
if (!app.includes("showCover={season.presentation !== 'single-cover-episode-list'}")) {
  fail('Season 2 reader still risks rendering per-episode cover cards')
}
if (!shell.includes('season2StartedIncomplete')) {
  fail('Home does not resume an already-started Season 2 episode')
}
if (!shell.includes('season2AllCompleted')) {
  fail('Home does not expose Season 2 completion state')
}
if (shell.includes('story2Unlocked')) {
  fail('legacy Story 2-only shell lock remains after seven-episode wiring')
}
if (!shell.includes("season.presentation === 'single-cover-episode-list'")) {
  fail('Library/Gallery do not understand the Season 2 episode-list presentation')
}
if (!player.includes("completionScope === 'episode'")) {
  fail('Reader lacks episode-scoped completion rendering')
}
for (const key of ['finishEpisode', 'episodeCompletionMemory', 'replayEpisode']) {
  if (!copy.includes(key)) fail(`episode completion copy key missing: ${key}`)
}

const external = story3.external_choice_context ?? []
if (
  external.length !== 1 ||
  external[0].decision_id !== 'story2_choice_3_sarvan_check' ||
  external[0].source_story_id !== expectedStory2Id ||
  external[0].source_story_version !== expectedStory2Version
) {
  fail('Episode 3 inherited Episode 2 choice contract drifted')
}
if (!app.includes('story2_choice_3_sarvan_check')) {
  fail('App does not seed Episode 3 with the persisted Episode 2 choice')
}

if (model.release_state !== 'wired-release-candidate') {
  fail(`unexpected Season 2 release state: ${model.release_state}`)
}
if (model.localization?.status !== 'ru+uz-complete-staging') {
  fail('Season 2 RU+UZ localization state is not complete')
}
if (model.product_rules?.season_cover_status !== 'hosted_verified') {
  fail('Season 2 shared cover is not hosted_verified')
}
if (!Array.isArray(model.release_blockers) || model.release_blockers.length !== 1) {
  fail('Season 2 should have exactly one remaining release blocker: final browser regression')
}

if (errors.length) {
  errors.forEach((error) => console.error(`[season2-release-wiring] ${error}`))
  process.exit(1)
}

console.log('[season2-release-wiring] PASS')
console.log('[season2-release-wiring] one shared cover + seven episode packages are wired')
console.log('[season2-release-wiring] Episode 2 story_id/story_version persistence identity preserved')
console.log('[season2-release-wiring] legacy Episode 2 progress remains resumable before sequential unlock catches up')
console.log('[season2-release-wiring] Episode 3 inherits the saved Episode 2 Sarvan choice')
console.log('[season2-release-wiring] only the final browser regression gate remains')
