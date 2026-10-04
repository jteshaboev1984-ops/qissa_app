import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const readText = (relative) =>
  fs.readFileSync(path.join(root, relative), 'utf8')

const inventory = readJson(
  'docs/qissa/season2/season2_staging_authored_package_inventory.json',
)
const sourceIndex = readJson(
  'docs/qissa/season2/season2_literary_source_index.json',
)
const authoredStoriesSource = readText('src/data/authoredStories.ts')
const assetRegistrySource = readText('src/data/authoredStoryAssets.ts')

const errors = []
const fail = (message) => errors.push(message)
const paragraphsOf = (text = '') =>
  text.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)

const expectedStories = [1, 3, 4, 5, 6, 7]
const sourceByStory = new Map(
  (sourceIndex.stories ?? []).map((entry) => [entry.story_number, entry]),
)

if (inventory.version !== 'season2-staging-authored-packages-1') {
  fail(`unexpected inventory version: ${inventory.version}`)
}
if (inventory.status !== 'ru-episode-packages-built-single-season-cover-pending') {
  fail(`unexpected inventory status: ${inventory.status}`)
}
if (inventory.world_id !== 'seven_roads' || inventory.season_number !== 2) {
  fail('staging package inventory must belong to seven_roads Season 2')
}
if (!Array.isArray(inventory.packages) || inventory.packages.length !== 6) {
  fail(`expected 6 staging packages, got ${inventory.packages?.length ?? 0}`)
}

const inventoryByStory = new Map(
  (inventory.packages ?? []).map((entry) => [entry.story_number, entry]),
)
const seenStoryIds = new Set()

