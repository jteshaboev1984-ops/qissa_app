import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))
const manifest=load('docs/qissa/season2/story4_approved_illustrations_pending_runtime_2026-11-05.json')
const ru=load('src/data/authored/staging/season2Story4WaitedMan.ru.json')
const uz=load('src/data/authored/staging/season2Story4WaitedMan.uz.json')
const registry=fs.readFileSync(path.join(root,'src/data/authoredStoryAssets.ts'),'utf8')
const errs=[]
const fail=s=>errs.push(s)
const paragraphs=s=>String(s??'').split(/\n\n+/).map(t=>t.trim()).filter(Boolean)
const rpart=ru.parts?.find(p=>p.part_id===manifest.part_id)
const upart=uz.parts?.find(p=>p.part_id===manifest.part_id)
if(manifest.schema_version!=='qissa-season2-story4-owner-approved-art-handoff-1')fail('Invalid version')
if(manifest.approval!=='owner_approved'||manifest.hosting!=='not_uploaded_or_verified'||manifest.runtime_binding!=='not_integrated')fail('Do not claim hosted or registered before public byte/hash verification')
if(manifest.publication_state!=='unpublished')fail('Season must remain unpublished')
if(manifest.assets?.length!==2)fail('Expected exactly 2 approved new scene frames')
if(!rpart || !upart)fail('Missing matching RU/UZ story4 part')
for(const x of manifest.assets??[]){
  if(x.phase!=='story_text'||x.visibility!=='shared')fail('Image must be shared story_text')
  if(!/^[a-f0-9]{64}$/.test(x.master_png?.sha256??'')||!/^[a-f0-9]{64}$/.test(x.webp?.sha256??''))fail('Invalid SHA256 for '+x.asset_id)
  if(x.webp?.dimensions?.join('x')!=='1536x864')fail('WebP dimensions unexpected for '+x.asset_id)
  if(!(x.master_png?.bytes>0 && x.webp?.bytes>0))fail('Invalid sizes for '+x.asset_id)
  if(paragraphs(rpart?.story_text).filter(t=>t===x.after_text_ru).length!==1)fail('Russian paragraph anchor not unique: '+x.asset_id)
  if(paragraphs(upart?.story_text).filter(t=>t===x.after_text_uz).length!==1)fail('Uzbek paragraph anchor not unique: '+x.asset_id)
  if((rpart?.image_slots??[]).some(s=>s.slot_id===x.slot_id))fail('New image slot prematurely registered: '+x.slot_id)
  if(registry.includes("'"+x.asset_id+"'"))fail('New asset prematurely registered in hosted resolver: '+x.asset_id)
}
if(!(rpart?.image_slots??[]).some(x=>x.asset_id===manifest.preserve_existing_asset_id))fail('Previously approved Tier A scene missing')
const choices=ru.parts?.flatMap(p=>p.decision?.choices?.map(c=>c.choice_id)??[])??[]
const expected=['story4_choice_1a_road_book','story4_choice_1b_road_master','story4_choice_2a_supply_size','story4_choice_2b_drop_point']
if(JSON.stringify(choices)!==JSON.stringify(expected))fail('Persisted choice IDs changed')
if(errs.length){errs.forEach(e=>console.error('[story4-art-handoff] '+e));process.exit(1)}
console.log('[story4-art-handoff] PASS: 2 owner-approved pending images, 4 unique exact RU/UZ anchors, previous Tier A and choice IDs preserved')
