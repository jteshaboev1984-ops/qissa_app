import fs from 'node:fs'
import path from 'node:path'

const dist = path.join(process.cwd(), 'dist')
if (!fs.existsSync(dist)) {
  console.error('[story2-bundle-open] dist/ is missing; run the production build first')
  process.exit(2)
}

const required = [
  'Тайна восточного каравана',
  'Sharqiy karvon siri',
  'seven_roads_tayna_vostochnogo_karavana',
  'seven_roads_story2_cover_v1',
  'seven_roads_story2_p1_img_01_v1',
  'seven_roads_story2_p6a_img_03_v1',
  'seven_roads_story2_p6b_img_03_v1',
  'seven_roads_story2_p8a_img_01_v1',
  'seven_roads_story2_p8b_img_01_v1',
  'seven_roads_story2_p10_img_05_v1',
  'seven-roads/story2_v2/',
]

const files = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (/\.(?:html|js|css|json|txt|map)$/i.test(entry.name)) files.push(full)
  }
}
walk(dist)

const corpus = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
const missing = required.filter((marker) => !corpus.includes(marker))

if (missing.length > 0) {
  missing.forEach((marker) =>
    console.error(`[story2-bundle-open] FAIL missing published Story 2 marker: ${marker}`),
  )
  process.exit(1)
}

console.log('[story2-bundle-open] PASS')
console.log('[story2-bundle-open] published Story 2 RU/UZ prose, cover, branch art, and runtime route are present')
