// Owner-approved QISSA S2E1 Kamran rescue: independent download & binary hash gate.
// Does not modify Storage or published status.
import crypto from 'node:crypto'
const assetId = 'seven_roads_s2_story1_kamran_rescues_comrade_01_APPROVED'
const expectedBytes = 363060
const expectedSha256 = '83449a2612dba73bac37ff7b4d153733d54d5040dbdda62c29a062b628de8d34'
const expectedWidth = 1671
const expectedHeight = 941
const url = 'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/' + assetId + '.webp'
const response = await fetch(url, {
  cache: 'no-store',
  headers: { 'Cache-Control': 'no-cache' },
  signal: AbortSignal.timeout(30000)
})
if (!response.ok) throw new Error('[S2E1 KAMRAN] HTTP GET '+response.status)
const mime = (response.headers.get('content-type') ?? '').toLowerCase()
if (!mime.includes('image/webp')) throw new Error('[S2E1 KAMRAN] Unexpected Content-Type '+mime)
const data = Buffer.from(await response.arrayBuffer())
const hash = crypto.createHash('sha256').update(data).digest('hex')
if (data.length !== expectedBytes || hash !== expectedSha256) {
  throw new Error('[S2E1 KAMRAN] Remote file differs from owner-approved Library WebP; '+
  'expected='+expectedBytes+'/'+expectedSha256+' actual='+data.length+'/'+hash)
}
if(data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP') {
  throw new Error('[S2E1 KAMRAN] Invalid WebP signature')
}
if(data.toString('ascii',12,16)==='VP8X'){
 const width = data.readUIntLE(24,3)+1, height=data.readUIntLE(27,3)+1
 if(width!==expectedWidth||height!==expectedHeight)throw new Error('[S2E1 KAMRAN] Unexpected dimensions '+width+'×'+height)
}
console.log('[S2E1 KAMRAN] VERIFIED remote GET, MIME='+mime+' BYTES='+data.length+' SHA256='+hash)
