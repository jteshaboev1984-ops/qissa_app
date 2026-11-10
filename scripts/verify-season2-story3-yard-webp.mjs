// Owner-approved S2E3 Sarvan courtyard: verify actual uploaded bytes, not Storage metadata.
// Preserves the unrelated previously uploaded DRAFT object untouched.
import crypto from 'node:crypto'

const assetId = 'seven_roads_s2_story3_sarvan_old_caravan_yard_01_APPROVED'
const expectedBytes = 413182
const expectedSha256 = 'a3058e8032e8e9a4b83d1db714be589c479d7c71ba997529951a5d05ec7e2d04'
const expectedWidth = 1536
const expectedHeight = 864
const url = 'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/' + assetId + '.webp'

const response = await fetch(url, {
  cache: 'no-store',
  headers: { 'Cache-Control': 'no-cache' },
  signal: AbortSignal.timeout(30000),
})
if (!response.ok) throw new Error('[S2E3 YARD] unexpected public GET status ' + response.status)
const mime = (response.headers.get('content-type') ?? '').toLowerCase()
if (!mime.includes('image/webp')) throw new Error('[S2E3 YARD] wrong Content-Type ' + mime)
const bytes = Buffer.from(await response.arrayBuffer())
const actualSha256 = crypto.createHash('sha256').update(bytes).digest('hex')
if (bytes.length !== expectedBytes || actualSha256 !== expectedSha256) {
  throw new Error('[S2E3 YARD] remote file differs from APPROVED Library master: ' +
    'got bytes=' + bytes.length + ' sha256=' + actualSha256 +
    '; expected bytes=' + expectedBytes + ' sha256=' + expectedSha256)
}
if (bytes.toString('ascii',0,4) !== 'RIFF' ||
    bytes.toString('ascii',8,12) !== 'WEBP') {
  throw new Error('[S2E3 YARD] invalid WebP signature')
}
if (bytes.toString('ascii',12,16) === 'VP8X') {
  const width = bytes.readUIntLE(24,3) + 1
  const height = bytes.readUIntLE(27,3) + 1
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error('[S2E3 YARD] wrong dimensions ' + width + 'x' + height)
  }
}
console.log('[S2E3 YARD] VERIFIED public GET, Content-Type=' + mime +
  ', bytes=' + bytes.length + ', SHA-256=' + actualSha256 +
  '; this APPROVED file is distinct from the earlier DRAFT')
