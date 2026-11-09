import fs from 'node:fs'
import crypto from 'node:crypto'

const manifest = JSON.parse(fs.readFileSync('docs/qissa/season2/story3_approved_illustrations_2026-11-09.json','utf8'))
const prefix = 'seven-roads/season2_tier_a_v2/'
const base = 'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/'
const approved = new Set([
  'seven_roads_s2_story3_sarvan_market_01_APPROVED',
  'seven_roads_s2_story3_guardhouse_two_drawings_map_01_APPROVED',
])
if (manifest.bucket !== 'story-images' || manifest.prefix !== prefix ||
    manifest.publication_state !== 'unpublished' || manifest.assets?.length !== 2) {
  throw new Error('Unexpected Story 3 manifest bucket, prefix, publication state, or asset count')
}
for (const asset of manifest.assets) {
  if (!approved.has(asset.asset_id) || asset.filename !== asset.asset_id+'.webp' ||
      !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 ||
      !/^[a-f0-9]{64}$/.test(asset.sha256)) {
    throw new Error('Refusing unknown/non-approved asset in Story 3 verification: '+asset.asset_id)
  }
  const url = base + prefix + encodeURIComponent(asset.filename)
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(asset.asset_id+' HTTP GET '+response.status)
  const mime = (response.headers.get('content-type')||'').toLowerCase()
  if (!mime.includes('image/webp')) throw new Error(asset.asset_id+' unexpected MIME '+mime)
  const bytes = Buffer.from(await response.arrayBuffer())
  const sha = crypto.createHash('sha256').update(bytes).digest('hex')
  if (bytes.length !== asset.bytes || sha !== asset.sha256) {
    throw new Error(asset.asset_id+' remote bytes mismatch; expected '+asset.bytes+'/'+asset.sha256+' got '+bytes.length+'/'+sha)
  }
  const width = bytes.readUInt32LE(24), height = bytes.readUInt32LE(28)
  // WebP VP8X chunks have little-endian 24-bit dimensions minus 1; use exact
  // format-aware verification only when bytes contain a VP8X header.
  if (bytes.subarray(12,16).toString('ascii') === 'VP8X') {
    const gotWidth=bytes.readUIntLE(24,3)+1, gotHeight=bytes.readUIntLE(27,3)+1
    if (gotWidth !== asset.width || gotHeight !== asset.height) {
      throw new Error(asset.asset_id+' remote dimensions mismatch '+gotWidth+'x'+gotHeight)
    }
  }
  console.log('[S2E3 ART] VERIFIED '+asset.asset_id+' MIME='+mime+' BYTES='+bytes.length+' SHA256='+sha)
}
console.log('[S2E3 ART] PASS: 2/2 owner-approved WebPs independently fetched and hash-verified; DRAFT yard is NOT included')
