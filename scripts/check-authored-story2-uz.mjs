import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const base = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/data/authored/taynaVostochnogoKaravanaV4.ru.json'),
    'utf8',
  ),
)
const overlay = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/data/authored/taynaVostochnogoKaravanaV4.uz.json'),
    'utf8',
  ),
)

const errors = []
const fail = (message) => errors.push(message)
const paragraphsOf = (text = '') =>
  text.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)

if (overlay.story_id !== base.story_id) {
  fail(`story_id mismatch: ${overlay.story_id} != ${base.story_id}`)
}
if (overlay.story_version !== base.story_version) {
  fail(`story_version mismatch: ${overlay.story_version} != ${base.story_version}`)
}
if (overlay.language !== 'uz') {
  fail(`expected Uzbek localization language=uz, got ${overlay.language}`)
}
if (overlay.title !== 'Sharqiy karvon siri') {
  fail(`unexpected Uzbek title: ${overlay.title}`)
}
if (overlay.parts.length !== base.parts.length || overlay.parts.length !== 10) {
  fail(`expected 10 localized parts, got ${overlay.parts.length}`)
}

const localizedById = new Map(overlay.parts.map((part) => [part.part_id, part]))
const baseDecisionIds = new Set()
let sharedAnchorCount = 0
let choiceAnchorCount = 0
let conditionalCount = 0

for (const basePart of base.parts) {
  const localized = localizedById.get(basePart.part_id)
  if (!localized) {
    fail(`missing localized part: ${basePart.part_id}`)
    continue
  }

  if (!localized.title?.trim()) fail(`${basePart.part_id}: localized title is empty`)
  if (!localized.story_text?.trim()) fail(`${basePart.part_id}: localized story_text is empty`)

  const phaseText = {
    story_text: localized.story_text,
    post_choice_text: localized.post_choice_text ?? '',
  }

  const baseSlots = basePart.image_slots ?? []
  const localizedAnchorKeys = Object.keys(localized.image_anchor_texts ?? {})
  if (localizedAnchorKeys.length !== baseSlots.length) {
    fail(
      `${basePart.part_id}: expected ${baseSlots.length} localized shared anchors, got ${localizedAnchorKeys.length}`,
    )
  }

  for (const slot of baseSlots) {
    sharedAnchorCount += 1
    const anchor = localized.image_anchor_texts?.[slot.slot_id]
    if (!anchor?.trim()) {
      fail(`${slot.slot_id}: missing Uzbek image anchor`)
      continue
    }
    const count = paragraphsOf(phaseText[slot.phase]).filter(
      (paragraph) => paragraph === anchor.trim(),
    ).length
    if (count !== 1) {
      fail(`${slot.slot_id}: Uzbek image anchor must occur exactly once, got ${count}`)
    }
  }

  const baseSegments = basePart.conditional_segments ?? []
  const localizedSegments = localized.conditional_segment_texts ?? {}
  if (Object.keys(localizedSegments).length !== baseSegments.length) {
    fail(
      `${basePart.part_id}: expected ${baseSegments.length} localized conditional segments, got ${Object.keys(localizedSegments).length}`,
    )
  }

  for (const segment of baseSegments) {
    conditionalCount += 1
    const localizedSegment = localizedSegments[segment.segment_id]
    if (!localizedSegment?.text?.trim() || !localizedSegment.after_text?.trim()) {
      fail(`${segment.segment_id}: missing Uzbek conditional segment text/anchor`)
      continue
    }
    const count = paragraphsOf(phaseText[segment.phase]).filter(
      (paragraph) => paragraph === localizedSegment.after_text.trim(),
    ).length
    if (count !== 1) {
      fail(
        `${segment.segment_id}: Uzbek conditional anchor must occur exactly once, got ${count}`,
      )
    }
  }

  if (!basePart.decision) {
    if (localized.decision !== null) {
      fail(`${basePart.part_id}: unexpected localized decision`)
    }
    continue
  }

  baseDecisionIds.add(basePart.decision.decision_id)
  const localizedDecision = localized.decision
  if (!localizedDecision || localizedDecision.decision_id !== basePart.decision.decision_id) {
    fail(`${basePart.part_id}: missing/mismatched localized decision`)
    continue
  }
  if (!localizedDecision.prompt?.trim()) {
    fail(`${basePart.decision.decision_id}: localized prompt is empty`)
  }

  const localizedChoices = new Map(
    localizedDecision.choices.map((choice) => [choice.choice_id, choice]),
  )
  if (localizedChoices.size !== basePart.decision.choices.length) {
    fail(
      `${basePart.decision.decision_id}: localized choice count mismatch`,
    )
  }

  for (const baseChoice of basePart.decision.choices) {
    const localizedChoice = localizedChoices.get(baseChoice.choice_id)
    if (!localizedChoice) {
      fail(`${baseChoice.choice_id}: missing localized choice`)
      continue
    }
    for (const key of ['text', 'effect_summary', 'resolution_text', 'last_event']) {
      if (!localizedChoice[key]?.trim()) {
        fail(`${baseChoice.choice_id}: localized ${key} is empty`)
      }
    }

    if (baseChoice.illustration?.behavior === 'show_in_resolution_after_anchor') {
      choiceAnchorCount += 1
      const anchor = localizedChoice.illustration_after_text
      if (!anchor?.trim()) {
        fail(`${baseChoice.choice_id}: missing localized branch-image anchor`)
      } else {
        const count = paragraphsOf(localizedChoice.resolution_text).filter(
          (paragraph) => paragraph === anchor.trim(),
        ).length
        if (count !== 1) {
          fail(
            `${baseChoice.choice_id}: branch-image anchor must occur exactly once, got ${count}`,
          )
        }
      }
    } else if (localizedChoice.illustration_after_text != null) {
      fail(`${baseChoice.choice_id}: unexpected branch-image anchor`)
    }
  }
}

