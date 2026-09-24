import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const docsFixturePath = path.join(root, 'docs/qissa/ai/fixtures/prazdnik_muzhestva_interactive_v3.ru.json')
const runtimeFixturePath = path.join(root, 'src/data/authored/prazdnikMuzhestvaV3.ru.json')
const v2Path = path.join(root, 'docs/qissa/ai/reviews/2026-09-23_prazdnik_muzhestva_working_v2.md')
const assetRegistryPath = path.join(root, 'src/data/authoredStoryAssets.ts')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const fail = (message) => {
  console.error(`[authored-v3] ${message}`)
  process.exitCode = 1
}

const docsStory = readJson(docsFixturePath)
const runtimeStory = readJson(runtimeFixturePath)

if (JSON.stringify(docsStory) !== JSON.stringify(runtimeStory)) {
  fail('runtime authored story package drifted from the approved docs fixture')
}

const story = runtimeStory
const decisions = story.parts.filter((part) => part.decision)
const sharedSlots = story.parts.flatMap((part) => part.image_slots ?? [])
const choiceArts = decisions.flatMap((part) => part.decision.choices.map((choice) => choice.illustration))
const assetIds = [
  story.cover_illustration.asset_id,
  ...sharedSlots.map((slot) => slot.asset_id),
  ...choiceArts.map((illustration) => illustration.asset_id),
]

if (story.parts.length !== 7) fail(`expected 7 parts, got ${story.parts.length}`)
if (decisions.length !== 4) fail(`expected 4 decisions, got ${decisions.length}`)
if (decisions.some((part) => part.decision.choices.length !== 2)) fail('every decision must have exactly 2 choices')
if (sharedSlots.length !== 18) fail(`expected 18 shared image slots, got ${sharedSlots.length}`)
if (choiceArts.length !== 8) fail(`expected 8 choice images, got ${choiceArts.length}`)
if (assetIds.length !== 27) fail(`expected 27 total assets, got ${assetIds.length}`)
if (new Set(assetIds).size !== assetIds.length) fail('asset ids must be unique')

const assetRegistrySource = fs.readFileSync(assetRegistryPath, 'utf8')
const registeredAssetIds = new Set(
  [...assetRegistrySource.matchAll(/^\s*"([^"]+)":\s*"https?:\/\//gmu)].map((match) => match[1]),
)

for (const assetId of assetIds) {
  if (!registeredAssetIds.has(assetId)) fail(`asset registry missing ${assetId}`)
}

if (registeredAssetIds.size !== assetIds.length) {
  fail(`expected exactly ${assetIds.length} registered Story-1 assets, got ${registeredAssetIds.size}`)
}

const allStoryText = story.parts.map((part) => part.story_text).join('\n\n')
const staleCeremonyPhrases = [
  'юными королевскими рыцарями',
  'Темур и Самира опустились на одно колено',
  'Король коснулся саблей плеча Самиры',
]

for (const phrase of staleCeremonyPhrases) {
  if (allStoryText.includes(phrase)) fail(`stale ceremony phrase remains: ${phrase}`)
}

if (!allStoryText.includes('Так Темур и Самира стали юными бахадурами царства.')) {
  fail('approved bahadur ceremony ending is missing')
}

if (story.required_final_invariants.temur_and_samira_named_young_bahadurs !== 'true') {
  fail('bahadur final invariant is missing')
}

const bahadurImageSlot = sharedSlots.find((slot) => slot.asset_id === 'seven_roads_story1_p7_img_03_v1')
if (bahadurImageSlot?.after_text !== 'Так Темур и Самира стали юными бахадурами царства.') {
  fail('P7-IMG-03 is not anchored after the completed bahadur ceremony')
}

const paragraphsOf = (text) =>
  text.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)

