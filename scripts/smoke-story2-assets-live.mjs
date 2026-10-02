import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const expectedState = process.argv[2] ?? process.env.STORY2_ASSET_EXPECTED_STATE ?? 'present'
if (!['present', 'absent'].includes(expectedState)) {
  console.error('[story2-assets-live] expected state must be present or absent')
  process.exit(2)
}

const root = process.cwd()
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/story2/story2_runtime_asset_inventory.json'),
    'utf8',
  ),
)

const projectUrl =
  process.env.QISSA_SUPABASE_URL?.replace(/\/$/, '') ??
  'https://phwakdpxxyncyslvnqht.supabase.co'

const timeoutMs = Number(process.env.STORY2_ASSET_TIMEOUT_MS ?? 20000)
const failures = []
let present = 0
let absent = 0
let bytesChecked = 0

const sha256 = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex')

for (const item of inventory.items) {
  const url =
    `${projectUrl}/storage/v1/object/public/${item.supabase_bucket}/${item.supabase_object_path}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timer)
    failures.push(
      `${item.asset_id}: request failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    continue
  }
  clearTimeout(timer)

  if (expectedState === 'absent') {
    if (response.ok) {
      present += 1
      failures.push(
        `${item.asset_id}: expected absent but public object returned HTTP ${response.status}`,
      )
    } else {
      absent += 1
    }
    continue
  }

  if (!response.ok) {
    absent += 1
    failures.push(
      `${item.asset_id}: expected present but got HTTP ${response.status}`,
    )
    continue
  }

  present += 1

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('image/webp')) {
    failures.push(
      `${item.asset_id}: expected image/webp, got ${contentType || 'missing content-type'}`,
    )
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  bytesChecked += buffer.length

  if (buffer.length !== item.bytes) {
    failures.push(
      `${item.asset_id}: expected ${item.bytes} bytes, got ${buffer.length}`,
    )
  }

  const digest = sha256(buffer)
  if (digest !== item.sha256) {
    failures.push(
      `${item.asset_id}: sha256 mismatch; expected ${item.sha256}, got ${digest}`,
    )
  }

  console.log(
    `[story2-assets-live] OK ${item.asset_id} · ${buffer.length} bytes · ${digest.slice(0, 12)}…`,
  )
}

if (expectedState === 'absent' && present === 0 && absent === inventory.count) {
  console.log(
    `[story2-assets-live] PASS expected absent · 0/${inventory.count} public Story 2 objects`,
  )
  process.exit(0)
}

if (
  expectedState === 'present' &&
  failures.length === 0 &&
  present === inventory.count &&
  bytesChecked === inventory.total_bytes
) {
  console.log(
    `[story2-assets-live] PASS expected present · ${present}/${inventory.count} objects · ${bytesChecked} bytes verified`,
  )
  process.exit(0)
}

for (const failure of failures) {
  console.error(`[story2-assets-live] FAIL ${failure}`)
}
console.error(
  `[story2-assets-live] summary expected=${expectedState} present=${present} absent=${absent} failures=${failures.length}`,
)
process.exit(1)
