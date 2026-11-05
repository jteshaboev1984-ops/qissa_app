import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const args = new Set(process.argv.slice(2))
const modes = ['--apply', '--verify-only', '--verify-local'].filter(x => args.has(x))
if (modes.length > 1 || [...args].some(x=>!['--apply','--verify-only','--verify-local'].includes(x))) {
  console.error('[story7-upload] select one of --apply, --verify-only, --verify-local'); process.exit(2)
}
const mode=modes[0] ?? '--verify-local'
const root=process.cwd()
const m=JSON.parse(fs.readFileSync(path.join(root,'docs/qissa/season2/story7_approved_illustrations_pending_runtime_2026-11-05.json'),'utf8'))
if(m.hosting!=='not_uploaded_not_verified' && mode==='--apply') throw Error('Manifest hosting state changed; revalidate before uploading')
const assetDir=path.resolve(process.env.QISSA_S2E7_ASSET_DIR ?? path.join(root,'.local/qissa-s2e7-approved'))
const url=(process.env.QISSA_SUPABASE_URL ?? 'https://phwakdpxxyncyslvnqht.supabase.co').replace(/\/$/,'')
if(url!=='https://phwakdpxxyncyslvnqht.supabase.co')throw Error('Refusing to upload to unexpected Supabase project')
const key=process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const objPath=a=>m.supabase_prefix+a.filename
const encPath=p=>p.split('/').map(encodeURIComponent).join('/')
const publicUrl=a=>url+'/storage/v1/object/public/'+m.supabase_bucket+'/'+encPath(objPath(a))
const uploadUrl=a=>url+'/storage/v1/object/'+m.supabase_bucket+'/'+encPath(objPath(a))
function local(a){
  const file=path.join(assetDir,a.filename)
  const b=fs.readFileSync(file)
  if(b.byteLength!==a.bytes || sha(b)!==a.sha256)throw Error(a.asset_id+': local WebP hash/size mismatch')
  return b
}
async function verify(a){
  const r=await fetch(publicUrl(a),{cache:'no-store',signal:AbortSignal.timeout(25000)})
  if(!r.ok) return {ok:false,status:r.status}
  const mime=(r.headers.get('content-type')??'').toLowerCase()
  if(!mime.includes('image/webp'))throw Error(a.asset_id+': incorrect content-type '+mime)
  const b=Buffer.from(await r.arrayBuffer())
  if(b.byteLength!==a.bytes || sha(b)!==a.sha256)throw Error(a.asset_id+': public object does not match approved WebP')
  return {ok:true,status:r.status}
}
if(mode==='--verify-only'){
  for(const a of m.assets){const v=await verify(a);if(!v.ok)throw Error(a.asset_id+': not hosted ('+v.status+')');console.log('[story7-upload] VERIFIED '+a.asset_id)}
  console.log('[story7-upload] PASS 2/2 public objects');process.exit(0)
}
const blobs=m.assets.map(a=>[a,local(a)])
console.log('[story7-upload] local WebPs verified 2/2')
if(mode==='--verify-local')process.exit(0)
if(!key){console.error('[story7-upload] --apply requires server-only SUPABASE_SERVICE_ROLE_KEY');process.exit(2)}
for(const [a,blob] of blobs){
  const existing=await verify(a)
  if(existing.ok){console.log('[story7-upload] verified already present '+a.asset_id);continue}
  if(existing.status!==404 && existing.status!==400)throw Error(a.asset_id+': unexpected preflight HTTP '+existing.status)
  const response=await fetch(uploadUrl(a),{
    method:'POST',
    headers:{authorization:'Bearer '+key,apikey:key,'content-type':'image/webp','cache-control':'public, max-age=31536000, immutable','x-upsert':'false'},
    body:blob,signal:AbortSignal.timeout(45000)
  })
  if(!response.ok)throw Error(a.asset_id+': upload failed HTTP '+response.status+' '+(await response.text()).slice(0,300))
  const check=await verify(a)
  if(!check.ok)throw Error(a.asset_id+': upload returned success but public GET failed')
  console.log('[story7-upload] UPLOADED & VERIFIED '+a.asset_id)
}
console.log('[story7-upload] PASS 2/2 hosted and SHA-256 verified; NEXT: update manifest hosting status and stage runtime bindings in a separate reviewed PR')
