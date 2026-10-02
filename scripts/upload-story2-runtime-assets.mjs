import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const verifyOnly = args.has('--verify-only')

if (apply && verifyOnly) {
  console.error('[story2-upload] choose either --apply or --verify-only')
  process.exit(2)
}

const root = process.cwd()
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/story2/story2_runtime_asset_inventory.json'),
    'utf8',
  ),
)

const assetDir = path.resolve(
  process.env.STORY2_ASSET_DIR ??
    path.join(root, '.local/story2-runtime-webp'),
)
const projectUrl = (
  process.env.QISSA_SUPABASE_URL ??
  'https://phwakdpxxyncyslvnqht.supabase.co'
).replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const sha256 = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex')

const objectUrl = (item) =>
  `${projectUrl}/storage/v1/object/${item.supabase_bucket}/${item.supabase_object_path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`

const publicUrl = (item) =>
  `${projectUrl}/storage/v1/object/public/${item.supabase_bucket}/${item.supabase_object_path
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

if (!fs.existsSync(assetDir)) {
  console.error(`[story2-upload] asset directory does not exist: ${assetDir}`)
  console.error(
    '[story2-upload] set STORY2_ASSET_DIR to the folder containing the 28 locked WebPs',
  )
  process.exit(2)
}

const buffers = new Map()
try {
  for (const item of inventory.items) {
    buffers.set(item.asset_id, loadAndVerifyLocal(item))
  }
} catch (error) {
  console.error(
    `[story2-upload] local verification failed: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
}

console.log(
  `[story2-upload] local bundle verified: ${inventory.count} files · ${inventory.total_bytes} bytes`,
)

if (!apply && !verifyOnly) {
  console.log('[story2-upload] DRY RUN — no network writes performed')
  console.log(
    '[story2-upload] use --verify-only to verify already-hosted objects, or --apply to upload/upsert and verify',
  )
  process.exit(0)
}

if (verifyOnly) {
  try {
    for (const item of inventory.items) {
      await verifyPublic(item)
      console.log(`[story2-upload] VERIFIED ${item.asset_id}`)
    }
    console.log(
      `[story2-upload] PASS public verification ${inventory.count}/${inventory.count}`,
    )
    process.exit(0)
  } catch (error) {
    console.error(
      `[story2-upload] public verification failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exit(1)
  }
}

if (!serviceKey) {
  console.error(
    '[story2-upload] --apply requires SUPABASE_SERVICE_ROLE_KEY',
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

    console.log(`[story2-upload] UPLOADED ${item.asset_id}`)
  }

  for (const item of inventory.items) {
    await verifyPublic(item)
    console.log(`[story2-upload] VERIFIED ${item.asset_id}`)
  }

  console.log(
    `[story2-upload] PASS uploaded and verified ${inventory.count}/${inventory.count} Story 2 assets`,
  )
} catch (error) {
  console.error(
    `[story2-upload] FAILED: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
}