for (const part of story.parts) {
  const phases = {
    story_text: paragraphsOf(part.story_text),
    post_choice_text: paragraphsOf(part.post_choice_text ?? ''),
  }

  for (const slot of part.image_slots ?? []) {
    const count = phases[slot.phase]?.filter((paragraph) => paragraph === slot.after_text).length ?? 0
    if (count !== 1) {
      fail(`${slot.slot_id}: exact image anchor must occur once in ${slot.phase}, got ${count}`)
    }
  }
}

const normalizeStoryText = (text) =>
  text
    .replace(/^## [^\n]+\n\n/gmu, '')
    .replace(/^\s*---\s*$/gmu, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

let baseline = ''
for (const part of story.parts) {
  baseline += `${part.story_text.trim()}\n\n`
  if (part.decision) {
    const baselineChoice = part.decision.choices.find((choice) =>
      story.baseline_choice_path.includes(choice.choice_id),
    )
    if (!baselineChoice) {
      fail(`${part.part_id}: baseline choice missing`)
      continue
    }
    baseline += `${baselineChoice.resolution_text.trim()}\n\n`
  }
  if (part.post_choice_text?.trim()) baseline += `${part.post_choice_text.trim()}\n\n`
}

const v2 = fs.readFileSync(v2Path, 'utf8')
const storyStart = v2.indexOf('Раз в году в Королевстве семи дорог')
if (storyStart < 0) fail('could not locate V2 story start')
const v2Story = storyStart >= 0 ? v2.slice(storyStart) : v2

if (normalizeStoryText(baseline) !== normalizeStoryText(v2Story)) {
  fail('baseline interactive path no longer reconstructs V2 exactly')
}

const branchKeys = new Set([
  'temur_escape_method',
  'samira_river_method',
  'samira_zaran_wait',
  'temur_trust_response',
])

const combinations = 2 ** decisions.length
const commonStates = []
const branchFingerprints = new Set()

for (let mask = 0; mask < combinations; mask += 1) {
  const canonState = {}
  const relationshipState = {}
  const selected = []

  decisions.forEach((part, decisionIndex) => {
    const choiceIndex = (mask >> decisionIndex) & 1
    const choice = part.decision.choices[choiceIndex]
    selected.push(choice.choice_id)

    Object.assign(canonState, choice.state_patch?.canon_updates ?? {})
    Object.assign(relationshipState, choice.state_patch?.relationship_updates ?? {})
    Object.assign(canonState, part.decision.merge_state ?? {})
  })

  for (const [key, expected] of Object.entries(story.required_final_invariants)) {
    if (Object.prototype.hasOwnProperty.call(canonState, key) && canonState[key] !== expected) {
      fail(`path ${selected.join(' > ')} contradicts invariant ${key}=${expected}`)
    }
  }

  const commonCanon = Object.fromEntries(
    Object.entries(canonState).filter(([key]) => !branchKeys.has(key)),
  )
  commonStates.push(JSON.stringify(commonCanon))

  const fingerprint = [...branchKeys]
    .map((key) => `${key}=${canonState[key] ?? ''}`)
    .join('|')
  branchFingerprints.add(fingerprint)

  if (!relationshipState.temur_samira_trust && mask >= 8) {
    fail(`choice-4 path ${selected.join(' > ')} did not preserve trust relationship memory`)
  }
}

if (new Set(commonStates).size !== 1) {
  fail('the 16 paths do not converge to one common non-branch canon state')
}

if (branchFingerprints.size !== 16) {
  fail(`expected 16 distinct branch-memory combinations, got ${branchFingerprints.size}`)
}

if (!process.exitCode) {
  console.log('[authored-v3] PASS')
  console.log(`[authored-v3] ${story.parts.length} parts · ${decisions.length} decisions · ${combinations} paths`)
  console.log(`[authored-v3] ${assetIds.length} assets · ${sharedSlots.length} shared · ${choiceArts.length} choice images`)
  console.log('[authored-v3] asset registry is complete and bahadur ceremony canon is current')
  console.log('[authored-v3] baseline reconstructs V2 and all image anchors are exact')
}
