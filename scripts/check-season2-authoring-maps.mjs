import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceIndex = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/qissa/season2/season2_literary_source_index.json'), 'utf8'),
)
const tierA = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/authored/season2TierAVisualSlots.json'), 'utf8'),
)

const expectedStoryNumbers = [1, 3, 4, 5, 6, 7]
const expectedDecisionCounts = new Map([
  [1, 3],
  [3, 3],
  [4, 2],
  [5, 1],
  [6, 2],
  [7, 1],
])
const expectedTierASlotCounts = new Map([
  [1, 2],
  [3, 1],
  [4, 1],
  [5, 2],
  [6, 2],
  [7, 2],
])

const errors = []
const fail = (message) => errors.push(message)

const sourceByStory = new Map(
  (sourceIndex.stories ?? []).map((entry) => [entry.story_number, entry]),
)
const tierAByStory = new Map()
for (const slot of tierA.slots ?? []) {
  if (!expectedStoryNumbers.includes(slot.story_number)) continue
  const list = tierAByStory.get(slot.story_number) ?? []
  list.push(slot)
  tierAByStory.set(slot.story_number, list)
}

for (const storyNumber of expectedStoryNumbers) {
  const mapPath = path.join(
    root,
    `docs/qissa/season2/story${storyNumber}_authoring_map.json`,
  )
  if (!fs.existsSync(mapPath)) {
    fail(`Story ${storyNumber}: missing authoring map`)
    continue
  }

  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
  const source = sourceByStory.get(storyNumber)
  const expectedSlots = tierAByStory.get(storyNumber) ?? []

  if (map.version !== `story${storyNumber}-authoring-map-1`) {
    fail(`Story ${storyNumber}: unexpected map version ${map.version}`)
  }
  if (map.status !== 'staging-source-locked') {
    fail(`Story ${storyNumber}: map must remain staging-source-locked`)
  }
  if (map.story_number !== storyNumber) {
    fail(`Story ${storyNumber}: map story_number mismatch`)
  }
  if (!source) {
    fail(`Story ${storyNumber}: missing canonical literary source index entry`)
  } else {
    if (map.canonical_source?.filename !== source.canonical_filename) {
      fail(`Story ${storyNumber}: canonical filename drifted`)
    }
    if (map.canonical_source?.sha256 !== source.sha256) {
      fail(`Story ${storyNumber}: canonical source SHA drifted`)
    }
    if (map.canonical_source?.lines !== source.lines) {
      fail(`Story ${storyNumber}: canonical source line count drifted`)
    }
  }

  const parts = map.parts ?? []
  const expectedDecisions = expectedDecisionCounts.get(storyNumber)
  if (parts.length !== expectedDecisions) {
    fail(
      `Story ${storyNumber}: expected ${expectedDecisions} authoring parts/decisions, got ${parts.length}`,
    )
  }

  const partIds = new Set()
  const decisionIds = new Set()
  const choiceIds = new Set()
  const mappedSlots = new Map()

  parts.forEach((part, index) => {
    if (part.order !== index + 1) {
      fail(`Story ${storyNumber} ${part.part_id}: order must be ${index + 1}`)
    }
    if (partIds.has(part.part_id)) fail(`Story ${storyNumber}: duplicate part_id ${part.part_id}`)
    partIds.add(part.part_id)

    if (!Array.isArray(part.story_text?.source_lines) || part.story_text.source_lines.length !== 2) {
      fail(`Story ${storyNumber} ${part.part_id}: story_text source range missing`)
    }
    if (!/^[a-f0-9]{64}$/.test(part.story_text?.sha256 ?? '')) {
      fail(`Story ${storyNumber} ${part.part_id}: invalid story_text SHA`)
    }

    for (const slot of part.image_slots ?? []) {
      if (mappedSlots.has(slot.slot_id)) {
        fail(`Story ${storyNumber}: duplicate mapped Tier A slot ${slot.slot_id}`)
      }
      mappedSlots.set(slot.slot_id, slot)
    }

    const decision = part.decision
    if (!decision) {
      fail(`Story ${storyNumber} ${part.part_id}: decision is required`)
      return
    }
    if (decisionIds.has(decision.decision_id)) {
      fail(`Story ${storyNumber}: duplicate decision_id ${decision.decision_id}`)
    }
    decisionIds.add(decision.decision_id)
    if (!decision.prompt?.trim()) fail(`Story ${storyNumber} ${decision.decision_id}: missing prompt`)
    if (!decision.memory_key?.trim()) fail(`Story ${storyNumber} ${decision.decision_id}: missing memory key`)
    if (!decision.convergence_contract?.trim()) {
      fail(`Story ${storyNumber} ${decision.decision_id}: missing convergence contract`)
    }
    if (!Array.isArray(decision.choices) || decision.choices.length !== 2) {
      fail(`Story ${storyNumber} ${decision.decision_id}: exactly two choices required`)
    }

    for (const choice of decision.choices ?? []) {
      if (choiceIds.has(choice.choice_id)) {
        fail(`Story ${storyNumber}: duplicate choice_id ${choice.choice_id}`)
      }
      choiceIds.add(choice.choice_id)
      if (!choice.text?.trim()) fail(`Story ${storyNumber} ${choice.choice_id}: missing text`)
      if (!choice.memory_value?.trim()) {
        fail(`Story ${storyNumber} ${choice.choice_id}: missing memory value`)
      }
      if (!Array.isArray(choice.resolution?.source_lines) || choice.resolution.source_lines.length !== 2) {
        fail(`Story ${storyNumber} ${choice.choice_id}: resolution source range missing`)
      }
      if (!/^[a-f0-9]{64}$/.test(choice.resolution?.sha256 ?? '')) {
        fail(`Story ${storyNumber} ${choice.choice_id}: invalid resolution SHA`)
      }
    }
  })

  const finalParts = parts.filter((part) => part.is_final)
  if (finalParts.length !== 1 || finalParts[0] !== parts.at(-1)) {
    fail(`Story ${storyNumber}: exactly the last authoring part must be final`)
  }
  if (!parts.at(-1)?.post_choice_text?.source_lines) {
    fail(`Story ${storyNumber}: final common/post-choice source range is required`)
  }

  if (expectedSlots.length !== expectedTierASlotCounts.get(storyNumber)) {
    fail(`Story ${storyNumber}: Tier A manifest slot count drifted`)
  }
  for (const locked of expectedSlots) {
    const mapped = mappedSlots.get(locked.slot_id)
    if (!mapped) {
      fail(`Story ${storyNumber}: authoring map missing Tier A slot ${locked.slot_id}`)
      continue
    }
    if (mapped.asset_id !== locked.asset_id) {
      fail(`Story ${storyNumber} ${locked.slot_id}: asset id drifted`)
    }
    if (mapped.after_text !== locked.after_text) {
      fail(`Story ${storyNumber} ${locked.slot_id}: anchor text drifted`)
    }
    if (mapped.runtime_state !== 'hosted-verified') {
      fail(`Story ${storyNumber} ${locked.slot_id}: authoring map must mark hosted-verified`)
    }
    if (locked.runtime_state !== 'hosted-runtime-ready') {
      fail(`Story ${storyNumber} ${locked.slot_id}: Tier A manifest must mark hosted-runtime-ready`)
    }
  }
  if (mappedSlots.size !== expectedSlots.length) {
    fail(
      `Story ${storyNumber}: authoring map contains ${mappedSlots.size} image slots but Tier A manifest has ${expectedSlots.length}`,
    )
  }

  if (map.package_plan?.publication_state !== 'staging-only') {
    fail(`Story ${storyNumber}: authoring map must remain staging-only`)
  }
  if (map.package_plan?.cover_policy !== 'shared-season-cover') {
    fail(`Story ${storyNumber}: must use the shared Season 2 cover policy`)
  }
  if (map.package_plan?.shared_season_cover_asset_id !== 'seven_roads_season2_cover_v1') {
    fail(`Story ${storyNumber}: shared Season 2 cover asset id drifted`)
  }
  if (
    !String(map.package_plan?.cover_status ?? '').includes('approved') ||
    !String(map.package_plan?.cover_status ?? '').includes('hosting pending') ||
    !String(map.package_plan?.cover_status ?? '').includes('no episode-specific cover')
  ) {
    fail(`Story ${storyNumber}: shared-cover approval state or per-episode-cover policy drifted`)
  }
  if (!String(map.package_plan?.localization_status ?? '').includes('not yet authored')) {
    fail(`Story ${storyNumber}: Uzbek localization blocker must remain explicit`)
  }
  if (!Array.isArray(map.blockers_before_runtime_package) || map.blockers_before_runtime_package.length < 1) {
    fail(`Story ${storyNumber}: localization blocker must remain explicit`)
  }
  const blockerText = (map.blockers_before_runtime_package ?? []).join(' ')
  if (/cover/i.test(blockerText)) {
    fail(`Story ${storyNumber}: episode-specific cover blocker must not return`)
  }
  if (!/Uzbek/i.test(blockerText)) {
    fail(`Story ${storyNumber}: Uzbek localization blocker must remain explicit`)
  }
  if (!map.package_plan?.staging_ru_package?.trim()) {
    fail(`Story ${storyNumber}: Russian staging package path is required`)
  }
  if (map.package_plan?.staging_ru_package_status !== 'built-and-validated-pending-release-gates') {
    fail(`Story ${storyNumber}: unexpected Russian staging package status`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[season2-authoring-maps] ${error}`))
  process.exit(1)
}

console.log('[season2-authoring-maps] PASS')
console.log('[season2-authoring-maps] Stories 1 and 3-7 source maps are locked')
console.log('[season2-authoring-maps] 12 decisions / 24 branch resolutions mapped without prose rewriting')
console.log('[season2-authoring-maps] 10/10 hosted Tier A image anchors aligned to their authoring parts')
console.log('[season2-authoring-maps] Russian episode packages are recorded; no per-episode covers; Uzbek localization remains explicit')
