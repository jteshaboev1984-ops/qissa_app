import fs from 'node:fs'
import path from 'node:path'

const dist = path.join(process.cwd(), 'dist')
if (!fs.existsSync(dist)) {
  console.error('[story2-bundle] dist/ is missing; run the production build first')
  process.exit(2)
}

const forbidden = [
  'Тайна восточного каравана',
  'seven_roads_tayna_vostochnogo_karavana',
  'Рашид и Барлас действительно сбежали.',
  'seven_roads_story2_p1_img_01_v1',
  'seven-roads/story2_v2/',
]

const hits = []

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }

    if (!/\.(?:html|js|css|json|txt|map)$/i.test(entry.name)) continue
    const content = fs.readFileSync(full, 'utf8')
    for (const phrase of forbidden) {
      if (content.includes(phrase)) {
        hits.push(`${path.relative(dist, full)} contains forbidden unpublished Story 2 marker: ${phrase}`)
      }
    }
  }
}

walk(dist)

if (hits.length > 0) {
  hits.forEach((hit) => console.error(`[story2-bundle] FAIL ${hit}`))
  process.exit(1)
}

console.log('[story2-bundle] PASS')
console.log('[story2-bundle] unpublished Story 2 prose and runtime asset routes are absent from the production bundle')
