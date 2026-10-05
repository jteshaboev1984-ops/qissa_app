import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cover = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/season2/season2_cover_v1_inventory.json'),
    'utf8',
  ),
)

const runtime = cover.runtime_derivative
const expectedUrl =
  'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_v1/seven_roads_season2_cover_v1.webp'

const fail = (message) => {
  console.error(`[season2-cover-public] ${message}`)
  process.exit(1)
}

if (cover.status !== 'hosted_verified') {
  fail(`expected hosted_verified cover status, got ${cover.status}`)
}
if (runtime?.status !== 'hosted_verified') {
  fail(`expected hosted_verified runtime status, got ${runtime?.status}`)
}
if (runtime?.public_url !== expectedUrl) {
  fail(`unexpected public URL: ${runtime?.public_url}`)
}

const response = await fetch(expectedUrl, { cache: 'no-store' })
if (!response.ok) {
  fail(`public fetch failed: HTTP ${response.status}`)
}

const contentType = response.headers.get('content-type')?.split(';')[0]?.trim()
if (contentType !== 'image/webp') {
  fail(`expected image/webp, got ${contentType}`)
}

const bytes = Buffer.from(await response.arrayBuffer())
if (bytes.length !== runtime.bytes) {
  fail(`byte-size mismatch: expected ${runtime.bytes}, got ${bytes.length}`)
}

const sha256 = crypto.createHash('sha256').update(bytes).digest('hex')
if (sha256 !== runtime.sha256) {
  fail(`SHA-256 mismatch: expected ${runtime.sha256}, got ${sha256}`)
}

console.log('[season2-cover-public] PASS')
console.log(`[season2-cover-public] ${bytes.length} bytes, SHA-256 ${sha256}`)
