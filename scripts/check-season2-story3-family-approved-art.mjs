// QISSA #318 — independent source-level gate for fifth approved Story 3 scene.
// Remote binary bytes are independently hashed by verify-season2-story3-sarvan-family-webp.mjs in CI.
import fs from 'node:fs'
import crypto from 'node:crypto'
const load = p => JSON.parse(fs.readFileSync(p,'utf8'))
const text = p => fs.readFileSync(p,'utf8')
const proof = load('docs/qissa/season2/story3_sarvan_family_return_approved_2026-11-11.json')
const ruPath = 'src/data/authored/staging/season2Story3TwoTowers.ru.json'
const uzPath = 'src/data/authored/staging/season2Story3TwoTowers.uz.json'
const ruText = text(ruPath), uzText = text(uzPath)
const ru = JSON.parse(ruText), uz = JSON.parse(uzText)
const inventory = load('docs/qissa/season2/season2_staging_authored_package_inventory.json')
const registry = text('src/data/authoredStoryAssets.ts')
const gallery = text('src/lib/authoredIllustrationDiscovery.ts')
const engine = text('src/features/authoredStory/engine.ts')
const checks = []
const fail = message => checks.push(message)
const shaGit = t => {
 const bytes=Buffer.from(t)
 return crypto.createHash('sha1').update(Buffer.concat([
   Buffer.from(`blob ${bytes.length}\0`),bytes,
 ])).digest('hex')
}
const countParagraph = (t,anchor) => String(t??'').split(/\n\n+/).filter(x=>x.trim()===anchor).length
const a=proof.asset||{}
const slotId='S2-ST3-SARVAN-FAMILY-RETURN'
const id='seven_roads_s2_story3_sarvan_family_return_01_APPROVED'
const partId='story3_part_1_old_yard_niche'
const ruAnchor='Из дома вышла её мать и сразу обняла Самиру.'
const uzAnchor='Uydan onasi chiqib, darrov Samirani quchoqladi.'
const expectedSlots=['S2-ST3-SARVAN-FAMILY-RETURN','S2-ST3-SARVAN-YARD','S2-ST3-TIERA-NICHE',
                     'S2-ST3-SARVAN-MARKET','S2-ST3-GUARDHOUSE-MAP']
const objectKey='seven-roads/season2_tier_a_v2/'+id+'.webp'
const publicUrl='https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'+objectKey
const expectedHash='80fc64dd30872423662729d2aa0e5713e6190232e3368094251650cd39fd2943'
if(proof.schema_version!=='qissa-season2-story3-sarvan-family-return-approved-1' ||
   proof.owner_decision!=='approved_after_visual_and_literary_check' ||
   proof.status!=='owner_approved_supabase_sha_verified' ||
   proof.publication_state!=='unpublished' || proof.story_id!=='seven_roads_dve_bashni' ||
   proof.story_number!==3 || proof.part_id!==partId)fail('Owner approval, story identity or unpublished guard invalid')
if(a.asset_id!==id || a.slot_id!==slotId || a.part_id!==partId || a.kind!=='shared' ||
  a.phase!=='story_text' || a.after_text_ru!==ruAnchor || a.after_text_uz!==uzAnchor ||
  a.hosting!=='hosted_verified' || a.storage_bucket!=='story-images' ||
  a.storage_object_path!==objectKey || a.public_url!==publicUrl)fail('Slot/Storage provenance changed')
if(proof.remote_integrity_proof?.status!=='success' ||
  proof.remote_integrity_proof?.run_id!==43066802210 ||
  proof.remote_integrity_proof?.content_type!=='image/webp' ||
  proof.remote_integrity_proof?.actual_bytes!==309590 ||
  proof.remote_integrity_proof?.actual_sha256!==expectedHash ||
  a.webp?.bytes!==309590 || a.webp?.sha256!==expectedHash ||
  a.webp?.width!==1536 || a.webp?.height!==864 ||
  a.master_png?.bytes!==2804447 ||
  a.master_png?.sha256!=='b1c8c8da2dff6ac45dc4c9db7eeda876380c5ce6d28aa03f589b6a1d003a3fb1')fail('Independent remote WebP/PNG approved-binary provenance mismatch')
if(ru.story_id!==uz.story_id || ru.story_id!=='seven_roads_dve_bashni' ||
  ru.language!=='ru' || uz.language!=='uz')fail('Bilingual story identity mismatch')
