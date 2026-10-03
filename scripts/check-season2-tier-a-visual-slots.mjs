import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const manifestPath = path.join(
  root,
  'src/data/authored/season2TierAVisualSlots.json',
)
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const story2Layout = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/story2/story2_v4_layout_manifest.json'),
    'utf8',
  ),
)
const authoredAssetsSource = fs.readFileSync(
  path.join(root, 'src/data/authoredStoryAssets.ts'),
  'utf8',
)
const runtimeSlotsSource = fs.readFileSync(
  path.join(root, 'src/data/season2TierAVisualSlots.ts'),
  'utf8',
)
const packageSource = fs.readFileSync(path.join(root, 'package.json'), 'utf8')
const ciSource = fs.readFileSync(
  path.join(root, '.github/workflows/ci.yml'),
  'utf8',
)

const errors = []
const fail = (message) => errors.push(message)

if (manifest.version !== 'season2-tier-a-visual-slots-1') {
  fail(`unexpected manifest version: ${manifest.version}`)
}
if (manifest.status !== 'implementation-staging') {
  fail(`unexpected manifest status: ${manifest.status}`)
}
if (manifest.world_id !== 'seven_roads') {
  fail(`unexpected world id: ${manifest.world_id}`)
}
if (manifest.season_number !== 2) {
  fail(`unexpected season number: ${manifest.season_number}`)
}
if (
  manifest.library_master_root !==
  '/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames'
) {
  fail(`unexpected master root: ${manifest.library_master_root}`)
}
if (!Array.isArray(manifest.slots) || manifest.slots.length !== 12) {
  fail(`expected exactly 12 Tier A slot bindings, got ${manifest.slots?.length ?? 0}`)
}

const expectedPerStory = new Map([
  [1, 2],
  [2, 2],
  [3, 1],
  [4, 1],
  [5, 2],
  [6, 2],
  [7, 2],
])

const slotIds = new Set()
const assetIds = new Set()
const counts = new Map()

const story2LayoutSlots = [
  ...story2Layout.parts.flatMap((part) => part.image_slots ?? []),
  ...story2Layout.parts.flatMap((part) =>
    (part.decision?.choices ?? [])
      .map((choice) => choice.illustration)
      .filter(Boolean),
  ),
]
const story2BySlot = new Map(
  story2LayoutSlots.map((slot) => [slot.slot_id, slot]),
)

for (const slot of manifest.slots ?? []) {
  counts.set(slot.story_number, (counts.get(slot.story_number) ?? 0) + 1)

  if (!Number.isInteger(slot.story_number) || slot.story_number < 1 || slot.story_number > 7) {
    fail(`${slot.slot_id}: invalid story_number ${slot.story_number}`)
  }
  if (!slot.story_title_ru?.trim()) {
    fail(`${slot.slot_id}: story_title_ru is required`)
  }
  if (!slot.source_reference?.trim()) {
    fail(`${slot.slot_id}: source_reference is required`)
  }
  if (!slot.slot_id?.trim()) {
    fail('slot_id is required')
  } else if (slotIds.has(slot.slot_id)) {
    fail(`duplicate slot_id: ${slot.slot_id}`)
  } else {
    slotIds.add(slot.slot_id)
  }

  if (!slot.asset_id?.trim()) {
    fail(`${slot.slot_id}: asset_id is required`)
  } else if (assetIds.has(slot.asset_id)) {
    fail(`duplicate asset_id: ${slot.asset_id}`)
  } else {
    assetIds.add(slot.asset_id)
  }

  if (slot.master_filename !== `${slot.asset_id}.png`) {
    fail(
      `${slot.slot_id}: master filename must equal asset id + .png; got ${slot.master_filename}`,
    )
  }
  const expectedMasterPath = `${manifest.library_master_root}/${slot.master_filename}`
  if (slot.master_library_path !== expectedMasterPath) {
    fail(
      `${slot.slot_id}: master path mismatch; expected ${expectedMasterPath}, got ${slot.master_library_path}`,
    )
  }
  if (slot.behavior !== 'show_after_anchor') {
    fail(`${slot.slot_id}: unsupported behavior ${slot.behavior}`)
  }
  if (!slot.after_text?.trim()) {
    fail(`${slot.slot_id}: after_text anchor is required`)
  }

  if (slot.story_number === 2) {
    if (slot.runtime_state !== 'published-existing-runtime') {
      fail(`${slot.slot_id}: Story 2 Tier A cross-link must remain published-existing-runtime`)
    }
    const story2Slot = story2BySlot.get(slot.slot_id)
    if (!story2Slot) {
      fail(`${slot.slot_id}: missing from Story 2 layout manifest`)
    } else {
      if (story2Slot.asset_id !== slot.asset_id) {
        fail(
          `${slot.slot_id}: Story 2 asset mismatch; layout=${story2Slot.asset_id}, TierA=${slot.asset_id}`,
        )
      }
      if (story2Slot.after_text !== slot.after_text) {
        fail(`${slot.slot_id}: Story 2 after_text anchor drifted from the published layout`)
      }
    }
    if (!authoredAssetsSource.includes(`'${slot.asset_id}'`)) {
      fail(`${slot.slot_id}: published Story 2 asset is missing from authoredStoryAssets.ts`)
    }
  } else {
    if (slot.runtime_state !== 'staged-master-only') {
      fail(`${slot.slot_id}: unpublished Story ${slot.story_number} must remain staged-master-only`)
    }
    if (
      authoredAssetsSource.includes(`'${slot.asset_id}'`) ||
      authoredAssetsSource.includes(`"${slot.asset_id}"`)
    ) {
      fail(
        `${slot.slot_id}: staged asset must not enter authoredStoryAssets.ts before hosting/publication`,
      )
    }
  }
}

for (const [storyNumber, expectedCount] of expectedPerStory) {
  const actualCount = counts.get(storyNumber) ?? 0
  if (actualCount !== expectedCount) {
    fail(
      `Story ${storyNumber}: expected ${expectedCount} Tier A bindings, got ${actualCount}`,
    )
  }
}

if (!manifest.runtime_policy?.published_story2_assets_remain_authoritative) {
  fail('runtime policy must preserve published Story 2 asset authority')
}
if (!manifest.runtime_policy?.staged_assets_must_not_enter_authoredStoryAssets_until_hosted) {
  fail('runtime policy must prohibit staged assets from authoredStoryAssets until hosted')
}
if (!runtimeSlotsSource.includes("rawManifest as Season2TierAVisualSlotManifest")) {
  fail('typed Season 2 Tier A slot registry is not wired to the JSON manifest')
}
if (!packageSource.includes('"check:season2-tier-a-slots"')) {
  fail('package.json is missing check:season2-tier-a-slots')
}
if (!ciSource.includes('npm run check:season2-tier-a-slots')) {
  fail('Seven Roads CI is missing the Season 2 Tier A slot validation step')
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[season2-tier-a-slots] ${error}`))
  process.exit(1)
}

console.log('[season2-tier-a-slots] PASS')
console.log('[season2-tier-a-slots] 12/12 approved Tier A frames bound to exact story anchors')
console.log('[season2-tier-a-slots] Story 2 cross-links match the published V4 layout')
console.log('[season2-tier-a-slots] Stories 1 and 3-7 remain staged and cannot leak into runtime assets early')
