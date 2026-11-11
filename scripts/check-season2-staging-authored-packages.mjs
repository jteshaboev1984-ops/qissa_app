import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// GitHub Actions must independently hash the uploaded public Story 3 WebPs.
// Keep local literary/anchor validation offline-capable.
if (process.env.GITHUB_ACTIONS === 'true') {
  await import('./verify-season2-story3-approved-webps.mjs')
  await import('./verify-season2-story3-yard-webp.mjs')
  await import('./verify-season2-story1-kamran-webp.mjs')
  await import('./verify-season2-story1-settlement-story5-fork-webps.mjs')
  await import('./verify-season2-story3-sarvan-family-webp.mjs')
}

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
if (inventory.status !== 'ru-uz-episode-packages-built-shared-season-cover-hosted-verified') {
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
    packageJson.cover_illustration?.status !== 'hosted_verified' ||
    packageJson.cover_illustration?.asset_id !== 'seven_roads_season2_cover_v1'
  ) {
    fail(`Story ${storyNumber}: episode package must use the approved shared Season 2 cover gate`)
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

    const revisedStory6Art = storyNumber === 6 &&
      map.current_editorial_revision?.runtime_art_expansion === 'hosted-verified-2026-11-05'
    const mappedSlots = new Map(
      (mapped.image_slots ?? []).map((slot) => [slot.slot_id, slot]),
    )
    if (revisedStory6Art) {
      if (index === 0) {
        mappedSlots.set('S2-ST6-BYPASS-SHARED', {
          slot_id: 'S2-ST6-BYPASS-SHARED',
          asset_id: 'seven_roads_s2_story6_roadblock_bypass_01_APPROVED',
          phase: 'story_text',
          after_text: '— Нашёл!',
        })
      } else {
        const reveal = mappedSlots.get('S2-ST6-TIERA-REVEAL')
        if (reveal) {
          mappedSlots.set('S2-ST6-TIERA-REVEAL', {
            ...reveal,
            asset_id: 'seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED',
          })
        }
      }
    }
    // S2E1 new owner-approved rescue frame augments the immutable Tier A source
    // map; require independent public WebP verification and exact text anchor.
    if (storyNumber === 1 && index === 1) {
      const proof = readJson(
        'docs/qissa/season2/story1_kamran_rescue_approved_2026-11-10.json',
      )
      const asset = proof.slot
      if (
        proof.owner_status !== 'APPROVED' ||
        proof.publication_state !== 'unpublished' ||
        proof.storage?.bucket !== 'story-images' ||
        proof.remote_integrity_proof?.status !== 'success' ||
        proof.remote_integrity_proof?.actual_sha256 !== proof.approved_webp?.sha256 ||
        proof.approved_webp?.bytes !== 363060 ||
        asset?.slot_id !== 'S2-ST1-KAMRAN-RESCUE' ||
        asset?.part_id !== part.part_id ||
        asset?.kind !== 'shared' ||
        asset?.phase !== 'story_text'
      ) {
        fail('Story 1: Kamran rescue requires owner approval, hosted SHA and exact shared anchor')
      } else {
        mappedSlots.set(asset.slot_id, {
          slot_id: asset.slot_id,
          asset_id: asset.asset_id,
          phase: asset.phase,
          after_text: asset.after_text_ru,
        })
      }
    }
    // S2E3 old Sarvan courtyard: newly owner-approved and remotely SHA-verified.
    // The immutable original Tier A map continues to describe the original niche.
    if (storyNumber === 3 && index === 0) {
      const yard = readJson(
        'docs/qissa/season2/story3_sarvan_yard_approved_2026-11-10.json',
      )
      const asset = yard.asset
      if (
        yard.owner_decision !== 'approved_corrected_empty_stalls' ||
        yard.status !== 'owner_approved_supabase_sha_verified' ||
        yard.publication_state !== 'unpublished' ||
        yard.remote_integrity_proof?.status !== 'success' ||
        yard.remote_integrity_proof?.actual_sha256 !== asset?.webp?.sha256 ||
        asset?.slot_id !== 'S2-ST3-SARVAN-YARD' ||
        asset?.part_id !== part.part_id ||
        asset?.phase !== 'story_text' ||
        asset?.hosting !== 'hosted_verified'
      ) {
        fail('Story 3: final courtyard art requires owner approval, verified remote SHA and exact shared slot')
      } else {
        mappedSlots.set(asset.slot_id, {
          slot_id: asset.slot_id,
          asset_id: asset.asset_id,
          phase: asset.phase,
          after_text: asset.after_text_ru,
        })
      }
    }
    // Additional S2E3 Sarvan FAMILY arrival: independent remote WebP GET/SHA
    // and the owner-approved bilingual paragraph, without editing historical maps.
    if (storyNumber === 3 && index === 0) {
      const family = readJson(
        'docs/qissa/season2/story3_sarvan_family_return_approved_2026-11-11.json',
      )
      const asset = family.asset
      if (
        family.status !== 'owner_approved_supabase_sha_verified' ||
        family.owner_decision !== 'approved_after_visual_and_literary_check' ||
        family.publication_state !== 'unpublished' ||
        family.remote_integrity_proof?.status !== 'success' ||
        family.remote_integrity_proof?.actual_sha256 !== asset?.webp?.sha256 ||
        family.remote_integrity_proof?.actual_bytes !== asset?.webp?.bytes ||
        family.integrated_ru_blob_sha !== entry.github_blob_sha ||
        asset?.slot_id !== 'S2-ST3-SARVAN-FAMILY-RETURN' ||
        asset?.part_id !== part.part_id ||
        asset?.phase !== 'story_text' ||
        asset?.kind !== 'shared' ||
        asset?.hosting !== 'hosted_verified'
      ) {
        fail('Story 3: Sarvan family arrival requires owner approval and verified independent remote SHA')
      } else {
        mappedSlots.set(asset.slot_id, {
          slot_id: asset.slot_id,
          asset_id: asset.asset_id,
          phase: asset.phase,
          after_text: asset.after_text_ru,
        })
      }
    }
    // Story 3: two separately owner-approved, already uploaded shared frames
    // supplement the immutable original Tier A source map. The draft
    // caravan-yard frame is deliberately excluded until owner approval.
    if (storyNumber === 3 && (index === 1 || index === 2)) {
      const expansion = readJson(
        'docs/qissa/season2/story3_approved_illustrations_2026-11-09.json',
      )
      if (
        expansion.approval !== 'owner_approved_market_and_guardhouse_only' ||
        expansion.bucket !== 'story-images' ||
        expansion.prefix !== 'seven-roads/season2_tier_a_v2/' ||
        !['storage_metadata_confirmed_sha_pending', 'sha_verified'].includes(expansion.remote_state) ||
        expansion.assets?.length !== 2
      ) {
        fail('Story 3: approved shared image expansion manifest invalid')
      } else {
        for (const asset of expansion.assets.filter(
          (asset) => asset.part_id === part.part_id,
        )) {
          mappedSlots.set(asset.slot_id, {
            slot_id: asset.slot_id,
            asset_id: asset.asset_id,
            phase: asset.phase,
            after_text: asset.after_text_ru,
          })
        }
      }
    }
    // Story 4: the two additional hosted/owner-approved frames augment
    // the original locked Tier A map, as in the Episode 7 expansion.
    if (storyNumber === 4 && index === 0) {
      const expansion = readJson(
        'docs/qissa/season2/story4_approved_illustrations_pending_runtime_2026-11-05.json',
      )
      if (expansion.hosting !== 'hosted_verified' ||
          expansion.runtime_binding !== 'hosted_registry_resolved' ||
          expansion.supabase_prefix !== 'seven-roads/season2_tier_a_v2/' ||
          expansion.assets?.length !== 2) {
        fail('Story 4: two new shared images are not verified and registered')
      } else {
        for (const asset of expansion.assets) {
          mappedSlots.set(asset.slot_id, {
            slot_id: asset.slot_id,
            asset_id: asset.asset_id,
            phase: 'story_text',
            after_text: asset.after_text_ru,
          })
        }
      }
    }
    // Story 4 Part 2: the owner-approved and independently hashed final
    // wagon and Nadir frames supplement the original immutable source map.
    if (storyNumber === 4 && index === 1) {
      const finalArt = readJson(
        'docs/qissa/season2/story4_remaining_two_approved_art_2026-11-06.json',
      )
      if (finalArt.hosting !== 'hosted_verified' ||
          finalArt.runtime_binding !== 'hosted_registry_resolved' ||
          finalArt.file_integrity_proof?.status !== 'success' ||
          finalArt.supabase_prefix !== 'seven-roads/season2_tier_a_v2/' ||
          finalArt.additional_shared_assets?.length !== 2) {
        fail('Story 4 Part 2: remaining two approved frames not independently verified')
      } else {
        for (const asset of finalArt.additional_shared_assets) {
          mappedSlots.set(asset.slot_id, {
            slot_id: asset.slot_id,
            asset_id: asset.asset_id,
            phase: 'story_text',
            after_text: asset.after_text_ru,
          })
        }
      }
    }
    // Story 7: two newly verified shared illustrations are maintained outside
    // the immutable original Tier A map, following the Episode 6 expansion model.
    if (storyNumber === 7) {
      const expansion = readJson(
        'docs/qissa/season2/story7_approved_illustrations_pending_runtime_2026-11-05.json',
      )
      if (expansion.hosting !== 'hosted_verified' ||
          expansion.runtime_binding !== 'hosted_registry_resolved' ||
          expansion.supabase_prefix !== 'seven-roads/season2_tier_a_v2/' ||
          expansion.assets?.length !== 2) {
        fail('Story 7: approved new illustrations are not verified and ready')
      } else {
        for (const asset of expansion.assets) {
          mappedSlots.set(asset.slot_id, {
            slot_id: asset.slot_id,
            asset_id: asset.asset_id,
            phase: 'story_text',
            after_text: asset.after_text_ru,
          })
        }
      }
    }
    // Two owner-approved, independently byte-verified 2026-11-11 art slots.
    // Extend the locked historical Tier A map, never rewrite it.
    if ((storyNumber === 1 && index === 2) ||
        (storyNumber === 5 && index === 0)) {
      const latest = readJson(
        'docs/qissa/season2/story1_settlement_story5_fork_approved_2026-11-11.json',
      )
      const asset = latest.assets?.find((item) => item.story_number === storyNumber)
      if (
        latest.owner_status !== 'APPROVED' ||
        latest.publication_state !== 'unpublished' ||
        latest.remote_integrity_proof?.status !== 'success' ||
        latest.storage?.bucket !== 'story-images' ||
        asset?.slot?.part_id !== part.part_id ||
        asset?.slot?.kind !== 'shared' ||
        asset?.slot?.phase !== (storyNumber === 1 ? 'post_choice_text' : 'story_text') ||
        asset?.verified_remote_sha256 !== asset?.approved_webp?.sha256 ||
        asset?.verified_size !== asset?.approved_webp?.bytes ||
        asset?.integrated_ru_blob_sha !== entry.github_blob_sha ||
        asset?.verified_mime !== 'image/webp'
      ) {
        fail(`Story ${storyNumber}: owner-approved 11-Nov scene remote integrity and exact slot contract invalid`)
      } else {
        mappedSlots.set(asset.slot.slot_id, {
          slot_id: asset.slot.slot_id,
          asset_id: asset.slot.asset_id,
          phase: asset.slot.phase,
          after_text: asset.slot.after_text_ru,
        })
      }
    }
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
    const revisedStory6 = storyNumber === 6 && map.current_editorial_revision?.decision_count === 1
    if (revisedStory6) {
      if (index === 0) {
        if (decision !== null) fail('Story 6: roadblock choice must be removed')
        continue
      }
      if (
        decision?.decision_id !== 'story6_choice_2_child_task' ||
        decision?.choices?.length !== 2 ||
        !decision.prompt?.trim()
      ) {
        fail('Story 6: revised battle decision must have exactly two choices')
        continue
      }
      expectedBaseline.push(mappedDecision.choices[0].choice_id)
      for (let i = 0; i < 2; i += 1) {
        const choice = decision.choices[i]
        const legacyChoice = mappedDecision.choices[i]
        if (choice.choice_id !== legacyChoice.choice_id) {
          fail('Story 6: persisted battle choice ID drifted')
        }
        if (
          !choice.text?.trim() || !choice.resolution_text?.trim() ||
          choice.effect_summary !== choice.text ||
          choice.state_patch?.last_event !== choice.text ||
          choice.state_patch?.canon_updates?.tower_child_task !== ['rustam', 'wagon'][i] ||
          !choice.illustration ||
          choice.illustration.asset_id !== [
            'seven_roads_s2_story6_choice_a_gate_flank_01_APPROVED',
            'seven_roads_s2_story6_choice_b_wagon_door_01_APPROVED',
          ][i] ||
          choice.illustration.slot_id !== ['S2-ST6-CHOICE-A-GATE', 'S2-ST6-CHOICE-B-WAGON-DEFENSE'][i] ||
          choice.illustration.behavior !== 'show_in_resolution_after_anchor' ||
          choice.illustration.after_text !== [
            'Рахим связал обезоруженного мужчину.',
            'Он задержал преступника.',
          ][i]
        ) {
          fail('Story 6: revised battle choice content, illustration or state patch drifted')
        }
      }
      continue
    }
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
    packageJson.illustration_plan?.choice_asset_count !== (
      storyNumber === 6 && map.current_editorial_revision?.runtime_art_expansion
        ? 2 : 0
    ) ||
    packageJson.illustration_plan?.cover_asset_count !== 1 ||
    packageJson.illustration_plan?.planned_asset_count !== packageImageCount + 1 + (
      storyNumber === 6 && map.current_editorial_revision?.runtime_art_expansion
        ? 2 : 0
    )
  ) {
    fail(`Story ${storyNumber}: illustration plan counts are inconsistent`)
  }

  const expectedLocalizationState = 'ru+uz-staging'
  if (
    entry.cover_state !== 'shared-season-cover-hosted-verified' ||
    entry.localization_state !== expectedLocalizationState ||
    entry.publication_state !== 'not-published'
  ) {
    fail(`Story ${storyNumber}: release staging state drifted in inventory`)
  }
  const expectedUzOverlay = new Map([
    [1, 'src/data/authored/staging/season2Story1RoyalSilver.uz.json'],
    [3, 'src/data/authored/staging/season2Story3TwoTowers.uz.json'],
    [4, 'src/data/authored/staging/season2Story4WaitedMan.uz.json'],
    [5, 'src/data/authored/staging/season2Story5FalseRoad.uz.json'],
    [6, 'src/data/authored/staging/season2Story6TwoReinforcements.uz.json'],
    [7, 'src/data/authored/staging/season2Story7BackToOrdan.uz.json'],
  ]).get(storyNumber)
  if (entry.uz_overlay_path !== expectedUzOverlay) {
    fail(`Story ${storyNumber}: Uzbek overlay path missing/drifted in staging inventory`)
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
console.log('[season2-staging-packages] revised Story 6 has one battle choice; historic extraction maps remain archived, while all other episode choices match locked source maps')
console.log('[season2-staging-packages] locked Tier A plus verified Episode 4, 6 and 7 expansions (including E4 Part 2) resolve through hosted asset registry')
console.log('[season2-staging-packages] all six non-live episodes have RU+UZ staging and are wired in the validated release candidate')

// Validate the additional bilingual S2E3 slots, gallery and immutable IDs.
await import('./check-season2-story3-approved-art.mjs')
await import('./check-season2-story1-kamran-art.mjs')
await import('./check-season2-2026-11-11-approved-art.mjs')
await import('./check-season2-costume-continuity.mjs')
