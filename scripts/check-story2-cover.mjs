import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const story = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/data/authored/taynaVostochnogoKaravanaV4.ru.json'),
    'utf8',
  ),
)
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/story2/story2_cover_runtime_inventory.json'),
    'utf8',
  ),
)
const assetRegistrySource = fs.readFileSync(
  path.join(root, 'src/data/authoredStoryAssets.ts'),
  'utf8',
)

const errors = []
const fail = (message) => errors.push(message)

if (story.cover_illustration.asset_id !== 'seven_roads_story2_cover_v1') {
  fail(`unexpected cover asset id: ${story.cover_illustration.asset_id}`)
}
if (story.cover_illustration.status !== 'approved') {
  fail(`Story 2 cover must be approved, got ${story.cover_illustration.status}`)
}
if (story.cover_illustration.runtime_url !== null) {
  fail('Story 2 cover runtime_url must stay null because runtime resolution is registry-based')
}
if (!assetRegistrySource.includes("'seven_roads_story2_cover_v1'")) {
  fail('Story 2 cover must be staged in the readiness-gated asset registry')
}

if (inventory.version !== 'story2-cover-runtime-webp-1') {
  fail(`unexpected cover inventory version: ${inventory.version}`)
}
if (inventory.asset_id !== story.cover_illustration.asset_id) {
  fail('cover inventory asset_id does not match authored package')
}
if (inventory.filename !== `${inventory.asset_id}.webp`) {
  fail(`unexpected cover filename: ${inventory.filename}`)
}
if (inventory.width !== 1024 || inventory.height !== 1536) {
  fail(`Story 2 cover must be 1024x1536, got ${inventory.width}x${inventory.height}`)
}
if (inventory.width / inventory.height !== 2 / 3) {
  fail('Story 2 cover must be exact 2:3 portrait')
}
if (!Number.isInteger(inventory.bytes) || inventory.bytes <= 0 || inventory.bytes > 5 * 1024 * 1024) {
  fail(`invalid cover byte size: ${inventory.bytes}`)
}
if (!/^[a-f0-9]{64}$/.test(inventory.sha256 ?? '')) {
  fail('invalid cover sha256')
}
if (inventory.supabase_bucket !== 'story-images') {
  fail(`unexpected cover bucket: ${inventory.supabase_bucket}`)
}
if (
  inventory.supabase_object_path !==
  'seven-roads/story2_v2/seven_roads_story2_cover_v1.webp'
) {
  fail(`unexpected cover object path: ${inventory.supabase_object_path}`)
}
if (
  inventory.source_approved_library_path !==
  '/QISSA/production/seven_roads/story2_v2/approved/seven_roads_story2_cover_v1.png'
) {
  fail('approved Library path drifted')
}
if (
  inventory.source_runtime_library_path !==
  '/QISSA/production/seven_roads/story2_v2/runtime_webp/seven_roads_story2_cover_v1.webp'
) {
  fail('runtime Library path drifted')
}

for (const ref of [
  '01_heroes_horses_approved.png',
  'S2-REF-01_ARAS_CITY.png',
  'S2-REF-07_EASTERN_CARAVAN.png',
]) {
  if (!story.cover_illustration.editorial_reference_ids.includes(ref)) {
    fail(`approved cover reference missing: ${ref}`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[story2-cover] ${error}`))
  process.exit(1)
}

console.log('[story2-cover] PASS')
console.log('[story2-cover] approved asset id: seven_roads_story2_cover_v1')
console.log('[story2-cover] portrait 1024x1536 · exact 2:3')
console.log(`[story2-cover] locked WebP: ${inventory.bytes} bytes · ${inventory.sha256}`)
console.log('[story2-cover] runtime route is staged behind the Story 2 readiness flag; public object verification remains a release gate')
