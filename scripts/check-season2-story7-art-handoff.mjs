import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/qissa/season2/story7_approved_illustrations_pending_runtime_2026-11-05.json'), 'utf8'))
const ru = JSON.parse(fs.readFileSync(path.join(root, 'src/data/authored/staging/season2Story7BackToOrdan.ru.json'), 'utf8'))
const uz = JSON.parse(fs.readFileSync(path.join(root, 'src/data/authored/staging/season2Story7BackToOrdan.uz.json'), 'utf8'))
const resolver = fs.readFileSync(path.join(root, 'src/data/authoredStoryAssets.ts'), 'utf8')
const errors = []
const fail = message => errors.push(message)
const paragraphs = text => String(text ?? '').split(/\n\n+/).map(p => p.trim()).filter(Boolean)
const ruPart = ru.parts?.find(p => p.part_id === manifest.part_id)
const uzPart = uz.parts?.find(p => p.part_id === manifest.part_id)

if (manifest.schema_version !== 'qissa-season2-story7-approved-art-handoff-1') fail('Unknown handoff schema')
if (manifest.status !== 'owner_approved_library_verified_pending_supabase_storage') fail('Do not claim hosted before verifying Storage')
if (manifest.publication_state !== 'season2_unpublished') fail('Season 2 must stay unpublished')
if (manifest.hosting !== 'not_uploaded_not_verified' || manifest.runtime_binding !== 'not_integrated') fail('The pending-art manifest must not assert runtime readiness')
if (manifest.assets?.length !== 2 || manifest.approved_asset_count !== 2) fail('Exactly two new accepted frames required')
if (manifest.cancelled_asset_slot !== 'S2-ST7-SEAL-DEFECT-DETAIL') fail('The rejected seal micro-detail must remain cancelled')
if (!ruPart || !uzPart) fail('Missing RU/UZ part')

const ids = new Set()
for (const asset of manifest.assets ?? []) {
  if (ids.has(asset.slot_id)) fail('Duplicate new slot ' + asset.slot_id)
  ids.add(asset.slot_id)
  if (!/^([a-f0-9]{64})$/.test(asset.sha256 ?? '') || !/^([a-f0-9]{64})$/.test(asset.master_sha256 ?? '')) fail('Invalid sha256 for '+asset.slot_id)
  if (!asset.filename.endsWith('.webp') || !asset.master_filename.endsWith('.png')) fail('Unexpected format for '+asset.slot_id)
  if (asset.bytes <= 0 || asset.master_bytes <= 0) fail('Invalid byte size for '+asset.slot_id)
  if (paragraphs(ruPart?.story_text).filter(p=>p===asset.after_text_ru).length!==1) fail('RU anchor not unique for '+asset.slot_id)
  if (paragraphs(uzPart?.story_text).filter(p=>p===asset.after_text_uz).length!==1) fail('UZ anchor not unique for '+asset.slot_id)
  if ((ruPart?.image_slots ?? []).some(s=>s.slot_id===asset.slot_id)) fail('New slot was bound before verified Storage: '+asset.slot_id)
  if (resolver.includes(asset.asset_id)) fail('New asset resolver was registered before verified Storage: '+asset.slot_id)
}
const actualChoices=(ruPart?.decision?.choices ?? []).map(c=>c.choice_id)
if (JSON.stringify(actualChoices)!==JSON.stringify(['story7_choice_1a_nadir_statement','story7_choice_1b_theft_inventory'])) fail('Persisted choice IDs changed')
const existing = (ruPart?.image_slots ?? []).map(s=>s.slot_id)
for (const id of ['S2-ST7-TIERA-SEAL-COMPARISON','S2-ST7-TIERA-ENDING-HOOK']) if (!existing.includes(id)) fail('Previously approved slot missing: '+id)
if (errors.length) {
  for (const error of errors) console.error('[story7-art-handoff] '+error)
  process.exit(1)
}
console.log('[story7-art-handoff] PASS: two owner-approved unhosted images, exact RU/UZ anchors, existing choices and art protected')
