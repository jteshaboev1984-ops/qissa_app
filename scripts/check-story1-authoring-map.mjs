import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const map = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/season2/story1_authoring_map.json'),
    'utf8',
  ),
)
const sources = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/qissa/season2/season2_literary_source_index.json'),
    'utf8',
  ),
)
const tierA = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/data/authored/season2TierAVisualSlots.json'),
    'utf8',
  ),
)

const errors = []
const fail = (message) => errors.push(message)

if (map.version !== 'story1-authoring-map-1') fail(`unexpected map version: ${map.version}`)
if (map.status !== 'staging-source-locked') fail(`unexpected status: ${map.status}`)
if (map.story_number !== 1) fail(`story_number must be 1, got ${map.story_number}`)
if (!Array.isArray(map.parts) || map.parts.length !== 3) {
  fail(`Story 1 authoring map must contain exactly 3 parts, got ${map.parts?.length ?? 0}`)
}

const source = sources.stories?.find((entry) => entry.story_number === 1)
if (!source) {
  fail('Story 1 missing from canonical literary source index')
} else {
  if (map.canonical_source.filename !== source.canonical_filename) {
    fail('Story 1 canonical filename drifted from source index')
  }
  if (map.canonical_source.sha256 !== source.sha256) {
    fail('Story 1 canonical source SHA drifted from source index')
  }
  if (map.canonical_source.lines !== source.lines) {
    fail('Story 1 canonical source line count drifted from source index')
  }
}

const partIds = new Set()
const decisionIds = new Set()
const choiceIds = new Set()
const mappedTierA = new Map()
for (const slot of tierA.slots ?? []) {
  if (slot.story_number === 1) mappedTierA.set(slot.slot_id, slot)
}

for (const [index, part] of (map.parts ?? []).entries()) {
  if (part.order !== index + 1) fail(`${part.part_id}: order must be ${index + 1}`)
  if (partIds.has(part.part_id)) fail(`duplicate part id: ${part.part_id}`)
  partIds.add(part.part_id)

  if (!part.story_text?.source_lines || part.story_text.source_lines.length !== 2) {
    fail(`${part.part_id}: story_text source range is required`)
  }
  if (!/^[a-f0-9]{64}$/.test(part.story_text?.sha256 ?? '')) {
    fail(`${part.part_id}: invalid story_text SHA`)
  }

  for (const slot of part.image_slots ?? []) {
    const locked = mappedTierA.get(slot.slot_id)
    if (!locked) {
      fail(`${part.part_id}: unknown Story 1 Tier A slot ${slot.slot_id}`)
      continue
    }
    if (locked.asset_id !== slot.asset_id) {
      fail(`${slot.slot_id}: asset id drifted from Tier A manifest`)
    }
    if (locked.after_text !== slot.after_text) {
      fail(`${slot.slot_id}: anchor text drifted from Tier A manifest`)
    }
    if (slot.runtime_state !== 'hosted-verified') {
      fail(`${slot.slot_id}: Story 1 authoring map must mark hosted-verified`)
    }
    if (locked.runtime_state !== 'hosted-runtime-ready') {
      fail(`${slot.slot_id}: Tier A manifest must mark hosted-runtime-ready`)
    }
  }

  const decision = part.decision
  if (!decision) {
    fail(`${part.part_id}: each Story 1 authoring part must contain one decision`)
    continue
  }
  if (decisionIds.has(decision.decision_id)) fail(`duplicate decision id: ${decision.decision_id}`)
  decisionIds.add(decision.decision_id)
  if (!Array.isArray(decision.choices) || decision.choices.length !== 2) {
    fail(`${decision.decision_id}: exactly two choices required`)
  }
  if (!decision.memory_key?.trim()) fail(`${decision.decision_id}: memory key is required`)
  if (!decision.convergence_contract?.trim()) {
    fail(`${decision.decision_id}: convergence contract is required`)
  }

  for (const choice of decision.choices ?? []) {
    if (choiceIds.has(choice.choice_id)) fail(`duplicate choice id: ${choice.choice_id}`)
    choiceIds.add(choice.choice_id)
    if (!choice.text?.trim()) fail(`${choice.choice_id}: choice text is required`)
    if (!choice.memory_value?.trim()) fail(`${choice.choice_id}: memory value is required`)
    if (!choice.resolution?.source_lines || choice.resolution.source_lines.length !== 2) {
      fail(`${choice.choice_id}: resolution source range is required`)
    }
    if (!/^[a-f0-9]{64}$/.test(choice.resolution?.sha256 ?? '')) {
      fail(`${choice.choice_id}: invalid resolution SHA`)
    }
  }
}

if ((mappedTierA.size ?? 0) !== 2) fail(`expected exactly 2 Story 1 Tier A slots, got ${mappedTierA.size}`)
const mappedSlots = new Set((map.parts ?? []).flatMap((part) => (part.image_slots ?? []).map((slot) => slot.slot_id)))
for (const slotId of mappedTierA.keys()) {
  if (!mappedSlots.has(slotId)) fail(`Story 1 authoring map is missing Tier A slot ${slotId}`)
}

const finalParts = (map.parts ?? []).filter((part) => part.is_final)
if (finalParts.length !== 1 || finalParts[0] !== map.parts.at(-1)) {
  fail('exactly the final Story 1 authoring part must have is_final=true')
}

if (map.package_plan?.publication_state !== 'staging-only') {
  fail('Story 1 authoring map must remain staging-only')
}
if (!String(map.package_plan?.cover_status ?? '').includes('not yet assigned')) {
  fail('Story 1 cover blocker must remain explicit')
}
if (!String(map.package_plan?.localization_status ?? '').includes('not yet authored')) {
  fail('Story 1 Uzbek localization blocker must remain explicit')
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[story1-authoring-map] ${error}`))
  process.exit(1)
}

console.log('[story1-authoring-map] PASS')
console.log('[story1-authoring-map] source hash + 3 decisions + 6 branches locked')
console.log('[story1-authoring-map] 2/2 approved Tier A visual anchors aligned')
console.log('[story1-authoring-map] publication blockers remain explicit')
