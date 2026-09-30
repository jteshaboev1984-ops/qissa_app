import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const storyPath = path.join(root, 'src/data/authored/taynaVostochnogoKaravanaV4.ru.json')
const manifestPath = path.join(root, 'docs/qissa/story2/story2_v4_layout_manifest.json')
const seasonsPath = path.join(root, 'src/data/sevenRoadsSeasons.ts')

const story = JSON.parse(fs.readFileSync(storyPath, 'utf8'))
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const seasonsSource = fs.readFileSync(seasonsPath, 'utf8')

const errors = []
const fail = (message) => errors.push(message)
const paragraphsOf = (text = '') =>
  text.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)

if (story.story_id !== 'seven_roads_tayna_vostochnogo_karavana') {
  fail(`unexpected story_id: ${story.story_id}`)
}
if (story.story_version !== 'interactive-v4-continuity-sync') {
  fail(`unexpected story_version: ${story.story_version}`)
}
if (story.source_file !== '/QISSA/production/seven_roads/story2_v2/seven_roads_story2_interactive_v4_continuity_sync.md') {
  fail('Story 2 source_file must point to the authoritative Library V4 continuity-sync file')
}

if (story.parts.length !== 10) fail(`expected 10 Story 2 parts, got ${story.parts.length}`)
story.parts.forEach((part, index) => {
  if (part.order !== index + 1) fail(`${part.part_id}: order must be ${index + 1}`)
})

const decisions = story.parts.filter((part) => part.decision)
if (decisions.length !== 4) fail(`expected 4 decisions, got ${decisions.length}`)
if (decisions.some((part) => part.decision.choices.length !== 2)) {
  fail('every Story 2 decision must have exactly 2 choices')
}

const allChoiceIds = new Set()
const choicesByDecision = new Map()
for (const part of decisions) {
  const ids = new Set()
  for (const choice of part.decision.choices) {
    if (allChoiceIds.has(choice.choice_id)) fail(`duplicate choice_id: ${choice.choice_id}`)
    allChoiceIds.add(choice.choice_id)
    ids.add(choice.choice_id)
    if (!choice.resolution_text?.trim()) fail(`${choice.choice_id}: resolution_text is required`)
  }
  choicesByDecision.set(part.decision.decision_id, ids)
}

const expectedNoArtChoices = new Set([
  'story2_choice_1a_people',
  'story2_choice_1b_rashid_barlas_place',
  'story2_choice_2a_inside_old_yard',
  'story2_choice_2b_outside_with_shamol',
])
const expectedSelectedOnlyArtChoices = new Set([
  'story2_choice_3a_old_sarvan_yard',
  'story2_choice_3b_azim',
  'story2_choice_4a_guard_shortcut',
  'story2_choice_4b_two_bows',
])

const sharedSlots = story.parts.flatMap((part) => part.image_slots ?? [])
const choiceArts = []
for (const part of decisions) {
  for (const choice of part.decision.choices) {
    if (expectedNoArtChoices.has(choice.choice_id)) {
      if (choice.illustration !== null) fail(`${choice.choice_id}: must not invent branch art`)
      continue
    }
    if (expectedSelectedOnlyArtChoices.has(choice.choice_id)) {
      if (!choice.illustration) {
        fail(`${choice.choice_id}: selected branch illustration is required`)
      } else {
        choiceArts.push(choice.illustration)
        if (choice.illustration.behavior !== 'show_after_resolution') {
          fail(`${choice.choice_id}: illustration must use show_after_resolution`)
        }
      }
    }
  }
}

if (sharedSlots.length !== 24) fail(`expected 24 shared scene images, got ${sharedSlots.length}`)
if (choiceArts.length !== 4) fail(`expected 4 selected-branch images, got ${choiceArts.length}`)

const packageAssetIds = [
  story.cover_illustration.asset_id,
  ...sharedSlots.map((slot) => slot.asset_id),
  ...choiceArts.map((art) => art.asset_id),
]
if (packageAssetIds.length !== 29) fail(`expected 29 assets including pending cover, got ${packageAssetIds.length}`)
if (new Set(packageAssetIds).size !== packageAssetIds.length) fail('Story 2 asset IDs must be unique')
if (story.illustration_plan.planned_asset_count !== packageAssetIds.length) {
  fail('illustration_plan.planned_asset_count does not match package assets')
}

