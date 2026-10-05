import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const readText = (relative) =>
  fs.readFileSync(path.join(root, relative), 'utf8')
const readJson = (relative) =>
  JSON.parse(readText(relative))

const model = readJson('docs/qissa/season2/season2_product_model.json')
const seasonData = readText('src/data/sevenRoadsSeasons.ts')
const seasonOverview = readText('src/components/SeasonOverview.tsx')
const publishedTypes = readText('src/features/publishedStories/types.ts')
const authoredStories = readText('src/data/authoredStories.ts')

const errors = []
const fail = (message) => errors.push(message)

if (model.version !== 'season2-product-model-1') {
  fail(`unexpected product model version: ${model.version}`)
}
if (model.owner_decision !== 'option-2') {
  fail('Season 2 owner decision must remain option-2')
}
if (model.presentation_mode !== 'one-season-cover-seven-episode-list') {
  fail(`unexpected presentation mode: ${model.presentation_mode}`)
}
if (model.product_rules?.season_cover_count !== 1) {
  fail('Season 2 must have exactly one season-level cover')
}
if (model.product_rules?.episode_cover_count !== 0) {
  fail('Season 2 episodes must not receive individual cover cards')
}
if (
  model.product_rules?.season_cover_asset_id !==
  'seven_roads_season2_cover_v1'
) {
  fail('shared Season 2 cover asset id drifted')
}
if (
  model.product_rules?.season_cover_status !==
  'hosted_verified'
) {
  fail('shared Season 2 cover approval/runtime-preparation state drifted')
}
if (model.product_rules?.episode_cards_use_images !== false) {
  fail('Season 2 episode rows must not use image cards')
}
if (model.product_rules?.episode_packages_keep_independent_progress !== true) {
  fail('episode packages must preserve independent progress for live Story 2 compatibility')
}
if (!Array.isArray(model.episodes) || model.episodes.length !== 7) {
  fail(`expected seven Season 2 episodes, got ${model.episodes?.length ?? 0}`)
}

const expectedTitles = [
  'Королевское серебро',
  'Тайна восточного каравана',
  'Две башни',
  'Человек, которого ждут',
  'Ложная дорога',
  'Две подмоги',
  'Обратно в Ордан',
]

for (let index = 0; index < expectedTitles.length; index += 1) {
  const episode = model.episodes?.[index]
  if (!episode) continue
  if (episode.number !== index + 1) {
    fail(`episode index ${index}: expected number ${index + 1}, got ${episode.number}`)
  }
  if (episode.title_ru !== expectedTitles[index]) {
    fail(`Episode ${index + 1}: title drifted`)
  }
}

const stagedPaths = model.episodes
  .filter((episode) => episode.status === 'staging')
  .map((episode) => episode.package_path)

if (stagedPaths.length !== 6) {
  fail(`expected six staging episode packages, got ${stagedPaths.length}`)
}

for (const packagePath of stagedPaths) {
  const pkg = readJson(packagePath)
  if (
    pkg.cover_illustration?.asset_id !==
      'seven_roads_season2_cover_v1' ||
    pkg.cover_illustration?.status !==
      'hosted_verified'
  ) {
    fail(`${packagePath}: must use shared Season 2 cover gate`)
  }
  if (!String(pkg.illustration_plan?.rule ?? '').includes('Do not create an episode-specific cover')) {
    fail(`${packagePath}: episode-specific cover prohibition missing`)
  }
}

if (!publishedTypes.includes("'single-cover-episode-list'")) {
  fail('PublishedSeason type is missing single-cover-episode-list presentation')
}
if (!publishedTypes.includes('coverAssetId?: string | null')) {
  fail('PublishedSeason type is missing optional season coverAssetId')
}
if (!seasonOverview.includes("season.presentation === 'single-cover-episode-list'")) {
  fail('SeasonOverview is missing the one-cover episode-list renderer')
}
if (!seasonOverview.includes('formatSevenRoadsEpisodeLabel(language, item.entry.number)')) {
  fail('SeasonOverview must label rows as episodes, not story cards')
}
if (!seasonOverview.includes('priorEpisodesCompleted')) {
  fail('SeasonOverview must gate future episodes sequentially')
}
if (!seasonOverview.includes('Boolean(item.progress)')) {
  fail('SeasonOverview must preserve access to already-started legacy Story 2 progress')
}

if (!seasonData.includes("presentation: 'single-cover-episode-list'")) {
  fail('Season 2 one-cover / seven-episode presentation is not wired')
}
if (!seasonData.includes("coverAssetId: 'seven_roads_season2_cover_v1'")) {
  fail('Season 2 shared cover is not wired into published season data')
}
if (!seasonData.includes("completionScope: 'episode'")) {
  fail('Season 2 packages must render as episodes, not separate story cards')
}
if (!seasonData.includes("getSeason2ReleaseCandidateStories")) {
  fail('Season 2 release-candidate package registry is not wired into season data')
}

for (const episode of model.episodes.filter((entry) => entry.status === 'staging')) {
  const packageJson = readJson(episode.package_path)
  if (authoredStories.includes(packageJson.story_id)) {
    fail(`${episode.title_ru}: staging episode leaked into public authoredStories registry`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[season2-product-model] ${error}`))
  process.exit(1)
}

console.log('[season2-product-model] PASS')
console.log('[season2-product-model] one hosted+verified shared cover + seven episode rows locked')
console.log('[season2-product-model] seven episode packages are wired behind one shared Season 2 cover')
console.log('[season2-product-model] live Story 2 progress compatibility remains preserved')
