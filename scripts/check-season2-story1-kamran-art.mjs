import fs from 'node:fs'
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const readText = p => fs.readFileSync(p, 'utf8')
const ru = readJSON('src/data/authored/staging/season2Story1RoyalSilver.ru.json')
const uz = readJSON('src/data/authored/staging/season2Story1RoyalSilver.uz.json')
const proof = readJSON('docs/qissa/season2/story1_kamran_rescue_approved_2026-11-10.json')
const inventory = readJSON('docs/qissa/season2/season2_staging_authored_package_inventory.json')
const registry = readText('src/data/authoredStoryAssets.ts')
const gallery = readText('src/lib/authoredIllustrationDiscovery.ts')
const reader = readText('src/features/authoredStory/engine.ts')
const errors = []
const fail = s => errors.push(s)
const paragraphs = text => String(text||'').split(/\n\n+/).map(x=>x.trim()).filter(Boolean)
const id = 'seven_roads_s2_story1_kamran_rescues_comrade_01_APPROVED'
const slotId = 'S2-ST1-KAMRAN-RESCUE'
const ruAnchor = 'Он спрыгнул рядом со своим человеком, вытащил нож и разрезал ремень.'
const uzAnchor = 'U o‘z odamining yoniga sakrab tushdi, pichog‘ini olib tasmani kesdi.'
const sha = '83449a2612dba73bac37ff7b4d153733d54d5040dbdda62c29a062b628de8d34'
const prefix = 'seven-roads/season2_tier_a_v2/'
const url = 'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/' + prefix + id + '.webp'
const p=ru.parts?.[1], u=uz.parts?.[1], a=proof.slot
const slots = ru.parts?.flatMap(x=>x.image_slots||[])||[]
const ids = slots.map(x=>x.slot_id)
const expectedIds = ['S2-ST1-TIERA-ATTACK',slotId,'S2-ST1-TIERA-PURSUIT']
const actualPart2Slots=p?.image_slots?.map(x=>x.slot_id)
if (ru.story_id !== 'seven_roads_korolevskoe_serebro' ||
    uz.story_id!==ru.story_id || ru.parts?.length!==3 || uz.parts?.length!==3) {
  fail('Wrong Story 1 package, localized story id or part count')
}
if (ru.illustration_plan?.shared_asset_count!==3 ||
    ru.illustration_plan?.planned_asset_count!==4 ||
    ru.illustration_plan?.visible_assets_per_playthrough!==4 ||
    ru.illustration_plan?.cover_asset_count!==1 ||
    ru.illustration_plan?.choice_asset_count!==0) {
  fail('Story 1 image count must be 3 narrative shared frames plus one season-wide cover')
}
if (JSON.stringify(ids)!==JSON.stringify(expectedIds) ||
    JSON.stringify(actualPart2Slots)!==JSON.stringify([slotId,'S2-ST1-TIERA-PURSUIT']) ||
    new Set(ids).size!==3) {
  fail('Part 2 rescue must precede original pursuit; no duplicated or missing image slots')
}
if (p?.part_id!=='story1_part_2_kamran_pursuit' || u?.part_id!==p?.part_id ||
    p?.image_slots?.[0]?.asset_id!==id ||
    p?.image_slots?.[0]?.kind!=='shared' ||
    p?.image_slots?.[0]?.phase!=='story_text' ||
    p?.image_slots?.[0]?.status!=='approved' ||
    p?.image_slots?.[0]?.runtime_url!==null ||
    p?.image_slots?.[0]?.after_text!==ruAnchor ||
    p?.illustration_refs?.[0]!==id ||
    u?.image_anchor_texts?.[slotId]!==uzAnchor ||
    paragraphs(p?.story_text).filter(x=>x===ruAnchor).length!==1 ||
    paragraphs(u?.story_text).filter(x=>x===uzAnchor).length!==1) {
  fail('Owner-approved Kamran art slot/bilingual exact paragraph anchor drift')
}
if (p?.image_slots?.[1]?.asset_id!=='seven_roads_s2_story1_danyar_pursuit_01_APPROVED' ||
    ru.parts?.[0]?.image_slots?.[0]?.asset_id!=='seven_roads_s2_story1_royal_silver_attack_01_APPROVED' ||
    u?.image_anchor_texts?.['S2-ST1-TIERA-PURSUIT']!=='Daniyar qolgan soqchi bilan asosiy yo‘l bo‘ylab quvishni davom ettirdi.') {
  fail('Earlier approved art must not change')
}
if (a?.slot_id!==slotId || a?.asset_id!==id || a?.phase!=='story_text' ||
    a?.part_id!==p?.part_id || a?.after_text_ru!==ruAnchor || a?.after_text_uz!==uzAnchor ||
    proof.owner_status!=='APPROVED' || proof.publication_state!=='unpublished' ||
    proof.storage?.bucket!=='story-images' ||
    proof.storage?.object_path!==prefix+id+'.webp' ||
    proof.storage?.public_url!==url ||
    proof.storage?.verified_mime!=='image/webp' ||
    proof.storage?.verified_size!==363060 ||
    proof.approved_webp?.sha256!==sha ||
    proof.approved_webp?.bytes!==363060 ||
    proof.source_png?.sha256!=='22b44a5f7aa13b8ec252b055a9af7e4c2946cfa7826e1c86c072ec485106c559' ||
    proof.remote_integrity_proof?.status!=='success' ||
    proof.remote_integrity_proof?.actual_sha256!==sha ||
    proof.integrated_ru_blob_sha!=='365545ca0e725c7f17fa3f8e1223494fb57e7ba7' ||
    proof.integrated_uz_blob_sha!=='974a153faa3edcd6d24210b76c177ed3b7f18b86') {
  fail('Library approval / actual Storage object / hash manifest integrity mismatch')
}
const start = registry.indexOf('const season2TierAV2AssetIds = [')
const end = registry.indexOf('] as const',start)
if (start<0 || end<0 || !registry.slice(start,end).includes("'"+id+"'") ||
    !gallery.includes('part.image_slots.filter') ||
    !gallery.includes('part.image_slots.forEach') ||
    !reader.includes("slotsByAnchor.get(paragraph)")) {
  fail('Source registry, gallery discovery, or exact reader paragraph mapping drifted')
}
const allChoices=parts=>parts.flatMap(part=>(part.decision?.choices||[]).map(c=>c.choice_id))
const expectedChoices=[
 'story1_choice_1a_stabilize_harness','story1_choice_1b_reopen_guard_path',
 'story1_choice_2a_follow_tracks','story1_choice_2b_predict_exit',
 'story1_choice_3a_check_gear','story1_choice_3b_check_escape_route'
]
if(JSON.stringify(allChoices(ru.parts))!==JSON.stringify(expectedChoices)||
   JSON.stringify(allChoices(uz.parts))!==JSON.stringify(expectedChoices)){
  fail('All six localized choice identities must remain stable')
}
const inv=inventory.packages?.find(p=>p.story_number===1)
if(inv?.publication_state!=='not-published' ||
   inv?.tier_a_image_count!==3 ||
   inv?.github_blob_sha!==proof.integrated_ru_blob_sha){
  fail('Updated unpublished staging inventory count or Git blob SHA mismatch')
}
if(errors.length){errors.forEach(x=>console.error('[s2e1-art] '+x));process.exit(1)}
console.log('[s2e1-art] PASS: approved Kamran rescue correctly precedes pursuit; 3 shared art, one season cover, exact RU/UZ anchors, all six choices unchanged, season unpublished')