for (const storyNumber of expectedStories) {
  const entry = inventoryByStory.get(storyNumber)
  if (!entry) {
    fail(`Story ${storyNumber}: missing staging package inventory entry`)
    continue
  }

  const source = sourceByStory.get(storyNumber)
  if (!source) {
    fail(`Story ${storyNumber}: missing source-index entry`)
    continue
  }
  if (entry.source_sha256 !== source.sha256) {
    fail(`Story ${storyNumber}: source SHA drifted from literary source index`)
  }

  const packagePath = path.join(root, entry.package_path)
  if (!fs.existsSync(packagePath)) {
    fail(`Story ${storyNumber}: missing package file ${entry.package_path}`)
    continue
  }

  const packageBuffer = fs.readFileSync(packagePath)
  const packageText = packageBuffer.toString('utf8')
  const packageJson = JSON.parse(packageText)
  const blobHeader = Buffer.from(`blob ${packageBuffer.length}\0`)
  const gitBlobSha = crypto
    .createHash('sha1')
    .update(Buffer.concat([blobHeader, packageBuffer]))
    .digest('hex')

  if (gitBlobSha !== entry.github_blob_sha) {
    fail(
      `Story ${storyNumber}: package Git blob SHA drifted; inventory=${entry.github_blob_sha}, current=${gitBlobSha}`,
    )
  }

  const map = readJson(
    `docs/qissa/season2/story${storyNumber}_authoring_map.json`,
  )

  if (packageJson.schema_version !== 'authored-multi-choice-v2-deferred-branches') {
    fail(`Story ${storyNumber}: unexpected authored schema`)
  }
  if (packageJson.language !== 'ru') {
    fail(`Story ${storyNumber}: staging package must be Russian`)
  }
  if (packageJson.world_id !== 'seven_roads') {
    fail(`Story ${storyNumber}: wrong world_id`)
  }
  if (packageJson.title !== map.title_ru) {
    fail(`Story ${storyNumber}: title drifted from authoring map`)
  }
  if (packageJson.source_file !== map.canonical_source.library_path) {
    fail(`Story ${storyNumber}: source_file drifted from canonical Library path`)
  }
  if (seenStoryIds.has(packageJson.story_id)) {
    fail(`duplicate staging story_id: ${packageJson.story_id}`)
  }
  seenStoryIds.add(packageJson.story_id)

  if (
    authoredStoriesSource.includes(packageJson.story_id) ||
    authoredStoriesSource.includes(path.basename(entry.package_path))
  ) {
    fail(
      `Story ${storyNumber}: staging package must not be imported or registered in authoredStories.ts`,
    )
  }

  if (
    packageJson.cover_illustration?.status !== 'pending-shared-season-cover' ||
    packageJson.cover_illustration?.asset_id !== 'PENDING_seven_roads_season2_cover_v1'
  ) {
    fail(`Story ${storyNumber}: episode package must use the single shared Season 2 cover gate`)
  }

  const normalizedNarrativeText = [
    ...(packageJson.parts ?? []).map((part) => part.story_text ?? ''),
    ...(packageJson.parts ?? []).map((part) => part.post_choice_text ?? ''),
    ...(packageJson.parts ?? []).flatMap((part) =>
      (part.decision?.choices ?? []).map((choice) => choice.resolution_text ?? ''),
    ),
  ].join('\n')

  if (/^#{1,6}\s/m.test(normalizedNarrativeText)) {
    fail(`Story ${storyNumber}: Markdown heading markers leaked into runtime prose`)
  }
  if (normalizedNarrativeText.includes('**')) {
    fail(`Story ${storyNumber}: Markdown bold markers leaked into runtime prose`)
  }
  if (/^---+$/m.test(normalizedNarrativeText)) {
    fail(`Story ${storyNumber}: Markdown horizontal rules leaked into runtime prose`)
  }

  const parts = packageJson.parts ?? []
  if (parts.length !== (map.parts ?? []).length) {
    fail(
      `Story ${storyNumber}: package part count ${parts.length} != map ${map.parts?.length ?? 0}`,
    )
  }

  const expectedBaseline = []
  let packageImageCount = 0

  for (let index = 0; index < (map.parts ?? []).length; index += 1) {
    const mapped = map.parts[index]
    const part = parts[index]
    if (!part) continue

    if (part.part_id !== mapped.part_id) {
      fail(`Story ${storyNumber} part ${index + 1}: part_id drifted`)
    }
    if (part.order !== mapped.order || part.order !== index + 1) {
      fail(`Story ${storyNumber} ${part.part_id}: invalid part order`)
    }
    if (!part.story_text?.trim()) {
      fail(`Story ${storyNumber} ${part.part_id}: story_text is empty`)
    }

    const mappedSlots = new Map(
      (mapped.image_slots ?? []).map((slot) => [slot.slot_id, slot]),
    )
    if ((part.image_slots ?? []).length !== mappedSlots.size) {
      fail(`Story ${storyNumber} ${part.part_id}: image slot count drifted`)
    }

    for (const slot of part.image_slots ?? []) {
      packageImageCount += 1
      const locked = mappedSlots.get(slot.slot_id)
      if (!locked) {
        fail(`Story ${storyNumber}: unknown image slot ${slot.slot_id}`)
        continue
      }
      if (
        slot.asset_id !== locked.asset_id ||
        slot.phase !== locked.phase ||
        slot.after_text !== locked.after_text
      ) {
        fail(`Story ${storyNumber} ${slot.slot_id}: Tier A slot binding drifted`)
      }
      if (slot.status !== 'approved' || slot.runtime_url !== null) {
        fail(`Story ${storyNumber} ${slot.slot_id}: expected approved registry-resolved slot`)
      }
      if (!assetRegistrySource.includes(`'${slot.asset_id}'`)) {
        fail(`Story ${storyNumber} ${slot.slot_id}: hosted asset is absent from authoredStoryAssets.ts`)
      }
      const phaseText =
        slot.phase === 'story_text' ? part.story_text : part.post_choice_text
      const count = paragraphsOf(phaseText).filter(
        (paragraph) => paragraph === slot.after_text,
      ).length
      if (count !== 1) {
        fail(
          `Story ${storyNumber} ${slot.slot_id}: anchor must occur exactly once, got ${count}`,
        )
      }
    }

    const mappedDecision = mapped.decision
    const decision = part.decision
    if (!mappedDecision || !decision) {
      fail(`Story ${storyNumber} ${part.part_id}: exactly one mapped decision is required`)
      continue
    }

    if (
      decision.decision_id !== mappedDecision.decision_id ||
      decision.prompt !== mappedDecision.prompt
    ) {
      fail(`Story ${storyNumber} ${part.part_id}: decision drifted`)
    }
    if (!Array.isArray(decision.choices) || decision.choices.length !== 2) {
      fail(`Story ${storyNumber} ${decision.decision_id}: exactly two choices required`)
      continue
    }

    expectedBaseline.push(mappedDecision.choices[0].choice_id)

    for (let choiceIndex = 0; choiceIndex < 2; choiceIndex += 1) {
      const choice = decision.choices[choiceIndex]
      const lockedChoice = mappedDecision.choices[choiceIndex]
      if (
        choice.choice_id !== lockedChoice.choice_id ||
        choice.text !== lockedChoice.text
      ) {
        fail(
          `Story ${storyNumber} ${decision.decision_id}: choice ${choiceIndex + 1} drifted`,
        )
      }
      if (!choice.resolution_text?.trim()) {
        fail(`Story ${storyNumber} ${choice.choice_id}: resolution_text is empty`)
      }
      if (choice.effect_summary !== choice.text) {
        fail(`Story ${storyNumber} ${choice.choice_id}: staging effect summary must remain verbatim choice text`)
      }
      if (choice.state_patch?.last_event !== choice.text) {
        fail(`Story ${storyNumber} ${choice.choice_id}: last_event must remain verbatim choice text`)
      }
      if (
        choice.state_patch?.canon_updates?.[mappedDecision.memory_key] !==
        lockedChoice.memory_value
      ) {
        fail(`Story ${storyNumber} ${choice.choice_id}: choice memory update drifted`)
      }
      if (choice.illustration !== null) {
        fail(`Story ${storyNumber} ${choice.choice_id}: no Tier A branch illustration is approved`)
      }
    }
  }

  if (
    JSON.stringify(packageJson.baseline_choice_path) !==
    JSON.stringify(expectedBaseline)
  ) {
    fail(`Story ${storyNumber}: baseline choice path drifted`)
  }

  const finalParts = parts.filter((part) => part.is_final)
  if (finalParts.length !== 1 || finalParts[0] !== parts.at(-1)) {
    fail(`Story ${storyNumber}: exactly the last package part must be final`)
  }
  if (!parts.at(-1)?.post_choice_text?.trim()) {
    fail(`Story ${storyNumber}: final common/post-choice text is required`)
  }

  if (packageImageCount !== entry.tier_a_image_count) {
    fail(`Story ${storyNumber}: Tier A image count drifted from inventory`)
  }
  if (
    packageJson.illustration_plan?.shared_asset_count !== packageImageCount ||
    packageJson.illustration_plan?.choice_asset_count !== 0 ||
    packageJson.illustration_plan?.cover_asset_count !== 1 ||
    packageJson.illustration_plan?.planned_asset_count !== packageImageCount + 1
  ) {
    fail(`Story ${storyNumber}: illustration plan counts are inconsistent`)
  }

  if (
    entry.cover_state !== 'shared-season-cover-pending' ||
    entry.localization_state !== 'ru-only-staging' ||
    entry.publication_state !== 'not-published'
  ) {
    fail(`Story ${storyNumber}: release blockers must remain explicit in inventory`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) =>
    console.error(`[season2-staging-packages] ${error}`),
  )
  process.exit(1)
}

console.log('[season2-staging-packages] PASS')
console.log('[season2-staging-packages] 6/6 Russian staging packages are structurally valid')
console.log('[season2-staging-packages] 12 decisions / 24 choices remain aligned to locked authoring maps')
console.log('[season2-staging-packages] 10/10 Tier A image slots resolve through the verified hosted asset registry')
console.log('[season2-staging-packages] packages remain unregistered; one shared Season 2 cover + UZ localization still block publication')
