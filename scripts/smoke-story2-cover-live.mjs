import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const expectedState = process.argv[2] ?? process.env.STORY2_COVER_EXPECTED_STATE ?? 'absent'
if (!['present', 'absent'].includes(expectedState)) {
  console.error('[story2-cover-live] expected state must be present or absent')
  process.exit(2)
}

const root = process.cwd()
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/story2/story2_cover_runtime_inventory.json'),
    'utf8',
  ),
)

const projectUrl =
  process.env.QISSA_SUPABASE_URL?.replace(/\/$/, '') ??
  'https://phwakdpxxyncyslvnqht.supabase.co'

const url =
  `${projectUrl}/storage/v1/object/public/${inventory.supabase_bucket}/${inventory.supabase_object_path}`

const response = await fetch(url, { cache: 'no-store' })

if (expectedState === 'absent') {
  if (response.ok) {
    console.error(
      `[story2-cover-live] FAIL expected absent but public cover returned HTTP ${response.status}`,
    )
    process.exit(1)
  }

  console.log(
    `[story2-cover-live] PASS expected absent · HTTP ${response.status}`,
  )
  process.exit(0)
}

if (!response.ok) {
  console.error(
    `[story2-cover-live] FAIL expected present but got HTTP ${response.status}`,
  )
  process.exit(1)
}

const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
if (!contentType.includes('image/webp')) {
  console.error(
    `[story2-cover-live] FAIL expected image/webp, got ${contentType || 'missing content-type'}`,
  )
  process.exit(1)
}

const buffer = Buffer.from(await response.arrayBuffer())
const digest = crypto.createHash('sha256').update(buffer).digest('hex')

if (buffer.length !== inventory.bytes) {
  console.error(
    `[story2-cover-live] FAIL expected ${inventory.bytes} bytes, got ${buffer.length}`,
  )
  process.exit(1)
}
if (digest !== inventory.sha256) {
  console.error(
    `[story2-cover-live] FAIL sha256 mismatch; expected ${inventory.sha256}, got ${digest}`,
  )
  process.exit(1)
}

console.log('[story2-cover-live] PASS expected present')
console.log(
  `[story2-cover-live] ${inventory.asset_id} · ${buffer.length} bytes · ${digest}`,
)
