import fs from 'node:fs'
import crypto from 'node:crypto'

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'))
const source = path => fs.readFileSync(path, 'utf8')
const manifest = json('docs/qissa/season2/story3_approved_illustrations_2026-11-09.json')
const yard = json('docs/qissa/season2/story3_sarvan_yard_approved_2026-11-10.json')
const ru = json('src/data/authored/staging/season2Story3TwoTowers.ru.json')
const uz = json('src/data/authored/staging/season2Story3TwoTowers.uz.json')
const inventory = json('docs/qissa/season2/season2_staging_authored_package_inventory.json')
const assets = source('src/data/authoredStoryAssets.ts')
const gallery = source('src/lib/authoredIllustrationDiscovery.ts')
const engine = source('src/features/authoredStory/engine.ts')
const errors = []
const fail = message => errors.push(message)
const paragraphs = text => String(text ?? '').split(/\n\n+/).map(x => x.trim()).filter(Boolean)
const prefix = 'seven-roads/season2_tier_a_v2/'
const publicPrefix = 'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'
const expected = [
  {
    slot_id: 'S2-ST3-SARVAN-MARKET',
    part_id: 'story3_part_2_courier_route',
    asset_id: 'seven_roads_s2_story3_sarvan_market_01_APPROVED',
    phase: 'story_text',
    ru: 'Она купила маленький свёрток и протянула ему.',
    uz: 'Samira kichik tuguncha sotib olib, unga uzatdi.',
    bytes: 491024,
    sha256: '2ef6ca2f45d224a78e287bc9d727dd7332a2d416b5b673c4646494885440b352',
  },
  {
    slot_id: 'S2-ST3-GUARDHOUSE-MAP',
    part_id: 'story3_part_3_three_pillars',
    asset_id: 'seven_roads_s2_story3_guardhouse_two_drawings_map_01_APPROVED',
    phase: 'post_choice_text',
    ru: 'На стол положили два рисунка.',
    uz: 'Stol ustiga ikki rasm qo‘yildi.',
    bytes: 221742,
    sha256: 'c8900230df26cefa8b664d667cd87ebf16e95e843c6546dc2dc5052e40233aa3',
  },
]
if (manifest.schema_version !== 'qissa-season2-story3-approved-art-v1' ||
    manifest.approval !== 'owner_approved_market_and_guardhouse_only' ||
    manifest.remote_state !== 'sha_verified' ||
    manifest.publication_state !== 'unpublished' ||
    manifest.bucket !== 'story-images' || manifest.prefix !== prefix ||
    manifest.assets?.length !== 2 || ru.story_id !== 'seven_roads_dve_bashni') {
  fail('Approved Story 3 manifest or publication state invalid; remote SHA verification must pass')
}
if (ru.illustration_plan?.shared_asset_count !== 4 ||
    ru.illustration_plan?.planned_asset_count !== 5 ||
    ru.illustration_plan?.cover_asset_count !== 1 ||
    ru.illustration_plan?.choice_asset_count !== 0 ||
    ru.illustration_plan?.visible_assets_per_playthrough !== 5) {
  fail('Episode 3 illustration count: require four shared scenes and season-wide cover')
}
if (!gallery.includes('part.image_slots.filter') ||
    !gallery.includes('part.image_slots.forEach') ||
    !engine.includes("slotsByAnchor.get(paragraph)")) {
  fail('Gallery discovery / exact paragraph image order drifted')
}
const registryStart=assets.indexOf('const season2TierAV2AssetIds = [')
const registryEnd=assets.indexOf('] as const',registryStart)
const v2Entries=assets.slice(registryStart,registryEnd)
const allSlots = ru.parts.flatMap(p => p.image_slots ?? [])
if (allSlots.length !== 4 || new Set(allSlots.map(s=>s.slot_id)).size!==4 ||
    allSlots[0]?.slot_id !== 'S2-ST3-SARVAN-YARD' ||
    allSlots[1]?.slot_id !== 'S2-ST3-TIERA-NICHE' ||
    Object.keys(uz.parts[0]?.image_anchor_texts ?? {}).join(',') !== 'S2-ST3-SARVAN-YARD,S2-ST3-TIERA-NICHE') {
  fail('Story 3 must place the approved courtyard before the unchanged niche, market and map')
}
for(const [index,e] of expected.entries()) {
  const a=manifest.assets?.[index]
  const r=ru.parts.find(p=>p.part_id===e.part_id)
  const u=uz.parts.find(p=>p.part_id===e.part_id)
  if (!a || a.slot_id !== e.slot_id || a.asset_id !== e.asset_id ||
      a.part_id !== e.part_id || a.phase !== e.phase ||
      a.after_text_ru !== e.ru || a.after_text_uz !== e.uz ||
      a.bytes !== e.bytes || a.sha256 !== e.sha256 ||
      a.filename !== e.asset_id+'.webp' ||
      a.width !== 1672 || a.height !== 941 ||
      !Number.isSafeInteger(a.master_png_bytes) || a.master_png_bytes < 10000 ||
      !/^[a-f0-9]{64}$/.test(a.master_png_sha256)) {
    fail('Manifest mismatch: '+e.slot_id)
  }
  const image=r?.image_slots?.find(s=>s.slot_id===e.slot_id)
  if (!image || image.status !== 'approved' || image.kind !== 'shared' ||
      image.phase !== e.phase || image.after_text !== e.ru ||
      image.asset_id !== e.asset_id || image.runtime_url !== null ||
      !r?.illustration_refs?.includes(e.asset_id)) {
    fail('RU image slot/ref mismatch: '+e.slot_id)
  }
  if (u?.image_anchor_texts?.[e.slot_id] !== e.uz ||
      paragraphs(r?.[e.phase]).filter(t=>t===e.ru).length !== 1 ||
      paragraphs(u?.[e.phase]).filter(t=>t===e.uz).length !== 1 ||
      !v2Entries.includes("'"+e.asset_id+"'")) {
    fail('UZ localized anchor or v2 registry mismatch: '+e.slot_id)
  }
  if (!(publicPrefix+prefix+a.filename).startsWith('https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/')) {
    fail('Unrecognized public Storage path: '+e.asset_id)
  }
}
// One additional owner-approved and independently SHA-verified illustration is
// kept in its own manifest, preserving the earlier market/map approval audit.
const y=yard.asset
const yRu=ru.parts[0]
const yUz=uz.parts[0]
const ySlot=yRu?.image_slots?.[0]
const expectedYardId='seven_roads_s2_story3_sarvan_old_caravan_yard_01_APPROVED'
const expectedYardPath='seven-roads/season2_tier_a_v2/'+expectedYardId+'.webp'
const expectedYardHash='a3058e8032e8e9a4b83d1db714be589c479d7c71ba997529951a5d05ec7e2d04'
const yardOldDraft='seven_roads_s2_story3_sarvan_old_caravan_yard_01_DRAFT.webp'
if (
  yard.schema_version!=='qissa-season2-story3-sarvan-yard-approved-1' ||
  yard.owner_decision!=='approved_corrected_empty_stalls' ||
  yard.status!=='owner_approved_supabase_sha_verified' ||
  yard.publication_state!=='unpublished' ||
  yard.remote_integrity_proof?.status!=='success' ||
  yard.remote_integrity_proof?.github_actions_workflow_run_id!==42796256497 ||
  yard.remote_integrity_proof?.actual_sha256!==expectedYardHash ||
  yard.remote_integrity_proof?.actual_bytes!==413182 ||
  yard.integrated_ru_blob_sha!=='8b9ea5d89115fc6d0bc90d3521875ee9eec76b7f' ||
  yard.integrated_uz_blob_sha!=='5d1e2acdac664a108774931aa5fa1c4dc914cffd' ||
  y?.asset_id!==expectedYardId ||
  y?.slot_id!=='S2-ST3-SARVAN-YARD' ||
  y?.part_id!=='story3_part_1_old_yard_niche' ||
  y?.phase!=='story_text' ||
  y?.kind!=='shared' ||
  y?.hosting!=='hosted_verified' ||
  y?.webp?.bytes!==413182 ||
  y?.webp?.sha256!==expectedYardHash ||
  y?.webp?.width!==1536 || y?.webp?.height!==864 ||
  y?.storage_object_path!==expectedYardPath ||
  y?.public_url!==publicPrefix+expectedYardPath ||
  y?.master_png?.sha256!=='2b6db975fbbceac721b372524d92b348f0ba4ba2e8457608a21fe094a9c4cf3a' ||
  y?.after_text_ru!=='Две узкие башни стояли по сторонам проезда.' ||
  y?.after_text_uz!=='Kirishning ikki tomonida ikkita tor minora turardi.'
) {
  fail('Final owner-approved yard artwork, exact storage/sha256 or historical proof drifted')
}
if (
  ySlot?.asset_id!==expectedYardId ||
  ySlot?.slot_id!=='S2-ST3-SARVAN-YARD' ||
  ySlot?.phase!=='story_text' ||
  ySlot?.kind!=='shared' ||
  ySlot?.status!=='approved' ||
  ySlot?.after_text!==y?.after_text_ru ||
  ySlot?.runtime_url!==null ||
  yRu?.illustration_refs?.[0]!==expectedYardId ||
  yUz?.image_anchor_texts?.[y?.slot_id]!==y?.after_text_uz ||
  paragraphs(yRu?.story_text).filter(t=>t===y?.after_text_ru).length!==1 ||
  paragraphs(yUz?.story_text).filter(t=>t===y?.after_text_uz).length!==1 ||
  !v2Entries.includes("'"+expectedYardId+"'")
) {
  fail('Final yard RU/UZ anchor, illustration registry, or storyboard order drifted')
}
const firstSlots=yRu?.image_slots?.map(s=>s.slot_id)
if (JSON.stringify(firstSlots)!==JSON.stringify(['S2-ST3-SARVAN-YARD','S2-ST3-TIERA-NICHE'])) {
  fail('Courtyard must precede the unchanged niche in Part 1')
}
if ([assets,JSON.stringify(ru),JSON.stringify(uz)].some(s=>s.includes(yardOldDraft))) {
  fail('Previously rejected caravan-yard DRAFT must not be used in runtime')
}