if (sharedAnchorCount !== 24) {
  fail(`expected 24 shared Uzbek image anchors, got ${sharedAnchorCount}`)
}
if (choiceAnchorCount !== 4) {
  fail(`expected 4 localized branch-image anchors, got ${choiceAnchorCount}`)
}
if (conditionalCount !== 5) {
  fail(`expected 5 localized deferred segments, got ${conditionalCount}`)
}
if (baseDecisionIds.size !== 4) {
  fail(`expected 4 base decisions, got ${baseDecisionIds.size}`)
}

const corpus = overlay.parts.flatMap((part) => [
  part.story_text,
  part.post_choice_text,
  ...Object.values(part.conditional_segment_texts ?? {}).map((segment) => segment.text),
  ...(part.decision?.choices ?? []).flatMap((choice) => [
    choice.text,
    choice.effect_summary,
    choice.resolution_text,
    choice.last_event,
  ]),
]).join('\n\n')

for (const forbidden of ['Kamol', 'Rahim']) {
  if (corpus.includes(forbidden)) {
    fail(`non-V4 invented guard name leaked into Uzbek localization: ${forbidden}`)
  }
}

for (const marker of [
  'Endi bu o‘tish joyidan deyarli hech kim foydalanmasdi.',
  'Arasning yo‘l muhri ham joyida turardi.',
  'Barlas muhrni tezda shkafga qaytarib, iz tushirilgan qutichani yashirdi.',
  'Yo‘l muhri yo‘q edi.',
  'Xuddi shu tongda sharqiy karvon Nadir bilan birga yo‘lni davom ettirardi.',
  'Sarvandagi eski karvonsaroy tomon.',
]) {
  if (!corpus.includes(marker)) {
    fail(`critical V4 canon is missing in Uzbek localization: ${marker}`)
  }
}

for (const marker of [
  'Endi bu o‘tish joyidan deyarli hech kim foydalanmasdi.',
  'Sardor qizil muhr mumining sinib tushgan kichik parchasini ko‘tardi.',
  '— Keyin boshqa birov kirgan.',
  'Va birdan juda ko‘p narsani tushundi.',
  'Tashqaridan qaraganda, bu oddiy suhbat edi.',
]) {
  if (!corpus.includes(marker)) {
    fail(`locked Uzbek narrative/image sequence marker is missing: ${marker}`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[story2-uz] ${error}`))
  process.exit(1)
}

console.log('[story2-uz] PASS')
console.log('[story2-uz] 10/10 parts align with Story 2 V4')
console.log('[story2-uz] 24 shared + 4 branch image anchors validated')
console.log('[story2-uz] 5 deferred Choice-3 segments validated')
console.log('[story2-uz] V4 road-seal canon restored/preserved')
console.log('[story2-uz] non-V4 guard names Kamol/Rahim are absent')
