// QISSA #318: independent byte-for-byte remote public Storage GET gate.
// Run from GitHub Actions after OWNER uploads the approved WebP assets.
// Do not trust storage.objects metadata or HTTP Content-Length as hash evidence.
import crypto from 'node:crypto'

const projectId = 'phwakdpxxyncyslvnqht'
const bucket = 'story-images'
const prefix = 'seven-roads/season2_tier_a_v2/'
const assets = [
  {
    id: 'seven_roads_s2_story1_hidden_network_settlement_01_APPROVED',
    expectedBytes: 324470,
    expectedSha256: '7675801ac525d30bc2ff1c4c1f0e52768fcbd0b85fd56a358804424d8b93b8ef',
    expectedWidth: 1536,
    expectedHeight: 864,
  },
  {
    id: 'seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED',
    expectedBytes: 339136,
    expectedSha256: 'd26406136b3cc1b0b4b7bad7d12eb38d287017333da87b95d30bfe9883f62426',
    expectedWidth: 1536,
    expectedHeight: 864,
  },
]

const baseUrl = `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${prefix}`
for (const asset of assets) {
  const url = baseUrl + encodeURIComponent(asset.id + '.webp')
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`[QISSA #318] ${asset.id}: HTTP GET ${response.status}`)
  const mime = (response.headers.get('content-type') ?? '').toLowerCase().split(';')[0].trim()
  if (mime !== 'image/webp') throw new Error(`[QISSA #318] ${asset.id}: bad MIME ${mime}`)
  const data = Buffer.from(await response.arrayBuffer())
  if (data.toString('ascii', 0, 4) !== 'RIFF' ||
      data.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`[QISSA #318] ${asset.id}: invalid WebP header`)
  }
  const sha = crypto.createHash('sha256').update(data).digest('hex')
  if (data.length !== asset.expectedBytes || sha !== asset.expectedSha256) {
    throw new Error(`[QISSA #318] ${asset.id}: mismatch expected ${asset.expectedBytes}/${asset.expectedSha256} actual ${data.length}/${sha}`)
  }
  if (data.toString('ascii', 12, 16) === 'VP8X') {
    const width = data.readUIntLE(24, 3) + 1
    const height = data.readUIntLE(27, 3) + 1
    if (width !== asset.expectedWidth || height !== asset.expectedHeight) {
      throw new Error(`[QISSA #318] ${asset.id}: dimensions ${width}x${height}`)
    }
  }
  console.log(`[QISSA #318] VERIFIED HTTP GET ${asset.id} MIME=${mime} BYTES=${data.length} SHA256=${sha}`)
}
console.log('[QISSA #318] PASS 2/2 owner-approved remote WebP assets')
