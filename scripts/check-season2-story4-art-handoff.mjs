import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))
const text=p=>fs.readFileSync(path.join(root,p),'utf8')
const manifest=load('docs/qissa/season2/story4_approved_illustrations_pending_runtime_2026-11-05.json')
const ru=load('src/data/authored/staging/season2Story4WaitedMan.ru.json')
const uz=load('src/data/authored/staging/season2Story4WaitedMan.uz.json')
const registry=text('src/data/authoredStoryAssets.ts')
const gallery=text('src/lib/authoredIllustrationDiscovery.ts')
const errs=[]
const fail=s=>errs.push(s)
const paragraphs=s=>String(s??'').split(/\n\n+/).map(t=>t.trim()).filter(Boolean)
const rpart=ru.parts?.find(p=>p.part_id===manifest.part_id)
const upart=uz.parts?.find(p=>p.part_id===manifest.part_id)
const expectedPrefix='seven-roads/season2_tier_a_v2/'
const publicPrefix='https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'

if(manifest.schema_version!=='qissa-season2-story4-owner-approved-art-handoff-1')fail('Invalid schema')
if(manifest.approval!=='owner_approved'||manifest.hosting!=='hosted_verified'||manifest.runtime_binding!=='hosted_registry_resolved')fail('Story4 artwork not approved/hosted/registered')
if(manifest.publication_state!=='unpublished')fail('Season must remain unpublished')
if(manifest.supabase_bucket!=='story-images'||manifest.supabase_prefix!==expectedPrefix)fail('Unexpected Supabase Storage path')
if(manifest.public_verification?.workflow_conclusion!=='success'||!Number.isInteger(manifest.public_verification?.workflow_run_id))fail('No successful public hash verification evidence')
if(manifest.assets?.length!==2||manifest.approved_asset_count!==2)fail('Exactly 2 added approved images required')
if(!rpart||!upart)fail('Missing RU/UZ Part 1')
if(ru.illustration_plan?.shared_asset_count!==3||
   ru.illustration_plan?.planned_asset_count!==4||
   ru.illustration_plan?.visible_assets_per_playthrough!==4||
   ru.illustration_plan?.choice_asset_count!==0||
   ru.illustration_plan?.cover_asset_count!==1)fail('Story 4 must have 3 shared scenes + season cover')
if(!gallery.includes('part.image_slots.filter')||!gallery.includes('part.image_slots.forEach'))fail('Gallery shared-slot discovery changed')

const uniqueSlots=new Set()
for(const a of manifest.assets??[]){
  if(uniqueSlots.has(a.slot_id))fail('Duplicate new slot '+a.slot_id)
  uniqueSlots.add(a.slot_id)
  if(a.phase!=='story_text'||a.visibility!=='shared'||a.hosting!=='hosted_verified')fail('Invalid slot type or hosting: '+a.slot_id)
  if(!/^[a-f0-9]{64}$/.test(a.master_png?.sha256??'')||
     !/^[a-f0-9]{64}$/.test(a.webp?.sha256??'')||
     a.webp?.dimensions?.join('x')!=='1536x864'||
     !(a.master_png?.bytes>0&&a.webp?.bytes>0))fail('Unverified master/derivative: '+a.slot_id)
  if(a.runtime_object_path!==expectedPrefix+a.webp.filename||
     a.runtime_public_url!==publicPrefix+a.runtime_object_path)fail('Public URL drift: '+a.slot_id)
  if(paragraphs(rpart?.story_text).filter(t=>t===a.after_text_ru).length!==1||
     paragraphs(upart?.story_text).filter(t=>t===a.after_text_uz).length!==1)fail('RU/UZ anchor not unique: '+a.slot_id)
  const slot=(rpart?.image_slots??[]).find(t=>t.slot_id===a.slot_id)
  if(!slot||slot.kind!=='shared'||slot.status!=='approved'||
     slot.phase!=='story_text'||slot.asset_id!==a.asset_id||
     slot.after_text!==a.after_text_ru||slot.runtime_url!==null)fail('RU slot not registered correctly: '+a.slot_id)
  if(upart?.image_anchor_texts?.[a.slot_id]!==a.after_text_uz)fail('UZ anchor mismatch: '+a.slot_id)
  if(!registry.includes("'"+a.asset_id+"'")||
     !registry.includes('season2_tier_a_v2'))fail('Hosted v2 resolver missing: '+a.slot_id)
}
const shared=rpart?.image_slots??[]
if(shared.length!==3||new Set(shared.map(s=>s.slot_id)).size!==3)fail('Story4 Part1 must have exactly 3 unique shared slots')
if(!shared.some(s=>s.asset_id===manifest.preserve_existing_asset_id&&s.slot_id==='S2-ST4-TIERA-FALSE-NOTICE'))fail('Previously accepted Tier A illustration altered')
if((rpart?.illustration_refs??[]).length!==3)fail('Story4 part1 asset list should contain 3 refs')
if(Object.keys(upart?.image_anchor_texts??{}).length!==3)fail('Story4 Part1 UZ must have 3 localized image anchors')
if((ru.parts?.[1]?.image_slots??[]).length!==0||Object.keys(uz.parts?.[1]?.image_anchor_texts??{}).length!==0)fail('Story4 Part2 must retain no shared art yet')
const expected=['story4_choice_1a_road_book','story4_choice_1b_road_master','story4_choice_2a_supply_size','story4_choice_2b_drop_point']
const choices=parts=>parts.flatMap(p=>p.decision?.choices?.map(c=>c.choice_id)??[])
if(JSON.stringify(choices(ru.parts??[]))!==JSON.stringify(expected)||JSON.stringify(choices(uz.parts??[]))!==JSON.stringify(expected))fail('RU/UZ choice IDs drifted')
if(errs.length){errs.forEach(e=>console.error('[story4-art] '+e));process.exit(1)}
console.log('[story4-art] PASS: two verified public WebPs, three ordered shared Story4 illustrations; exact RU/UZ anchors; four choice IDs preserved')
console.log('[story4-art] Gallery discovery preserved and Season 2 stays unpublished')
