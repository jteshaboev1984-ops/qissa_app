import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root=process.cwd()
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))
const ru=load('src/data/authored/staging/season2Story6TwoReinforcements.ru.json')
const uz=load('src/data/authored/staging/season2Story6TwoReinforcements.uz.json')
const approved=load('docs/qissa/season2/story6_approved_illustrations_pending_runtime_2026-11-05.json')
const source=fs.readFileSync(path.join(root,'src/data/authoredStoryAssets.ts'),'utf8')
const errors=[]
const fail=msg=>errors.push(msg)
const pp=t=>String(t??'').split(/\n\n+/).map(x=>x.trim()).filter(Boolean)
const checks=[
  {role:'rustam_arrives_during_battle',part:1,slot:'S2-ST6-TIERA-REVEAL'},
  {role:'mountain_road_bypass',part:0,slot:'S2-ST6-BYPASS-SHARED'},
  {role:'choice_a_rustam_flank_gate',part:1,index:0,slot:'S2-ST6-CHOICE-A-GATE'},
  {role:'choice_b_wagon_rear_door',part:1,index:1,slot:'S2-ST6-CHOICE-B-WAGON-DEFENSE'},
]
if(ru.parts[0].decision!==null)fail('An obsolete roadblock decision was added back')
if(ru.parts[1].decision?.choices?.length!==2)fail('Episode 6 must have exactly two exclusive battle choices')
if(ru.parts[1].decision?.choices?.[0]?.choice_id!=='story6_choice_2a_wagon_team' ||
   ru.parts[1].decision?.choices?.[1]?.choice_id!=='story6_choice_2b_clear_return_road')fail('Persisted choice ID changed')
if(ru.illustration_plan?.shared_asset_count!==3 || ru.illustration_plan?.choice_asset_count!==2 || ru.illustration_plan?.cover_asset_count!==1)fail('Image plan is not 3 shared + 2 branch-specific + 1 cover')

for(const check of checks){
  const art=approved.approved_new_or_replacement_assets.find(x=>x.scene_role===check.role)
  if(!art){fail('Missing approved manifest '+check.role);continue}
  let slot,langAnchor
  if(check.index===undefined){
    slot=ru.parts[check.part].image_slots.find(s=>s.slot_id===check.slot)
    langAnchor=uz.parts[check.part].image_anchor_texts?.[check.slot]
  }else{
    slot=ru.parts[check.part].decision.choices[check.index]?.illustration
    langAnchor=uz.parts[check.part].decision.choices[check.index]?.illustration_after_text
  }
  const ruText=check.index===undefined?ru.parts[check.part].story_text:ru.parts[check.part].decision.choices[check.index].resolution_text
  const uzText=check.index===undefined?uz.parts[check.part].story_text:uz.parts[check.part].decision.choices[check.index].resolution_text
  if(slot?.asset_id!==art.asset_id||slot?.slot_id!==check.slot||slot?.runtime_url!==null)fail(check.role+': incorrect asset/slot registration')
  if(slot?.after_text!==art.after_text_ru||langAnchor!==art.after_text_uz)fail(check.role+': inaccurate RU/UZ anchor')
  if(pp(ruText).filter(x=>x===art.after_text_ru).length!==1 ||
     pp(uzText).filter(x=>x===art.after_text_uz).length!==1)fail(check.role+': anchor must occur exactly once in both languages')
  if(check.index!==undefined && slot?.behavior!=='show_in_resolution_after_anchor')fail(check.role+': image would not be branch-local')
  if(!source.includes(art.asset_id)||!source.includes('season2_tier_a_v2'))fail(check.role+': missing expected future asset resolver')
}

if(ru.parts[0].image_slots.length!==2 || ru.parts[1].image_slots.length!==1)fail('Expected false guards + bypass + Rustam reveal shared images')
if(uz.parts[0].image_anchor_texts?.['S2-ST6-BYPASS-SHARED']!=='— Topdim!')fail('UZ bypass anchor lost')
if(errors.length){for(const e of errors)console.error('[story6-approved-art] '+e);process.exit(1)}

if(process.argv.includes('--verify-public') || process.env.GITHUB_ACTIONS === 'true'){
  const host='https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'
  for(const a of approved.approved_new_or_replacement_assets){
    const objectPath='seven-roads/season2_tier_a_v2/'+a.asset_id+'.webp'
    try{
      const res=await fetch(host+objectPath,{signal:AbortSignal.timeout(20000)})
      if(!res.ok)throw new Error('HTTP '+res.status)
      const buf=Buffer.from(await res.arrayBuffer())
      const hash=crypto.createHash('sha256').update(buf).digest('hex')
      if(buf.byteLength!==a.webp_bytes || hash!==a.webp_sha256){
        fail(a.asset_id+': expected '+a.webp_sha256+'/'+a.webp_bytes+', got '+hash+'/'+buf.byteLength)
      }
    }catch(e){fail(a.asset_id+': public object unverified: '+String(e))}
  }
  if(errors.length){for(const e of errors)console.error('[story6-approved-art] '+e);process.exit(1)}
  console.log('[story6-approved-art] 4/4 Supabase public WebPs match approved SHA256 and byte sizes')
}
console.log('[story6-approved-art] PASS: exact RU/UZ insertion anchors, shared images and mutually exclusive branches')
