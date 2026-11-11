// #318 — independently verify bytes actually served by Supabase Storage.
// Run in GitHub Actions, not solely storage.objects metadata.
import crypto from 'node:crypto'

const id='seven_roads_s2_story3_sarvan_family_return_01_APPROVED'
const expectedBytes=309590
const expectedSha='80fc64dd30872423662729d2aa0e5713e6190232e3368094251650cd39fd2943'
const url='https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/'+id+'.webp'
const result=await fetch(url,{cache:'no-store',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)})
if(!result.ok)throw new Error(`[QISSA S2E3] Remote GET failed HTTP ${result.status}`)
const mime=(result.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
if(mime!=='image/webp')throw new Error(`[QISSA S2E3] MIME mismatch ${mime}`)
const bytes=Buffer.from(await result.arrayBuffer())
if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP'){
 throw new Error('[QISSA S2E3] Invalid actual WebP RIFF header')
}
const sha=crypto.createHash('sha256').update(bytes).digest('hex')
if(bytes.length!==expectedBytes||sha!==expectedSha)throw new Error(`[QISSA S2E3] Remote mismatch: bytes=${bytes.length}, sha=${sha}`)
console.log(`[QISSA S2E3] VERIFIED REMOTE GET MIME=${mime} SIZE=${bytes.length} SHA256=${sha} KEY=${id}.webp`)
console.log('[QISSA S2E3] PASS independent byte-level remote integrity')
