import fs from 'node:fs'
import crypto from 'node:crypto'

const manifest=JSON.parse(fs.readFileSync('docs/qissa/season2/story4_remaining_two_approved_art_2026-11-06.json','utf8'))
const base='https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/'
if(manifest.supabase_bucket!=='story-images'||manifest.supabase_prefix!=='seven-roads/season2_tier_a_v2/')throw Error('Unexpected storage location')
if(manifest.additional_shared_assets?.length!==2)throw Error('Exactly two new images required')
for(const asset of manifest.additional_shared_assets) {
  if(!/^[a-f0-9]{64}$/.test(asset.sha256)||asset.bytes<=0||asset.width!==1536||asset.height!==864)throw Error('Bad expected file metadata')
  const target=base+manifest.supabase_bucket+'/'+manifest.supabase_prefix+encodeURIComponent(asset.storage_filename)
  const r=await fetch(target,{cache:'no-store',signal:AbortSignal.timeout(30000)})
  if(!r.ok)throw Error(asset.asset_id+' public HTTP '+r.status)
  const type=(r.headers.get('content-type')||'').toLowerCase()
  if(!type.includes('image/webp'))throw Error(asset.asset_id+' bad content type '+type)
  const bytes=Buffer.from(await r.arrayBuffer())
  const digest=crypto.createHash('sha256').update(bytes).digest('hex')
  if(bytes.length!==asset.bytes||digest!==asset.sha256)throw Error(asset.asset_id+' mismatch expected '+asset.bytes+'/'+asset.sha256+' got '+bytes.length+'/'+digest)
  console.log('[S2E4 FINAL STORAGE] VERIFIED '+asset.asset_id+' actual='+asset.storage_filename+' SHA-256='+digest+' bytes='+bytes.length)
}
console.log('[S2E4 FINAL STORAGE] PASS 2/2 uploaded objects independent SHA-256 GET')
