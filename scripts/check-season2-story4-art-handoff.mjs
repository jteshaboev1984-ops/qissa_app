import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))
const text=p=>fs.readFileSync(path.join(root,p),'utf8')
const initial=load('docs/qissa/season2/story4_approved_illustrations_pending_runtime_2026-11-05.json')
const final=load('docs/qissa/season2/story4_remaining_two_approved_art_2026-11-06.json')
const wagon=load('docs/qissa/season2/story4_wagon_approved_pending_storage_2026-11-05.json')
const ru=load('src/data/authored/staging/season2Story4WaitedMan.ru.json')
const uz=load('src/data/authored/staging/season2Story4WaitedMan.uz.json')
const inventory=load('docs/qissa/season2/season2_staging_authored_package_inventory.json')
const registry=text('src/data/authoredStoryAssets.ts')
const gallery=text('src/lib/authoredIllustrationDiscovery.ts')
const errors=[]
const fail=s=>errors.push(s)
const paragraphs=s=>String(s??'').split(/\n\n+/).map(x=>x.trim()).filter(Boolean)
const ru1=ru.parts?.find(p=>p.part_id===initial.part_id)
const uz1=uz.parts?.find(p=>p.part_id===initial.part_id)
const ru2=ru.parts?.find(p=>p.part_id===final.part_id)
const uz2=uz.parts?.find(p=>p.part_id===final.part_id)
const v2prefix='seven-roads/season2_tier_a_v2/'
const publicPrefix='https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'
const idSet=new Set()
const checkSlot=(asset,source,localized,sha,bytes,filename,phase,kind)=>{
  if(idSet.has(asset.slot_id))fail('Duplicate Story4 image slot '+asset.slot_id)
  idSet.add(asset.slot_id)
  if(!/^[a-f0-9]{64}$/.test(sha??'') || !Number.isSafeInteger(bytes) || bytes<=0)fail('Missing exact verified WebP metadata for '+asset.slot_id)
  if(paragraphs(source?.story_text).filter(p=>p===asset.after_text_ru).length!==1 ||
     paragraphs(localized?.story_text).filter(p=>p===asset.after_text_uz).length!==1)fail('RU/UZ exact paragraph anchors must each occur once: '+asset.slot_id)
  const slot=(source?.image_slots??[]).find(p=>p.slot_id===asset.slot_id)
  if(!slot || slot.kind!==kind || slot.status!=='approved' || slot.phase!==phase ||
     slot.asset_id!==asset.asset_id || slot.after_text!==asset.after_text_ru ||
     slot.runtime_url!==null)fail('Missing/changed approved RU slot: '+asset.slot_id)
  if(localized?.image_anchor_texts?.[asset.slot_id]!==asset.after_text_uz)fail('Missing/changed UZ anchor: '+asset.slot_id)
  if(!registry.includes("'"+asset.asset_id+"'"))fail('Asset missing from verified registry: '+asset.asset_id)
  if(asset.runtime_object_path!==v2prefix+filename ||
     asset.runtime_public_url!==publicPrefix+asset.runtime_object_path ||
     asset.hosting!=='hosted_verified')fail('Object path, URL or hosting drift: '+asset.asset_id)
}
if(initial.approval!=='owner_approved' || initial.hosting!=='hosted_verified' ||
   initial.runtime_binding!=='hosted_registry_resolved' ||
   initial.assets?.length!==2 ||
   initial.supabase_bucket!=='story-images'||initial.supabase_prefix!==v2prefix ||
   initial.public_verification?.workflow_conclusion!=='success')fail('Original two scene images lost verified state')
if(final.schema_version!=='qissa-season2-story4-remaining-art-1' ||
   final.hosting!=='hosted_verified' || final.runtime_binding!=='hosted_registry_resolved' ||
   final.publication_state!=='unpublished' || final.supabase_bucket!=='story-images' ||
   final.supabase_prefix!==v2prefix || final.additional_shared_assets?.length!==2 ||
   final.file_integrity_proof?.status!=='success' ||
   final.file_integrity_proof?.workflow_run_id!==42195719199)fail('Two final Story4 images missing public verified proof')
if(wagon.hosting!=='hosted_verified' || wagon.runtime_binding!=='hosted_registry_resolved' ||
   wagon.webp.sha256!==final.additional_shared_assets?.[0]?.sha256)fail('Original wagon master and uploaded WebP verification drift')
