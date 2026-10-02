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
const authoredStories = read('src/data/authoredStories.ts')
const assets = read('src/data/authoredStoryAssets.ts')
const overview = read('src/components/SeasonOverview.tsx')
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
  fail('Uzbek Story 2 package must match the RU identity/version')
}
if (scenes.count !== 28 || scenes.total_bytes !== 9071006) {
  fail('scene runtime inventory drifted from 28 assets / 9,071,006 bytes')
}
if (cover.status !== 'approved_hosted_verified') {
  fail('cover must be approved_hosted_verified')
}

for (const marker of [
  "id: 'seven-roads-season-2'",
  "id: 'seven-roads-season-2-story-2'",
  "number: 2",
  "status: 'published'",
  "taynaVostochnogoKaravanaV4ByLanguage[language]",
  "completionScope: 'story'",
  "readerUnit: 'part'",
  "stories: [publishedStory]",
]) {
  if (!seasons.includes(marker)) fail(`published Season 2 marker missing: ${marker}`)
}

for (const marker of [
  'taynaVostochnogoKaravanaV4.ru.json',
  'taynaVostochnogoKaravanaV4.uz.json',
  'taynaVostochnogoKaravanaV4ByLanguage',
]) {
  if (!authoredStories.includes(marker)) fail(`published authored Story 2 marker missing: ${marker}`)
}

if (!overview.includes("publishedStories.length > 1 || seasonStory.completionScope === 'story'")) {
  fail('Season 2 Story 2 must open through story-card overview even when it is the only published story')
}
if (!assets.includes('VITE_QISSA_STORY2_RUNTIME_ASSETS_READY')) {
  fail('Story 2 runtime registry readiness gate is missing')
}
for (const marker of [
  'VITE_QISSA_STORY2_PREVIEW: false',
  'VITE_QISSA_STORY2_RUNTIME_ASSETS_READY: true',
  'npm run check:story2-bundle-open',
]) {
  if (!deploy.includes(marker)) fail(`production deploy release marker missing: ${marker}`)
}
for (const marker of [
  'smoke:story2-cover-live -- present',
  'smoke:story2-assets-live -- present',
  'check:story2-bundle-open',
  'smoke:story2-resume-gallery',
]) {
  if (!ci.includes(marker)) fail(`release CI marker missing: ${marker}`)
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[story2-release-open] ${error}`))
  process.exit(1)
}

console.log('[story2-release-open] PASS')
console.log('[story2-release-open] Season 2 publishes Story 2 as story #2')
console.log('[story2-release-open] RU/UZ authored packages are in the public registry')
console.log('[story2-release-open] 28 scenes + cover are hosted and locked')
console.log('[story2-release-open] production runtime flag is enabled and bundle-open check is required')
