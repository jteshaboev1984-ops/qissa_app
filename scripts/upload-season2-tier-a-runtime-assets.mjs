import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const verifyOnly = args.has('--verify-only')
const verifyLocal = args.has('--verify-local')
const expectAbsent = args.has('--expect-absent')

const selectedModes = [apply, verifyOnly, verifyLocal, expectAbsent].filter(Boolean).length
if (selectedModes > 1) {
  console.error(
    '[season2-tier-a-upload] choose one mode: --apply, --verify-only, --verify-local, or --expect-absent',
  )
  process.exit(2)
}

const root = process.cwd()
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/season2/season2_tier_a_runtime_asset_inventory.json'),
    'utf8',
  ),
)

const assetDir = path.resolve(
  process.env.SEASON2_TIER_A_ASSET_DIR ??
    path.join(root, '.local/season2-tier-a-runtime-webp'),
)
const projectUrl = (
  process.env.QISSA_SUPABASE_URL ??
  'https://phwakdpxxyncyslvnqht.supabase.co'
).replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const sha256 = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex')

const objectUrl = (item) =>
  `${projectUrl}/storage/v1/object/${inventory.supabase_bucket}/${item.supabase_object_path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`

const publicUrl = (item) =>
  `${projectUrl}/storage/v1/object/public/${inventory.supabase_bucket}/${item.supabase_object_path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`

const loadAndVerifyLocal = (item) => {
  const filePath = path.join(assetDir, item.filename)
  if (!fs.existsSync(filePath)) {
    throw new Error(`${item.asset_id}: missing local file ${filePath}`)
  }

  const buffer = fs.readFileSync(filePath)
  if (buffer.length !== item.bytes) {
    throw new Error(
      `${item.asset_id}: local byte size ${buffer.length} != inventory ${item.bytes}`,
    )
  }

  const digest = sha256(buffer)
  if (digest !== item.sha256) {
    throw new Error(
      `${item.asset_id}: local sha256 ${digest} != inventory ${item.sha256}`,
    )
  }

  return buffer
}

const verifyPublic = async (item) => {
  const response = await fetch(publicUrl(item), { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(
      `${item.asset_id}: public verification returned HTTP ${response.status}`,
    )
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('image/webp')) {
    throw new Error(
      `${item.asset_id}: public content-type ${contentType || '<missing>'} is not image/webp`,
    )
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length !== item.bytes) {
    throw new Error(
      `${item.asset_id}: public byte size ${buffer.length} != inventory ${item.bytes}`,
    )
  }

  const digest = sha256(buffer)
  if (digest !== item.sha256) {
    throw new Error(
      `${item.asset_id}: public sha256 ${digest} != inventory ${item.sha256}`,
    )
  }
}

const verifyAbsent = async (item) => {
  const response = await fetch(publicUrl(item), { cache: 'no-store' })
  if (response.ok) {
    throw new Error(
      `${item.asset_id}: expected object to be absent but public URL returned HTTP ${response.status}`,
    )
  }
  if (response.status !== 404 && response.status !== 400) {
    throw new Error(
      `${item.asset_id}: expected absent object to return 404/400, got HTTP ${response.status}`,
    )
  }
}

const verifyLocalBundle = () => {
  if (!fs.existsSync(assetDir)) {
    throw new Error(
      `asset directory does not exist: ${assetDir}; set SEASON2_TIER_A_ASSET_DIR to the extracted runtime bundle`,
    )
  }

  const buffers = new Map()
  for (const item of inventory.items) {
    buffers.set(item.asset_id, loadAndVerifyLocal(item))
  }
  return buffers
}

if (expectAbsent) {
  try {
    for (const item of inventory.items) {
      await verifyAbsent(item)
      console.log(`[season2-tier-a-upload] ABSENT ${item.asset_id}`)
    }
    console.log(
      `[season2-tier-a-upload] PASS absent ${inventory.count}/${inventory.count}`,
    )
  } catch (error) {
    console.error(
      `[season2-tier-a-upload] absent-state check failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exit(1)
  }
  process.exit(0)
}

if (verifyOnly) {
  try {
    for (const item of inventory.items) {
      await verifyPublic(item)
      console.log(`[season2-tier-a-upload] VERIFIED ${item.asset_id}`)
    }
    console.log(
      `[season2-tier-a-upload] PASS public verification ${inventory.count}/${inventory.count}`,
    )
  } catch (error) {
    console.error(
      `[season2-tier-a-upload] public verification failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exit(1)
  }
  process.exit(0)
}

let buffers
try {
  buffers = verifyLocalBundle()
} catch (error) {
  console.error(
    `[season2-tier-a-upload] local verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  )
  process.exit(1)
}

console.log(
  `[season2-tier-a-upload] local bundle verified: ${inventory.count} files · ${inventory.total_bytes} bytes`,
)

if (verifyLocal || !apply) {
  if (!apply) {
    console.log('[season2-tier-a-upload] PASS local verification; no network writes performed')
  }
  process.exit(0)
}

if (!serviceKey) {
  console.error(
    '[season2-tier-a-upload] --apply requires SUPABASE_SERVICE_ROLE_KEY',
  )
  process.exit(2)
}

try {
  for (const item of inventory.items) {
    const response = await fetch(objectUrl(item), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'content-type': 'image/webp',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-upsert': 'true',
      },
      body: buffers.get(item.asset_id),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(
        `${item.asset_id}: upload returned HTTP ${response.status}: ${body.slice(0, 400)}`,
      )
    }

    console.log(`[season2-tier-a-upload] UPLOADED ${item.asset_id}`)
  }

  for (const item of inventory.items) {
    await verifyPublic(item)
    console.log(`[season2-tier-a-upload] VERIFIED ${item.asset_id}`)
  }

  console.log(
    `[season2-tier-a-upload] PASS uploaded and verified ${inventory.count}/${inventory.count} Tier A assets`,
  )
} catch (error) {
  console.error(
    `[season2-tier-a-upload] FAILED: ${
      error instanceof Error ? error.message : String(error)
    }`,
  )
  process.exit(1)
}
