import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const load = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const source = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const manifest = load('docs/qissa/season2/story7_approved_illustrations_pending_runtime_2026-11-05.json')
const ru = load('src/data/authored/staging/season2Story7BackToOrdan.ru.json')
const uz = load('src/data/authored/staging/season2Story7BackToOrdan.uz.json')
const registry = source('src/data/authoredStoryAssets.ts')
const gallery = source('src/lib/authoredIllustrationDiscovery.ts')
const errors = []
const fail = message => errors.push(message)
const paragraphs = text => String(text ?? '').split(/\n\n+/).map(p => p.trim()).filter(Boolean)
const ruPart = ru.parts?.find(p => p.part_id === manifest.part_id)
const uzPart = uz.parts?.find(p => p.part_id === manifest.part_id)
const expectedPrefix = 'seven-roads/season2_tier_a_v2/'
const publicPrefix = 'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'

if (manifest.schema_version !== 'qissa-season2-story7-approved-art-handoff-1') fail('Unexpected handoff schema')
if (manifest.status !== 'owner_approved_library_and_supabase_verified') fail('Story 7 art not owner-approved and verified')
if (manifest.publication_state !== 'season2_unpublished') fail('Must keep Season 2 unpublished')
if (manifest.supabase_bucket !== 'story-images' || manifest.supabase_prefix !== expectedPrefix) fail('Unexpected Storage bucket/prefix')
if (manifest.hosting !== 'hosted_verified' || manifest.runtime_binding !== 'hosted_registry_resolved') fail('Hosted Story 7 assets must be registry-resolved')
if (!manifest.storage_discovery?.hashes_verified ||
    manifest.storage_discovery?.public_verification?.workflow_result !== 'success') {
  fail('Missing independent public hash verification evidence')
}
if (manifest.assets?.length !== 2 || manifest.approved_asset_count !== 2) fail('Two new illustrations required')
if (manifest.cancelled_asset_slot !== 'S2-ST7-SEAL-DEFECT-DETAIL') fail('Rejected seal macro should stay cancelled')
if (!ruPart || !uzPart) fail('Missing matching RU/UZ part')
if (ru.illustration_plan?.shared_asset_count !== 4 ||
    ru.illustration_plan?.choice_asset_count !== 0 ||
    ru.illustration_plan?.cover_asset_count !== 1 ||
    ru.illustration_plan?.planned_asset_count !== 5 ||
    ru.illustration_plan?.visible_assets_per_playthrough !== 5) {
  fail('Story 7 should have 4 shared frames + 1 shared Season 2 cover')
}
if (!gallery.includes('part.image_slots.filter') || !gallery.includes('part.image_slots.forEach')) {
  fail('Gallery discovery no longer considers shared image slots')
}

const slotIds = new Set()
for (const asset of manifest.assets ?? []) {
  if (slotIds.has(asset.slot_id)) fail('Duplicate approved slot ' + asset.slot_id)
  slotIds.add(asset.slot_id)
  if (!/^[a-f0-9]{64}$/.test(asset.sha256 ?? '') ||
      !/^[a-f0-9]{64}$/.test(asset.master_sha256 ?? '')) fail('Invalid SHA-256: ' + asset.slot_id)
  if (asset.bytes <= 0 || asset.master_bytes <= 0 ||
      asset.width !== 1536 || asset.height !== 864) fail('Unexpected size/dimensions for ' + asset.slot_id)
  if (asset.hosting !== 'hosted_verified' ||
      asset.runtime_object_path !== expectedPrefix + asset.filename ||
      asset.runtime_public_url !== publicPrefix + expectedPrefix + asset.filename) fail('Object URL drift: ' + asset.slot_id)
  if (paragraphs(ruPart?.story_text).filter(p => p === asset.after_text_ru).length !== 1 ||
      paragraphs(uzPart?.story_text).filter(p => p === asset.after_text_uz).length !== 1) fail('Nonunique translated anchor: ' + asset.slot_id)
  const image = (ruPart?.image_slots ?? []).find(s => s.slot_id === asset.slot_id)
  if (!image || image.asset_id !== asset.asset_id ||
      image.after_text !== asset.after_text_ru ||
      image.kind !== 'shared' ||
      image.phase !== 'story_text' ||
      image.status !== 'approved' ||
      image.runtime_url !== null) fail('RU shared slot not registered correctly: ' + asset.slot_id)
  if (uzPart?.image_anchor_texts?.[asset.slot_id] !== asset.after_text_uz) fail('UZ slot anchor mismatch: ' + asset.slot_id)
  if (!registry.includes("'" + asset.asset_id + "'") ||
      !registry.includes('season2_tier_a_v2')) fail('Hosted asset missing from v2 registry: ' + asset.asset_id)
}
const allSlots = ruPart?.image_slots ?? []
if (allSlots.length !== 4 || new Set(allSlots.map(s => s.slot_id)).size !== 4) fail('Story 7 must have 4 unique shared slots')
for (const id of ['S2-ST7-TIERA-SEAL-COMPARISON', 'S2-ST7-TIERA-ENDING-HOOK']) {
  if (!allSlots.some(s => s.slot_id === id)) fail('Previously approved Story 7 slot lost: ' + id)
}
if (allSlots.some(s => s.slot_id === manifest.cancelled_asset_slot)) fail('Cancelled seal micro-detail was reinstated')
if ((ruPart?.illustration_refs ?? []).length !== 4) fail('Story 7 must list four narrative asset refs')
const decisions = (ruPart?.decision?.choices ?? []).map(c => c.choice_id)
if (JSON.stringify(decisions) !== JSON.stringify(['story7_choice_1a_nadir_statement','story7_choice_1b_theft_inventory'])) fail('Persisted choice IDs changed')
if (JSON.stringify((uzPart?.decision?.choices ?? []).map(c => c.choice_id)) !== JSON.stringify(decisions)) fail('Uzbek choice IDs drifted')
if (Object.keys(uzPart?.image_anchor_texts ?? {}).length !== 4) fail('Uzbek shared slot count drifted')
if (errors.length) {
  errors.forEach(error => console.error('[story7-approved-art] ' + error))
  process.exit(1)
}
console.log('[story7-approved-art] PASS: 2 new hosted SHA-256 verified assets, 4 shared image slots, RU/UZ anchors and gallery discovery')
console.log('[story7-approved-art] Existing approved E7 images and both persisted choices preserved; Season 2 remains unpublished')