const expectedChoices=[
  'story3_choice_1a_keeper','story3_choice_1b_physical_match',
  'story3_choice_2a_learned_tracks','story3_choice_2b_gate_witnesses',
  'story3_choice_3a_road_book','story3_choice_3b_rider_memory',
]
const choices=parts=>parts.flatMap(p=>(p.decision?.choices??[]).map(c=>c.choice_id))
if (JSON.stringify(choices(ru.parts)) !== JSON.stringify(expectedChoices) ||
    JSON.stringify(choices(uz.parts)) !== JSON.stringify(expectedChoices)) {
  fail('Persisted RU/UZ Story 3 choice IDs changed')
}
const inv=inventory.packages?.find(p=>p.story_number===3)
if (inv?.publication_state !== 'not-published' || inv.tier_a_image_count !== 4 ||
    inv.github_blob_sha !== yard.integrated_ru_blob_sha) {
  fail('Staging inventory count or final RU blob SHA mismatch')
}
if([assets,JSON.stringify(ru),JSON.stringify(uz),JSON.stringify(manifest)].some(s=>s.includes('sarvan_old_caravan_yard_01_DRAFT'))) {
  fail('The non-approved Sarvan yard DRAFT must never be registered')
}
if(errors.length){errors.forEach(x=>console.error('[s2e3-approved-art] '+x));process.exit(1)}
console.log('[s2e3-approved-art] PASS: four approved Story 3 narrative frames plus shared cover; yard precedes niche in RU/UZ, stable choices, SHA-256 verified and season unpublished')
