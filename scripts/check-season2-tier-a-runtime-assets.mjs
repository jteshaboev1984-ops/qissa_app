import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/season2/season2_tier_a_runtime_asset_inventory.json'),
    'utf8',
  ),
)
const slots = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/data/authored/season2TierAVisualSlots.json'),
    'utf8',
  ),
)
const assetsSource = fs.readFileSync(
  path.join(root, 'src/data/authoredStoryAssets.ts'),
  'utf8',
)

const errors = []
const fail = (message) => errors.push(message)

if (inventory.version !== 'season2-tier-a-runtime-webp-1') {
  fail(`unexpected inventory version: ${inventory.version}`)
}
if (inventory.status !== 'hosted_verified') {
  fail(`unexpected inventory status: ${inventory.status}`)
}
if (inventory.count !== 10) {
  fail(`expected 10 staged runtime assets, got ${inventory.count}`)
}
if (!Array.isArray(inventory.items) || inventory.items.length !== 10) {
  fail('runtime inventory must contain exactly 10 items')
}
if (inventory.supabase_bucket !== 'story-images') {
  fail(`unexpected bucket: ${inventory.supabase_bucket}`)
}
if (inventory.supabase_prefix !== 'seven-roads/season2_tier_a_v1/') {
  fail(`unexpected Supabase prefix: ${inventory.supabase_prefix}`)
}
if (
  inventory.runtime_library_root !==
  '/QISSA/production/seven_roads/season2_visual_final/runtime_webp_v1/'
) {
  fail(`unexpected runtime Library root: ${inventory.runtime_library_root}`)
}

const stagedSlots = (slots.slots ?? []).filter(
  (slot) => slot.runtime_state === 'staged-master-only',
)
if (stagedSlots.length !== 10) {
  fail(`expected 10 staged Tier A slots outside Story 2, got ${stagedSlots.length}`)
}

const expectedByAssetId = new Map(
  stagedSlots.map((slot) => [slot.asset_id, slot]),
)
const seenAssetIds = new Set()
const seenSlotIds = new Set()
let totalBytes = 0

for (const item of inventory.items ?? []) {
  const {
    asset_id: assetId,
    filename,
    story_number: storyNumber,
    slot_id: slotId,
    source_width: sourceWidth,
    source_height: sourceHeight,
    width,
    height,
    bytes,
    sha256,
    supabase_object_path: objectPath,
    status,
  } = item

  const slot = expectedByAssetId.get(assetId)
  if (!slot) {
    fail(`${assetId}: inventory asset is not a staged Tier A slot`)
  } else {
    if (slot.slot_id !== slotId) {
      fail(`${assetId}: slot mismatch, expected ${slot.slot_id}, got ${slotId}`)
    }
    if (slot.story_number !== storyNumber) {
      fail(`${assetId}: story mismatch, expected ${slot.story_number}, got ${storyNumber}`)
    }
  }

  if (seenAssetIds.has(assetId)) fail(`duplicate asset_id: ${assetId}`)
  seenAssetIds.add(assetId)
  if (seenSlotIds.has(slotId)) fail(`duplicate slot_id: ${slotId}`)
  seenSlotIds.add(slotId)

  if (filename !== `${assetId}.webp`) {
    fail(`${assetId}: filename must be ${assetId}.webp`)
  }
  if (
    objectPath !==
    `seven-roads/season2_tier_a_v1/${assetId}.webp`
  ) {
    fail(`${assetId}: unexpected object path ${objectPath}`)
  }
  if (status !== 'hosted_verified') {
    fail(`${assetId}: expected hosted_verified, got ${status}`)
  }
  const expectedPublicUrl =
    `https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/${objectPath}`
  if (item.public_url !== expectedPublicUrl) {
    fail(`${assetId}: unexpected public_url ${item.public_url}`)
  }

  for (const [label, value] of [
    ['source_width', sourceWidth],
    ['source_height', sourceHeight],
    ['width', width],
    ['height', height],
  ]) {
    if (!Number.isInteger(value) || value <= 0) {
      fail(`${assetId}: invalid ${label}=${value}`)
    }
  }
  if (width > 1536) {
    fail(`${assetId}: runtime width must be <=1536, got ${width}`)
  }
  if (width > sourceWidth || height > sourceHeight) {
    fail(`${assetId}: runtime derivative must not upscale the approved master`)
  }

  if (!Number.isInteger(bytes) || bytes <= 0 || bytes > 5_242_880) {
    fail(`${assetId}: invalid byte size ${bytes}`)
  } else {
    totalBytes += bytes
  }
  if (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sha256)) {
    fail(`${assetId}: invalid sha256`)
  }

  if (
    !assetsSource.includes(`'${assetId}'`) &&
    !assetsSource.includes(`"${assetId}"`)
  ) {
    fail(`${assetId}: hosted runtime asset is missing from authoredStoryAssets.ts`)
  }
}

for (const slot of stagedSlots) {
  if (!seenAssetIds.has(slot.asset_id)) {
    fail(`missing runtime derivative for staged slot ${slot.slot_id}: ${slot.asset_id}`)
  }
}

if (inventory.total_bytes !== totalBytes) {
  fail(
    `inventory total_bytes=${inventory.total_bytes} but item sum=${totalBytes}`,
  )
}
if (inventory.total_bytes !== 3386868) {
  fail(`unexpected locked Tier A runtime byte total: ${inventory.total_bytes}`)
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[season2-tier-a-runtime] ${error}`))
  process.exit(1)
}

console.log('[season2-tier-a-runtime] PASS')
console.log('[season2-tier-a-runtime] 10/10 staged approved masters have locked WebP derivatives')
console.log('[season2-tier-a-runtime] all objects target story-images/seven-roads/season2_tier_a_v1/')
console.log('[season2-tier-a-runtime] hosted assets are registered through the verified Season 2 Tier A public prefix')
console.log(`[season2-tier-a-runtime] locked total: ${inventory.total_bytes} bytes`)
