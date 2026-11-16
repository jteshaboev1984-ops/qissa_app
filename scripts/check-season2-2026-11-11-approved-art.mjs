// QISSA #318: deterministic owner-approved S2E1/S2E5 art integration contract.
// The actual REMOTE binary SHA check is the separate GitHub Actions fetch gate.
import fs from 'node:fs'
import crypto from 'node:crypto'

const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const readText = p => fs.readFileSync(p, 'utf8')
const proof = readJSON('docs/qissa/season2/story1_settlement_story5_fork_approved_2026-11-11.json')
const inventory = readJSON('docs/qissa/season2/season2_staging_authored_package_inventory.json')
const registry = readText('src/data/authoredStoryAssets.ts')
const gallery = readText('src/lib/authoredIllustrationDiscovery.ts')
const reader = readText('src/features/authoredStory/engine.ts')
const root = 'src/data/authored/staging/'
const rows = [
  { number: 1, stem: 'season2Story1RoyalSilver', part: 'story1_part_3_network_sign', slot: 'S2-ST1-NETWORK-SETTLEMENT', id: 'seven_roads_s2_story1_hidden_network_settlement_01_APPROVED',
    ru: 'У длинного стола кто-то раскладывал деревянные жетоны.', uz: 'Uzun stol yonida kimdir yog‘och nishonchalarni terib chiqardi.', phase: 'post_choice_text',
    expectedIds: ['S2-ST1-TIERA-ATTACK','S2-ST1-KAMRAN-RESCUE','S2-ST1-TIERA-PURSUIT','S2-ST1-NETWORK-SETTLEMENT'], expectedCount: 4,
    choices: ['story1_choice_1a_stabilize_harness','story1_choice_1b_reopen_guard_path','story1_choice_2a_follow_tracks','story1_choice_2b_predict_exit','story1_choice_3a_check_gear','story1_choice_3b_check_escape_route'] },
  { number: 5, stem: 'season2Story5FalseRoad', part: 'story5_part_1_false_road', slot: 'S2-ST5-BLANK-FORK', id: 'seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED',
    ru: '— Они открыты. Выбирайте.', uz: '— Ikkalasi ham ochiq. Tanlanglar.', phase: 'story_text',
    expectedIds: ['S2-ST5-TIERA-RED-HILL','S2-ST5-BLANK-FORK','S2-ST5-TIERA-REAL-REINFORCEMENT'], expectedCount: 3,
    choices: ['story5_choice_1a_forest_edge','story5_choice_1b_open_ridge'] },
]
const errors = []
const fail = message => errors.push(message)
const paragraphs = s => String(s||'').split(/\n\n+/).map(p=>p.trim()).filter(Boolean)
const blobSha = contents => {
  const b=Buffer.from(contents)
  return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex')
}
if(proof.owner_status!=='APPROVED' || proof.publication_state!=='unpublished' ||
  proof.storage?.bucket!=='story-images' || proof.remote_integrity_proof?.status!=='success' ||
  proof.remote_integrity_proof?.run_id!==43001538293 ||
  proof.assets?.length!==2)fail('Invalid owner approval or verified remote binary proof')
