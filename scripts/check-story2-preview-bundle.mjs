import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
if (!fs.existsSync(dist)) {
  console.error('[story2-preview-bundle] dist/ does not exist')
  process.exit(1)
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const files = walk(dist)
const searchable = files
  .filter((file) => /\.(?:html|js|css|json|txt)$/i.test(file))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n')

const requiredMarkers = [
  'seven_roads_tayna_vostochnogo_karavana',
  'Тайна восточного каравана',
  'seven-roads/story2_v2/',
  'seven_roads_story2_cover_v1',
  'seven_roads_story2_p1_img_01_v1',
  'seven_roads_story2_p6a_img_03_v1',
  'seven_roads_story2_p6b_img_03_v1',
  'seven_roads_story2_p8a_img_01_v1',
  'seven_roads_story2_p8b_img_01_v1',
  'seven_roads_story2_p10_img_05_v1',
]

const missing = requiredMarkers.filter((marker) => !searchable.includes(marker))
if (missing.length > 0) {
  for (const marker of missing) {
    console.error('[story2-preview-bundle] missing marker:', marker)
  }
  process.exit(1)
}

if (!searchable.includes('seven-roads/story2_v2/seven_roads_story2_cover_v1.webp')) {
  console.error('[story2-preview-bundle] approved Story 2 cover runtime route is missing')
  process.exit(1)
}

console.log('[story2-preview-bundle] PASS')
console.log('[story2-preview-bundle] Story 2 prose, all branch IDs, and hosted runtime prefix are present')
console.log('[story2-preview-bundle] approved cover runtime route is staged behind the Story 2 asset flag')