if(ru.illustration_plan?.shared_asset_count!==5 ||
   ru.illustration_plan?.choice_asset_count!==0 ||
   ru.illustration_plan?.cover_asset_count!==1 ||
   ru.illustration_plan?.planned_asset_count!==6 ||
   ru.illustration_plan?.visible_assets_per_playthrough!==6)fail('Story4 must have 5 shared images + 1 season-wide cover')
if(!ru1||!uz1||!ru2||!uz2)fail('Missing one of both RU/UZ story parts')
if(!gallery.includes('part.image_slots.filter') || !gallery.includes('part.image_slots.forEach'))fail('Gallery shared-slot discovery changed')
for(const a of initial.assets??[]){
  if(a.phase!=='story_text'||a.visibility!=='shared'||
    a.webp?.dimensions?.join('x')!=='1536x864' ||
    !/^[a-f0-9]{64}$/.test(a.master_png?.sha256??''))fail('Original image invariant failed: '+a.slot_id)
  checkSlot(a,ru1,uz1,a.webp?.sha256,a.webp?.bytes,a.webp?.filename,'story_text','shared')
}
if((ru1?.image_slots??[]).length!==3 || Object.keys(uz1?.image_anchor_texts??{}).length!==3 ||
   (ru1?.illustration_refs??[]).length!==3 ||
   !(ru1?.image_slots??[]).some(x=>x.slot_id==='S2-ST4-TIERA-FALSE-NOTICE'&&x.asset_id===initial.preserve_existing_asset_id))fail('Three previously approved Story4 Part1 scenes changed')
for(const a of final.additional_shared_assets??[]){
  if(a.phase!=='story_text'||a.kind!=='shared'||a.width!==1536||a.height!==864)fail('Final image size/type drift '+a.slot_id)
  checkSlot(a,ru2,uz2,a.sha256,a.bytes,a.storage_filename,'story_text','shared')
}
if((ru2?.image_slots??[]).length!==2 || Object.keys(uz2?.image_anchor_texts??{}).length!==2 ||
   (ru2?.illustration_refs??[]).length!==2)fail('Story4 Part2 must have exactly 2 new shared images')
const ordered=(ru2?.image_slots??[]).map(a=>a.slot_id)
if(JSON.stringify(ordered)!==JSON.stringify(['S2-ST4-WAGON-DAWN-LOCK','S2-ST4-NADIR-CONTACT']))fail('Story4 Part2 scene order drift')
const nadir=final.additional_shared_assets?.find(a=>a.slot_id==='S2-ST4-NADIR-CONTACT')
if(!nadir || nadir.asset_id!=='seven_roads_s2_story4_nadir_contact_01_APPROVED' ||
   nadir.storage_filename!=='seven_roads_s2_story4_nadir_contact_01_DRAFT_v2.webp' ||
   !registry.includes("'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/"+nadir.storage_filename+"'"))fail('The approved Nadir logical ID must resolve to the actual immutable DRAFT_v2 upload, not a nonexistent filename')
const all=(ru.parts??[]).flatMap(p=>p.image_slots??[])
if(all.length!==5 || new Set(all.map(s=>s.slot_id)).size!==5)fail('Story4 must have exactly 5 unique narrative slots')
const choices=parts=>parts.flatMap(p=>p.decision?.choices?.map(c=>c.choice_id)??[])
const locked=['story4_choice_1a_road_book','story4_choice_1b_road_master','story4_choice_2a_supply_size','story4_choice_2b_drop_point']
if(JSON.stringify(choices(ru.parts??[]))!==JSON.stringify(locked) ||
   JSON.stringify(choices(uz.parts??[]))!==JSON.stringify(locked))fail('Any of the four story choices was changed')
const inv=inventory.packages?.find(p=>p.story_number===4)
if(inv?.tier_a_image_count!==5 || inv.publication_state!=='not-published')fail('Inventory count or unpublished state drift')
if(errors.length){errors.forEach(s=>console.error('[story4-final-art] '+s));process.exit(1)}
console.log('[story4-final-art] PASS 5/5 approved scene slots + shared season cover, exact bilingual anchors, verified immutable objects and all four choice IDs intact')
console.log('[story4-final-art] gallery and season unpublished')