for(const cfg of rows){
 const ruPath=root+cfg.stem+'.ru.json', uzPath=root+cfg.stem+'.uz.json'
 const ruText=readText(ruPath),uzText=readText(uzPath),ru=JSON.parse(ruText),uz=JSON.parse(uzText)
 const inv=inventory.packages?.find(x=>x.story_number===cfg.number)
 const asset=proof.assets?.find(x=>x.story_number===cfg.number)
 const part=ru.parts.find(x=>x.part_id===cfg.part),localized=uz.parts.find(x=>x.part_id===cfg.part)
 const slots=ru.parts.flatMap(p=>p.image_slots||[])
 const anchor=part?.image_slots?.find(s=>s.slot_id===cfg.slot)
 const expectedWebpPath=proof.storage.prefix+cfg.id+'.webp'
 const expectedUrl='https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'+expectedWebpPath
 if(ru.story_id!==uz.story_id||ru.language!=='ru'||uz.language!=='uz' ||
    inv?.publication_state!=='not-published'||inv?.tier_a_image_count!==cfg.expectedCount ||
    inv?.github_blob_sha!==blobSha(ruText) || asset?.integrated_ru_blob_sha!==blobSha(ruText) ||
    asset?.integrated_uz_blob_sha!==blobSha(uzText)) fail(`S2E${cfg.number}: staging identity, SHA or unpublished inventory drift`)
 if(JSON.stringify(slots.map(s=>s.slot_id))!==JSON.stringify(cfg.expectedIds) ||
    ru.illustration_plan?.shared_asset_count!==cfg.expectedCount ||
    ru.illustration_plan?.planned_asset_count!==cfg.expectedCount+1 ||
    ru.illustration_plan?.visible_assets_per_playthrough!==cfg.expectedCount+1 ||
    ru.illustration_plan?.cover_asset_count!==1 ||
    ru.illustration_plan?.choice_asset_count!==0)fail(`S2E${cfg.number}: visual ordering/count drift`)
 if(anchor?.asset_id!==cfg.id||anchor?.kind!=='shared'||anchor?.status!=='approved' ||
    anchor?.phase!==cfg.phase||anchor?.after_text!==cfg.ru||anchor?.runtime_url!==null ||
    !part?.illustration_refs?.includes(cfg.id) ||
    localized?.image_anchor_texts?.[cfg.slot]!==cfg.uz ||
    paragraphs(part?.[cfg.phase]).filter(x=>x===cfg.ru).length!==1 ||
    paragraphs(localized?.[cfg.phase]).filter(x=>x===cfg.uz).length!==1)fail(`S2E${cfg.number}: placement/localization anchor failed`)
 const choices=parts=>parts.flatMap(p=>(p.decision?.choices||[]).map(c=>c.choice_id))
 if(JSON.stringify(choices(ru.parts))!==JSON.stringify(cfg.choices) ||
    JSON.stringify(choices(uz.parts))!==JSON.stringify(cfg.choices))fail(`S2E${cfg.number}: original choice IDs drift`)
 if(asset?.slot?.slot_id!==cfg.slot || asset?.slot?.part_id!==cfg.part ||
    asset?.slot?.after_text_ru!==cfg.ru||asset?.slot?.after_text_uz!==cfg.uz ||
    asset?.object_path!==expectedWebpPath||asset?.public_url!==expectedUrl ||
    asset?.approved_webp?.sha256!==asset?.verified_remote_sha256 ||
    asset?.approved_webp?.bytes!==asset?.verified_size||asset?.verified_mime!=='image/webp' ||
    !/^[a-f0-9]{64}$/.test(asset?.approved_webp?.sha256||''))fail(`S2E${cfg.number}: remote-approved manifest drift`)
 const list=registry.slice(registry.indexOf('const season2TierAV2AssetIds = ['),registry.indexOf('] as const',registry.indexOf('const season2TierAV2AssetIds = [')))
 if(!list.includes("'"+cfg.id+"'"))fail(`S2E${cfg.number}: WebP registry entry missing`)
 if(!part||!localized)fail(`S2E${cfg.number}: missing final part or localized part`)
}
if(!gallery.includes("part.image_slots.filter((slot) => slot.phase === 'story_text')") ||
   !gallery.includes("part.image_slots.filter((slot) => slot.phase === 'post_choice_text')") ||
   !reader.includes('slotsByAnchor.get(paragraph)'))fail('Reader and gallery exact-slot discovery rules missing')
if(errors.length){for(const e of errors)console.error('[s2e1+s2e5 art] '+e);process.exit(1)}
console.log('[s2e1+s2e5 art] PASS: both approved Storage assets registered, RU/UZ exact anchors and phase order, all choice IDs unchanged, gallery reveal rule, unpublished Season 2')
