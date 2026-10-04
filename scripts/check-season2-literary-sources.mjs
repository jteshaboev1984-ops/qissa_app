import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceIndex = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/season2/season2_literary_source_index.json'),
    'utf8',
  ),
)
const visualSlots = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/data/authored/season2TierAVisualSlots.json'),
    'utf8',
  ),
)
const story2 = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/data/authored/taynaVostochnogoKaravanaV4.ru.json'),
    'utf8',
  ),
)

const errors = []
const fail = (message) => errors.push(message)

if (sourceIndex.version !== 'season2-literary-source-index-1') {
  fail(`unexpected source index version: ${sourceIndex.version}`)
}
if (
  sourceIndex.canonical_library_root !==
  '/QISSA/production/seven_roads/season2_text/approved/'
) {
  fail(`unexpected literary root: ${sourceIndex.canonical_library_root}`)
}
if (!Array.isArray(sourceIndex.stories) || sourceIndex.stories.length !== 7) {
  fail(`expected seven literary sources, got ${sourceIndex.stories?.length ?? 0}`)
}

const byStory = new Map()
for (const entry of sourceIndex.stories ?? []) {
  if (!Number.isInteger(entry.story_number) || entry.story_number < 1 || entry.story_number > 7) {
    fail(`invalid story number: ${entry.story_number}`)
    continue
  }
  if (byStory.has(entry.story_number)) {
    fail(`duplicate literary source for Story ${entry.story_number}`)
  }
  byStory.set(entry.story_number, entry)

  if (!entry.title_ru?.trim()) fail(`Story ${entry.story_number}: missing title_ru`)
  if (!entry.canonical_filename?.endsWith('.md')) {
    fail(`Story ${entry.story_number}: canonical filename must be markdown`)
  }
  if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? '')) {
    fail(`Story ${entry.story_number}: invalid sha256`)
  }
  if (!Number.isInteger(entry.bytes) || entry.bytes <= 0) {
    fail(`Story ${entry.story_number}: invalid byte count`)
  }
  if (!Number.isInteger(entry.lines) || entry.lines <= 0) {
    fail(`Story ${entry.story_number}: invalid line count`)
  }
  if (!Number.isInteger(entry.choice_count) || entry.choice_count < 0) {
    fail(`Story ${entry.story_number}: invalid choice_count`)
  }
}

for (let storyNumber = 1; storyNumber <= 7; storyNumber += 1) {
  if (!byStory.has(storyNumber)) fail(`missing literary source for Story ${storyNumber}`)
}

for (const slot of visualSlots.slots ?? []) {
  if (slot.story_number === 2) continue
  const entry = byStory.get(slot.story_number)
  if (!entry) continue
  if (slot.source_reference !== entry.canonical_filename) {
    fail(
      `${slot.slot_id}: source_reference=${slot.source_reference} does not match canonical ${entry.canonical_filename}`,
    )
  }
}

const story2Entry = byStory.get(2)
if (story2Entry) {
  if (story2Entry.publication_state !== 'published_as_authored_v4') {
    fail('Story 2 literary source must remain marked published_as_authored_v4')
  }
  if (story2.source_file !== '/QISSA/production/seven_roads/story2_v2/seven_roads_story2_interactive_v4_continuity_sync.md') {
    fail(`published Story 2 source_file drifted: ${story2.source_file}`)
  }
  if (!story2Entry.version_note?.includes('header still says V2')) {
    fail('Story 2 V4/V2 version discrepancy must remain explicitly documented')
  }
}

for (const storyNumber of [4, 7]) {
  const entry = byStory.get(storyNumber)
  if (!entry?.version_note?.trim()) {
    fail(`Story ${storyNumber}: filename/header version mismatch must stay documented`)
  }
  if (entry?.version_resolution_status !== 'resolved') {
    fail(`Story ${storyNumber}: filename/header version decision must be explicitly resolved`)
  }
  if (!entry?.runtime_version_decision?.trim()) {
    fail(`Story ${storyNumber}: runtime version decision text is required`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[season2-literary-sources] ${error}`))
  process.exit(1)
}

console.log('[season2-literary-sources] PASS')
console.log('[season2-literary-sources] 7/7 canonical literary snapshots indexed')
console.log('[season2-literary-sources] Tier A slot source refs match canonical source filenames')
console.log('[season2-literary-sources] known version-label discrepancies are explicitly resolved without rewriting source prose')
