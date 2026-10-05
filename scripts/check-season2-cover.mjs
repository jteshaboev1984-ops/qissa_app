import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const readText = (relative) =>
  fs.readFileSync(path.join(root, relative), 'utf8')

const cover = readJson('docs/qissa/season2/season2_cover_v1_inventory.json')
const model = readJson('docs/qissa/season2/season2_product_model.json')
const seasonData = readText('src/data/sevenRoadsSeasons.ts')
const assetRegistry = readText('src/data/authoredStoryAssets.ts')

const errors = []
const fail = (message) => errors.push(message)

if (cover.version !== 'season2-cover-v1') fail('unexpected cover inventory version')
if (cover.asset_id !== 'seven_roads_season2_cover_v1') fail('unexpected cover asset id')
if (cover.status !== 'hosted_verified') {
  fail(`unexpected cover status: ${cover.status}`)
}
if (
  cover.format?.width !== 1024 ||
  cover.format?.height !== 1536 ||
  cover.format?.aspect_ratio !== '2:3'
) {
  fail('Season 2 cover must remain 1024x1536 / 2:3')
}
if (cover.format?.no_baked_text !== true) fail('Season 2 cover must remain text-free')

if (cover.master?.bytes !== 3837508) fail('approved PNG byte size drifted')
if (
  cover.master?.sha256 !==
  '1614ca3ef92ee1c015e7ffc9d69c01e25988986e8881fe88a19aa33e96135de3'
) {
  fail('approved PNG SHA-256 drifted')
}
if (cover.runtime_derivative?.bytes !== 419444) fail('runtime WebP byte size drifted')
if (
  cover.runtime_derivative?.sha256 !==
  '49b3e2eb7514cd71d98a497e654b2f2c1f3da767c4fbe20fa929b57bfaa47ba4'
) {
  fail('runtime WebP SHA-256 drifted')
}
if (
  cover.runtime_derivative?.supabase_object_path !==
  'seven-roads/season2_v1/seven_roads_season2_cover_v1.webp'
) {
  fail('runtime WebP object path drifted')
}
if (
  cover.runtime_derivative?.status !== 'hosted_verified' ||
  cover.runtime_derivative?.public_url !==
    'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_v1/seven_roads_season2_cover_v1.webp'
) {
  fail('runtime cover must remain hosted_verified at the locked public URL')
}

if (model.product_rules?.season_cover_asset_id !== cover.asset_id) {
  fail('product model cover asset id must match cover inventory')
}
if (model.product_rules?.season_cover_status !== cover.status) {
  fail('product model cover status must match cover inventory')
}
if (seasonData.includes("presentation: 'single-cover-episode-list'")) {
  fail('public Season 2 presentation must remain dormant until localization gates close')
}
if (
  !assetRegistry.includes(`'${cover.asset_id}'`) &&
  !assetRegistry.includes(`"${cover.asset_id}"`)
) {
  fail('hosted shared cover must be registered in authoredStoryAssets.ts')
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[season2-cover] ${error}`))
  process.exit(1)
}

console.log('[season2-cover] PASS')
console.log('[season2-cover] approved 1024x1536 master + 419444-byte WebP derivative locked')
console.log('[season2-cover] hosted shared cover is registry-ready while Season 2 presentation remains dormant')
