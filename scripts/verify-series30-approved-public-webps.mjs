import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

// Remote byte-for-byte proof for user-uploaded, owner-approved illustrations.
// This runs only on CI, never during local/offline reading-series preflight.
const base = 'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/'
const assets = [
  {
    name: 'seven_roads_s2_story7_said_suspicious_road_notice_01_APPROVED.webp',
    size: 350378,
    sha256: 'be8fc1eb2651e2555c5c2c5a802b707703781f4b4fb0e8182bbb02a72edfda70',
  },
  {
    name: 'seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED.webp',
    size: 476610,
    sha256: '685129bc2ea5c18f575d8ef6e9253ae4c2e706b58a07d4cf67ade9e587cc9816',
  },
  {
    name: 'seven_roads_s4e5_said_stone_ridge_map_02_APPROVED.webp',
    size: 407158,
    sha256: '695169ea30439c45bb18745bc562c685359f583d27c28a76683ccf9a88b5ff10',
  },
  { name: 'seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED.webp', size: 454554,
    sha256: '733a1d9003653b0d97072a50948721d3334dff215a25f16083dd529c53af4ed7' },
  { name: 'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED.webp', size: 369590,
    sha256: '6a853a94b7600fa6750a34fbeb0f081c197169bab34401cb2308f3a882ffdc7b' },
  {
    name: 'seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED.webp',
    size: 346950,
    sha256: '7ded6261bbb78d8dc94de6d922f238057a7cc54ea01e5f0fe37cc027fc3c45e6',
  },
  {
    name: 'seven_roads_s4e3_prison_wagon_road_fork_01_APPROVED.webp',
    size: 361280,
    sha256: 'f00477166ae90ae020dfc108756a833f7db1b034c9fecb92612a9a56d3decab7',
  },
  {
    name: 'seven_roads_s4e1_dawn_departure_to_ordan_01_APPROVED.webp',
    size: 326202,
    sha256: '998a4ad57d178ef87439f253a0fb2ee005d54109b681ae9c7023738ad2090107',
  },
  {
    name: 'seven_roads_s3e11_bulut_apple_evening_02_APPROVED_v3.webp',
    size: 267928,
    sha256: '1b982536b64a0289b3ee2cbb6a5ee553aad864a3eac2ae3744366f819435937b',
  },
  {
    name: 'seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED.webp',
    size: 216852,
    sha256: '1da88ca11053d3847e697a8863b83a1abdfcbcb6af3afbc9dbeb8f94a72c86a7',
  },
  {
    name: 'seven_roads_s3e10_young_guard_water_trough_02_APPROVED.webp',
    size: 243188,
    sha256: 'c9dfc2162dd0c17d3b5d893d632b1da30c26ecbabe0f825b656727752a5437bf',
  },
  {
    name: 'seven_roads_s3e10_memorize_route_gate_01_APPROVED_v2.webp',
    size: 290850,
    sha256: 'e63df78fe3da90648d688cd052443ace83248f1a9582cc2896b3b9bb5aadea09',
  },
  {
    name: 'seven_roads_s3e6_nadir_runs_between_wagons_01_APPROVED.webp',
    size: 267232,
    sha256: '4fb68e473f6a11573278142fad86c908e6d427b873b9952dbda839a94e96bf14',
  },
  {
    name: 'seven_roads_s3e3_temur_caravan_courtyard_02_APPROVED.webp',
    size: 299718,
    sha256: 'ba66f3835ed7acea64dfcf3da17985f131a93d813310e5d9930d284bd1701c14',
  },
  {
    name: 'seven_roads_s3e3_morning_alarm_window_01_APPROVED.webp',
    size: 249700,
    sha256: '60ce0110b06f70885e7ab8c2e0e3e744ecea4a19b0517c8d955a593b94a91271',
  },
  {
    name: 'seven_roads_s2e4_western_road_map_02_APPROVED.webp',
    size: 192494,
    sha256: 'fc44e2f2d002bf08db2d063ed804c3135392fef3e9e702e4ea7514f15131dcc7',
  },
  {
    name: 'seven_roads_s2e4_missing_kamran_oak_01_APPROVED.webp',
    size: 283010,
    sha256: '07e04b97bb508e2cfef5e50bb2b0d5f876a48cbbb7ea14e3bf9d9fee5007f462',
  },
  {
    name: 'seven_roads_s2e2_missing_dark_horse_01_APPROVED.webp',
    size: 319176,
    sha256: '9d9ebef90cf3f39ed802aa0ce6e7bb57a0b3472c003c5f071dbd4b6b91cc685e',
  },
  {
    name: 'seven_roads_s2e1_danyar_old_belt_dialogue_01_APPROVED.webp',
    size: 310478,
    sha256: 'ba0584477aff699603f93ad4290a35736cb60121a5ee0fdcdef8266bad270912',
  },
  {
    name: 'seven_roads_s2e1_startled_birds_02_APPROVED.webp',
    size: 328322,
    sha256: '758067051d45229dac9fb503d3c0f8143a85c7fc04e1af97d856d12ca0cae27e',
  },
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
    name: 'seven_roads_s4e2_farid_rider_belts_glance_03_APPROVED.webp',
    size: 285206,
    sha256: 'c2bd15783a78bd8ad1c9203c590a3ed6a3fb08b64b889000310e2c733f689b69',
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
console.log('[series30-art-remote] PASS 26/26 remote GET, MIME, byte lengths and SHA256')
