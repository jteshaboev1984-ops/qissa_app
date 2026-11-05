import fs from 'node:fs'
import crypto from 'node:crypto'
const manifest=JSON.parse(fs.readFileSync('docs/qissa/season2/story4_approved_illustrations_pending_runtime_2026-11-05.json','utf8'))
const root='https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'
const prefix='seven-roads/season2_tier_a_v2/'
if(manifest.assets?.length!==2)throw new Error('Expected 2 images in approved manifest')
for(const asset of manifest.assets){
  const objectPath=prefix+asset.webp.filename
  const response=await fetch(root+'story-images/'+objectPath,{cache:'no-store',signal:AbortSignal.timeout(30000)})
  if(!response.ok)throw new Error(asset.asset_id+' public GET HTTP '+response.status)
  const contentType=(response.headers.get('content-type')||'').toLowerCase()
  if(!contentType.includes('image/webp'))throw new Error(asset.asset_id+' wrong MIME '+contentType)
  const data=Buffer.from(await response.arrayBuffer())
  const hash=crypto.createHash('sha256').update(data).digest('hex')
  if(data.byteLength!==asset.webp.bytes||hash!==asset.webp.sha256)
    throw new Error(asset.asset_id+' size/SHA-256 mismatch; got '+data.byteLength+' '+hash)
  if(manifest.hosting==='hosted_verified'&&asset.runtime_object_path!==objectPath)
    throw new Error(asset.asset_id+' manifest path drift')
  console.log('[story4-storage] VERIFIED '+asset.asset_id+' '+data.byteLength+' bytes SHA-256 '+hash)
}
console.log('[story4-storage] PASS 2/2 approved originals verified by public GET; no data changed')