for (const part of story.parts) {
  const phaseParagraphs = {
    story_text: paragraphsOf(part.story_text),
    post_choice_text: paragraphsOf(part.post_choice_text),
  }

  for (const slot of part.image_slots ?? []) {
    const count = phaseParagraphs[slot.phase]?.filter(
      (paragraph) => paragraph === slot.after_text,
    ).length ?? 0
    if (count !== 1) {
      fail(`${slot.slot_id}: image anchor must occur exactly once in ${slot.phase}, got ${count}`)
    }
  }

  for (const segment of part.conditional_segments ?? []) {
    const count = phaseParagraphs[segment.phase]?.filter(
      (paragraph) => paragraph === segment.after_text,
    ).length ?? 0
    if (count !== 1) {
      fail(`${segment.segment_id}: conditional anchor must occur exactly once in ${segment.phase}, got ${count}`)
    }

    const choices = choicesByDecision.get(segment.when.decision_id)
    if (!choices) {
      fail(`${segment.segment_id}: unknown decision ${segment.when.decision_id}`)
    } else if (!choices.has(segment.when.choice_id)) {
      fail(`${segment.segment_id}: invalid choice ${segment.when.choice_id}`)
    }

    if (!segment.text?.trim()) fail(`${segment.segment_id}: conditional text is required`)
  }
}

const conditionalSegments = story.parts.flatMap((part) => part.conditional_segments ?? [])
if (conditionalSegments.length !== 5) {
  fail(`expected 5 deferred Choice-3 payoff segments, got ${conditionalSegments.length}`)
}

const manifestAssetIds = new Set()
const collectManifestAssets = (value) => {
  if (Array.isArray(value)) {
    value.forEach(collectManifestAssets)
    return
  }
  if (!value || typeof value !== 'object') return
  if (typeof value.asset_id === 'string') manifestAssetIds.add(value.asset_id)
  Object.values(value).forEach(collectManifestAssets)
}
collectManifestAssets(manifest.parts)

const sceneAssetIds = new Set(packageAssetIds.filter((id) => id !== story.cover_illustration.asset_id))
if (manifest.asset_count !== 28) fail(`manifest asset_count must be 28, got ${manifest.asset_count}`)
if (manifestAssetIds.size !== 28) fail(`manifest must reference 28 unique approved scene assets, got ${manifestAssetIds.size}`)
for (const assetId of sceneAssetIds) {
  if (!manifestAssetIds.has(assetId)) fail(`layout manifest missing scene asset: ${assetId}`)
}
for (const assetId of manifestAssetIds) {
  if (!sceneAssetIds.has(assetId)) fail(`layout manifest contains unknown scene asset: ${assetId}`)
}

const corpus = [
  ...story.parts.flatMap((part) => [
    part.story_text,
    part.post_choice_text,
    ...(part.conditional_segments ?? []).map((segment) => segment.text),
    ...(part.decision?.choices ?? []).map((choice) => choice.resolution_text),
  ]),
].join('\n\n')

for (const phrase of [
  'Барлас быстро вернул печать в шкаф и убрал коробочку с оттиском.',
  'Дорожная печать Араса тоже была на месте.',
  'Дорожной печати не было.',
  'В это же утро восточный караван уходил дальше с Надиром.',
  'К старому караванному двору Сарвана.',
]) {
  if (!corpus.includes(phrase)) fail(`critical V4 canon phrase is missing: ${phrase}`)
}

for (const [key, expected] of Object.entries({
  real_aras_road_seal_remains_in_treasury: 'true',
  nadir_never_carries_real_road_seal: 'true',
  rashid_barlas_remain_at_large: 'true',
  wax_impression_remains_with_barlas: 'true',
  nadir_agrees_to_continue_with_eastern_caravan: 'true',
  nadir_under_hidden_adult_control: 'true',
  temur_samira_depart_for_sarvan_with_senior_guard: 'true',
  sarvan_old_yard_becomes_next_investigation_target: 'true',
})) {
  if (story.required_final_invariants?.[key] !== expected) {
    fail(`required final invariant missing or changed: ${key}=${expected}`)
  }
}

if (!seasonsSource.includes("id: 'seven-roads-season-2'")) {
  fail('Season 2 shell entry is missing')
}
if (!seasonsSource.includes("status: 'coming_soon'")) {
  fail('Story 2 must remain coming_soon until runtime assets and localization are release-ready')
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[story2-v4] ${error}`))
  process.exit(1)
}

console.log('[story2-v4] PASS')
console.log('[story2-v4] 10 parts · 4 decisions · 16 choice paths')
console.log('[story2-v4] 28 approved scene assets · 24 shared · 4 selected-branch')
console.log('[story2-v4] 5 deferred Choice-3 payoff segments')
console.log('[story2-v4] critical road-seal canon and app-layout manifest are locked')
console.log('[story2-v4] Season 2 remains gated as coming_soon')
