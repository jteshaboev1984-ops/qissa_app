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
    path.join(root, 'docs/qissa/story2/story2_runtime_asset_inventory.json'),
    'utf8',
  ),
)
const assetRegistrySource = fs.readFileSync(
  path.join(root, 'src/data/authoredStoryAssets.ts'),
  'utf8',
)
const viteEnvSource = fs.readFileSync(
  path.join(root, 'src/vite-env.d.ts'),
  'utf8',
)
const appSource = fs.readFileSync(
  path.join(root, 'src/App.tsx'),
  'utf8',
)
const deployPagesSource = fs.readFileSync(
  path.join(root, '.github/workflows/deploy-pages.yml'),
  'utf8',
)

const errors = []
const fail = (message) => errors.push(message)

if (inventory.version !== 'story2-runtime-webp-3') {
  fail(`unexpected runtime inventory version: ${inventory.version}`)
}
if (inventory.count !== 28) fail(`expected 28 runtime assets, got ${inventory.count}`)
if (!Array.isArray(inventory.items) || inventory.items.length !== 28) {
  fail(`runtime inventory must contain exactly 28 items`)
}

const expectedSceneAssetIds = new Set([
  ...story.parts.flatMap((part) => (part.image_slots ?? []).map((slot) => slot.asset_id)),
  ...story.parts.flatMap((part) =>
    (part.decision?.choices ?? [])
      .map((choice) => choice.illustration?.asset_id)
      .filter(Boolean),
  ),
])

if (expectedSceneAssetIds.size !== 28) {
  fail(`Story 2 package must reference 28 unique scene assets, got ${expectedSceneAssetIds.size}`)
}

const seen = new Set()
let totalBytes = 0

for (const item of inventory.items ?? []) {
  const {
    asset_id: assetId,
    filename,
    width,
    height,
    bytes,
    sha256,
    supabase_bucket: bucket,
    supabase_object_path: objectPath,
  } = item

  if (!expectedSceneAssetIds.has(assetId)) {
    fail(`runtime inventory contains unknown asset: ${assetId}`)
  }
  if (seen.has(assetId)) fail(`duplicate runtime asset: ${assetId}`)
  seen.add(assetId)

  if (filename !== `${assetId}.webp`) {
    fail(`${assetId}: filename must be ${assetId}.webp`)
  }
  if (bucket !== 'story-images') {
    fail(`${assetId}: bucket must be story-images`)
  }
  if (objectPath !== `seven-roads/story2_v2/${assetId}.webp`) {
    fail(`${assetId}: unexpected object path ${objectPath}`)
  }

  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    fail(`${assetId}: width/height must be integers`)
  } else {
    if (width !== 1536 || height !== 1024) {
      fail(`${assetId}: runtime image must be full-resolution 1536x1024, got ${width}x${height}`)
    }
  }

  if (!Number.isInteger(bytes) || bytes <= 0) {
    fail(`${assetId}: invalid byte size`)
  } else {
    totalBytes += bytes
  }

  if (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sha256)) {
    fail(`${assetId}: invalid sha256`)
  }
}

for (const assetId of expectedSceneAssetIds) {
  if (!seen.has(assetId)) fail(`runtime inventory missing Story 2 asset: ${assetId}`)
  if (!assetRegistrySource.includes(`'${assetId}'`)) {
    fail(`Story 2 runtime registry is missing asset id: ${assetId}`)
  }
}

if (!assetRegistrySource.includes('VITE_QISSA_STORY2_RUNTIME_ASSETS_READY')) {
  fail('Story 2 runtime assets must remain gated behind the readiness flag')
}
if (!viteEnvSource.includes('VITE_QISSA_STORY2_RUNTIME_ASSETS_READY')) {
  fail('vite-env.d.ts is missing the Story 2 runtime readiness flag')
}
if (!viteEnvSource.includes('VITE_QISSA_STORY2_PREVIEW')) {
  fail('vite-env.d.ts is missing the Story 2 preview flag')
}
if (!appSource.includes("import.meta.env.VITE_QISSA_STORY2_PREVIEW === 'true'")) {
  fail('Story 2 preview route must require its dedicated preview flag')
}
if (!deployPagesSource.includes('VITE_QISSA_STORY2_PREVIEW: false')) {
  fail('production Pages must keep Story 2 preview disabled before release')
}
if (!deployPagesSource.includes('VITE_QISSA_STORY2_RUNTIME_ASSETS_READY: false')) {
  fail('production Pages must keep Story 2 runtime assets disabled before release')
}
for (const command of [
  'npm run check:authored-story2',
  'npm run check:story2-runtime',
]) {
  if (!deployPagesSource.includes(command)) {
    fail(`production Pages build is missing release gate: ${command}`)
  }
}

if (inventory.total_bytes !== totalBytes) {
  fail(`inventory total_bytes=${inventory.total_bytes} but item sum=${totalBytes}`)
}
if (inventory.total_bytes !== 9071006) {
  fail(`unexpected locked Story 2 runtime byte total: ${inventory.total_bytes}`)
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[story2-runtime] ${error}`))
  process.exit(1)
}

console.log('[story2-runtime] PASS')
console.log('[story2-runtime] 28/28 Story 2 scene assets mapped')
console.log('[story2-runtime] all 28 runtime images are full-resolution 1536x1024')
console.log('[story2-runtime] runtime URL registry is complete and remains readiness-gated')
console.log('[story2-runtime] production Pages keeps Story 2 preview and runtime assets disabled')
console.log(`[story2-runtime] locked total: ${inventory.total_bytes} bytes`)
