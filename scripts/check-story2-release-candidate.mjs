import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const readJson = (file) => JSON.parse(read(file))

const story = readJson('src/data/authored/taynaVostochnogoKaravanaV4.ru.json')
const uz = readJson('src/data/authored/taynaVostochnogoKaravanaV4.uz.json')
const scenes = readJson('docs/qissa/story2/story2_runtime_asset_inventory.json')
const cover = readJson('docs/qissa/story2/story2_cover_runtime_inventory.json')
const seasons = read('src/data/sevenRoadsSeasons.ts')
const assets = read('src/data/authoredStoryAssets.ts')
const app = read('src/App.tsx')
const deploy = read('.github/workflows/deploy-pages.yml')
const ci = read('.github/workflows/ci.yml')

const errors = []
const fail = (message) => errors.push(message)

if (story.story_id !== 'seven_roads_tayna_vostochnogo_karavana') {
  fail('unexpected Story 2 story_id')
}
if (story.story_version !== 'interactive-v4-continuity-sync') {
  fail('unexpected Story 2 story_version')
}
if (story.cover_illustration?.status !== 'approved') {
  fail('Story 2 cover must be approved')
}
if (uz.language !== 'uz' || uz.story_id !== story.story_id || uz.story_version !== story.story_version) {
  fail('Uzbek localization must match the Story 2 identity/version')
}
if (scenes.count !== 28 || scenes.total_bytes !== 9071006) {
  fail('Story 2 scene runtime inventory is not locked at 28 assets / 9,071,006 bytes')
}
if (cover.status !== 'approved_hosted_verified') {
  fail('Story 2 cover is not in approved_hosted_verified state')
}
if (
  cover.asset_id !== 'seven_roads_story2_cover_v1' ||
  cover.width !== 1024 ||
  cover.height !== 1536 ||
  cover.bytes !== 293120 ||
  cover.sha256 !== 'eefdcb674febb46f4ecebc209cdbd1c13f5d9977360d5d4c95633f83eab00d8b'
) {
  fail('Story 2 cover runtime identity/hash contract drifted')
}
if (!assets.includes("'seven_roads_story2_cover_v1'")) {
  fail('Story 2 cover is missing from the readiness-gated asset registry')
}
if (!assets.includes('VITE_QISSA_STORY2_RUNTIME_ASSETS_READY')) {
  fail('Story 2 runtime registry must remain gated before release')
}
if (app.includes('showCover={false}') || !app.includes('showCover')) {
  fail('Gated Story 2 preview must render the approved cover')
}
if (!seasons.includes("status: 'coming_soon'") || !seasons.includes('stories: []')) {
  fail('Pre-release Season 2 must remain coming_soon with no public Story 2 metadata')
}
for (const marker of [
  'VITE_QISSA_STORY2_PREVIEW: false',
  'VITE_QISSA_STORY2_RUNTIME_ASSETS_READY: false',
  'npm run check:story2-bundle-closed',
]) {
  if (!deploy.includes(marker)) {
    fail(`production deploy pre-release gate missing: ${marker}`)
  }
}
for (const marker of [
  'smoke:story2-cover-live -- present',
  'smoke:story2-assets-live -- present',
  'smoke:story2-resume-gallery',
]) {
  if (!ci.includes(marker)) {
    fail(`integration CI release-evidence step missing: ${marker}`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[story2-release-candidate] ${error}`))
  process.exit(1)
}

console.log('[story2-release-candidate] PASS')
console.log('[story2-release-candidate] 28 scenes + approved cover are locked and hosted')
console.log('[story2-release-candidate] RU/UZ identity and persistence contracts are ready')
console.log('[story2-release-candidate] production remains intentionally closed: Season 2 coming_soon, Story 2 absent from default bundle')
console.log('[story2-release-candidate] next action is an explicit release-state change, not more content production')