const p=ru.parts.find(x=>x.part_id===partId)
const u=uz.parts.find(x=>x.part_id===partId)
const ordered=ru.parts.flatMap(x=>x.image_slots||[]).map(x=>x.slot_id)
if(JSON.stringify(ordered)!==JSON.stringify(expectedSlots) ||
  JSON.stringify(p?.image_slots?.map(x=>x.slot_id))!==JSON.stringify(expectedSlots.slice(0,3)))fail('New slot must precede existing unchanged yard/niche/market/map')
const s=p?.image_slots?.[0]
if(s?.slot_id!==slotId||s?.kind!=='shared'||s?.status!=='approved'||
  s?.phase!=='story_text'||s?.after_text!==ruAnchor||s?.asset_id!==id||
  s?.scene_key!==id||s?.runtime_url!==null||s?.anchor_key!=='s2_st3_sarvan_family_return' ||
  p?.illustration_refs?.[0]!==id)fail('RU exact asset slot/ref incorrect')
if(u?.image_anchor_texts?.[slotId]!==uzAnchor ||
  countParagraph(p?.story_text,ruAnchor)!==1 || countParagraph(u?.story_text,uzAnchor)!==1 ||
  p?.image_slots?.[1]?.asset_id!=='seven_roads_s2_story3_sarvan_old_caravan_yard_01_APPROVED' ||
  p?.image_slots?.[2]?.asset_id!=='seven_roads_s2_story3_two_towers_niche_discovery_01_APPROVED' ||
  u?.image_anchor_texts?.['S2-ST3-SARVAN-YARD']!=='Kirishning ikki tomonida ikkita tor minora turardi.' ||
  u?.image_anchor_texts?.['S2-ST3-TIERA-NICHE']!=='Ulardan birining ostida devorga kaftdan sal kattaroq yog‘och eshikcha o‘rnatilgan edi.'
 )fail('RU/UZ exact paragraphs or older approved visual anchors drift')
const expectedChoices=['story3_choice_1a_keeper','story3_choice_1b_physical_match','story3_choice_2a_learned_tracks','story3_choice_2b_gate_witnesses','story3_choice_3a_road_book','story3_choice_3b_rider_memory']
const choiceIds=story=>story.parts.flatMap(x=>(x.decision?.choices||[]).map(c=>c.choice_id))
if(JSON.stringify(choiceIds(ru))!==JSON.stringify(expectedChoices)||
 JSON.stringify(choiceIds(uz))!==JSON.stringify(expectedChoices))fail('Six original literary choice IDs changed')
if(ru.illustration_plan?.shared_asset_count!==5 ||
 ru.illustration_plan?.planned_asset_count!==6 ||
 ru.illustration_plan?.visible_assets_per_playthrough!==6 ||
 ru.illustration_plan?.choice_asset_count!==0||
 ru.illustration_plan?.cover_asset_count!==1)fail('Five shared art slots and one shared season cover expected')
const item=inventory.packages?.find(x=>x.story_number===3)
if(item?.publication_state!=='not-published'||item?.tier_a_image_count!==5 ||
  item?.github_blob_sha!==shaGit(ruText) ||
  proof.integrated_ru_blob_sha!==shaGit(ruText) ||
  proof.integrated_uz_blob_sha!==shaGit(uzText) ||
  proof.previous_ru_blob_sha!=='8b9ea5d89115fc6d0bc90d3521875ee9eec76b7f' ||
  proof.previous_uz_blob_sha!=='5d1e2acdac664a108774931aa5fa1c4dc914cffd')
   fail('Historical blob lineage and current unpublished inventory inconsistent')
const index=registry.indexOf('const season2TierAV2AssetIds = [')
const regSection=registry.slice(index,registry.indexOf('] as const',index))
if(index<0||regSection.split("'"+id+"'").length!==2)fail('v2 production asset registry missing or duplicate')
if(!gallery.includes("part.image_slots.filter((slot) => slot.phase === 'story_text')") ||
   !gallery.includes('part.image_slots.forEach((slot) => ids.add(slot.asset_id))') ||
   !engine.includes('slotsByAnchor.get(paragraph)'))fail('Reader exact placement / gallery unlock contract changed')
const approvals=['S2-ST3-SARVAN-YARD','S2-ST3-TIERA-NICHE','S2-ST3-SARVAN-MARKET','S2-ST3-GUARDHOUSE-MAP']
if(JSON.stringify(proof.locked_existing_story3_slots)!==JSON.stringify(approvals))fail('Historical four approved slots missing in art provenance')
if(checks.length){for(const e of checks)console.error('[S2E3 FAMILY ART] '+e);process.exit(1)}
console.log('[S2E3 FAMILY ART] PASS: remote SHA matched, five ordered slots, exact bilingual paragraph anchors, preserved choices/gallery, Season 2 unpublished')
