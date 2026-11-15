import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

// Remote byte-for-byte proof for user-uploaded, owner-approved illustrations.
// This runs only on CI, never during local/offline reading-series preflight.
const base = 'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/'
const assets = [
  {
    name: 'seven_roads_s2e3_farid_gate_arrest_01_APPROVED.webp',
    size: 532314,
    sha256: '00f1c705bbd1c446c354a00852039b57a867ff7166839dc88da5170e03c9a8b1',
  },
  {
    name: 'seven_roads_s2e3_driver_danyar_after_attack_02_APPROVED.webp',
    size: 303376,
    sha256: '853e88ca1394cc61c7b8857145ad12adf22e70b12d02eadfd211a1f85d077849',
  },
  {
    name: 'seven_roads_s2e3_farid_capital_trial_glance_03_APPROVED.webp',
    size: 286370,
    sha256: 'b9c8f1ea0b446c4ac3daaa7c4bbea3ff14995256048b173ffc4d8741fb1d16dd',
  },
  {
    name: 'seven_roads_s4e2_blue_triangle_merchants_02_APPROVED.webp',
    size: 333144,
    sha256: 'ecd4faa7dfb4921e240289dd3d90c50fd8e649c513b3b5bdba9e8868aaace262',
  },
  {
    // Do not point to the superseded non-v2 horse artwork.
    name: 'seven_roads_s4e2_bay_horse_roadside_escape_01_APPROVED_v2.webp',
    size: 566016,
    sha256: '4a7aa0f82c50c9e5160cc38f29c1ab8660d54bc8debcc00b3504aec89df797c0',
  },
]

for (const asset of assets) {
  const response = await fetch(base + asset.name, {
    cache: 'no-store',
    signal: AbortSignal.timeout(30000),
  })
  assert.ok(response.ok, `Public scene image HTTP ${response.status}: ${asset.name}`)
  assert.ok(
    (response.headers.get('content-type') ?? '').includes('image/webp'),
    `Wrong content-type for ${asset.name}`,
  )
  const bytes = Buffer.from(await response.arrayBuffer())
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  assert.equal(bytes.length, asset.size, `Wrong WebP byte count: ${asset.name}`)
  assert.equal(sha256, asset.sha256, `Remote WebP differs from approved master derivative: ${asset.name}`)
  console.log(`[series30-art-remote] OK ${asset.name} (${bytes.length} bytes)`)
}
console.log('[series30-art-remote] PASS 5/5 remote GET, MIME, byte lengths and SHA256')
