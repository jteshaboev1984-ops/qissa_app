import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))

const base = readJson(
  'src/data/authored/staging/season2Story1RoyalSilver.ru.json',
)
const overlay = readJson(
  'src/data/authored/staging/season2Story1RoyalSilver.uz.json',
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
  fail(`expected language=uz, got ${overlay.language}`)
}
if (overlay.title !== 'Qirollik kumushi') {
  fail(`unexpected Uzbek title: ${overlay.title}`)
}
if (!Array.isArray(overlay.parts) || overlay.parts.length !== base.parts.length || overlay.parts.length !== 3) {
  fail(`expected 3 localized parts, got ${overlay.parts?.length ?? 0}`)
}

const byId = new Map((overlay.parts ?? []).map((part) => [part.part_id, part]))
let decisionCount = 0
let choiceCount = 0
let anchorCount = 0

for (const basePart of base.parts) {
  const localized = byId.get(basePart.part_id)
  if (!localized) {
    fail(`missing localized part: ${basePart.part_id}`)
    continue
  }
  if (!localized.title?.trim()) fail(`${basePart.part_id}: empty localized title`)
  if (!localized.story_text?.trim()) fail(`${basePart.part_id}: empty localized story_text`)
  if (typeof localized.post_choice_text !== 'string') {
    fail(`${basePart.part_id}: post_choice_text must be a string`)
  }

  const localizedAnchorKeys = Object.keys(localized.image_anchor_texts ?? {})
  if (localizedAnchorKeys.length !== (basePart.image_slots ?? []).length) {
    fail(
      `${basePart.part_id}: expected ${basePart.image_slots?.length ?? 0} localized anchors, got ${localizedAnchorKeys.length}`,
    )
  }

  for (const slot of basePart.image_slots ?? []) {
    anchorCount += 1
    const anchor = localized.image_anchor_texts?.[slot.slot_id]
    if (!anchor?.trim()) {
      fail(`${slot.slot_id}: missing Uzbek image anchor`)
      continue
    }
    const phaseText =
      slot.phase === 'story_text'
        ? localized.story_text
        : localized.post_choice_text
    const occurrences = paragraphsOf(phaseText).filter(
      (paragraph) => paragraph === anchor.trim(),
    ).length
    if (occurrences !== 1) {
      fail(`${slot.slot_id}: Uzbek anchor must occur exactly once, got ${occurrences}`)
    }
  }

  if (!basePart.decision) {
    if (localized.decision !== null) {
      fail(`${basePart.part_id}: unexpected localized decision`)
    }
    continue
  }

  decisionCount += 1
  const decision = localized.decision
  if (!decision || decision.decision_id !== basePart.decision.decision_id) {
    fail(`${basePart.part_id}: missing/mismatched localized decision`)
    continue
  }
  if (!decision.prompt?.trim()) {
    fail(`${decision.decision_id}: empty localized prompt`)
  }
  if (!Array.isArray(decision.choices) || decision.choices.length !== 2) {
    fail(`${decision.decision_id}: expected exactly two localized choices`)
    continue
  }

  const choicesById = new Map(decision.choices.map((choice) => [choice.choice_id, choice]))
  for (const baseChoice of basePart.decision.choices) {
    choiceCount += 1
    const choice = choicesById.get(baseChoice.choice_id)
    if (!choice) {
      fail(`${baseChoice.choice_id}: missing localized choice`)
      continue
    }
    for (const key of ['text', 'effect_summary', 'resolution_text', 'last_event']) {
      if (!choice[key]?.trim()) {
        fail(`${baseChoice.choice_id}: empty localized ${key}`)
      }
    }
    if (choice.illustration_after_text != null) {
      fail(`${baseChoice.choice_id}: unexpected branch-image anchor`)
    }
  }
}

if (decisionCount !== 3) fail(`expected 3 decisions, got ${decisionCount}`)
if (choiceCount !== 6) fail(`expected 6 choices, got ${choiceCount}`)
if (anchorCount !== 2) fail(`expected 2 shared anchors, got ${anchorCount}`)

const corpus = (overlay.parts ?? []).flatMap((part) => [
  part.title,
  part.story_text,
  part.post_choice_text,
  part.decision?.prompt ?? '',
  ...(part.decision?.choices ?? []).flatMap((choice) => [
    choice.text,
    choice.effect_summary,
    choice.resolution_text,
    choice.last_event,
  ]),
]).join('\n\n')

if (/[А-Яа-яЁё]/u.test(corpus)) {
  fail('Uzbek staging overlay contains Cyrillic characters')
}
for (const marker of [
  'Jasorat bayrami',
  'Qirol chavandozi',
  'Daniyar',
  'Kamran',
  'Ordan',
  'Aras',
  'Zaran',
  'Farid',
  'tarmoq',
]) {
  if (!corpus.includes(marker)) {
    fail(`expected Uzbek continuity marker is missing: ${marker}`)
  }
}
for (const marker of [
  'Va Daniyar uni payqaganini tushundi.',
  'Daniyar qolgan soqchi bilan asosiy yo‘l bo‘ylab quvishni davom ettirdi.',
]) {
  if (!corpus.includes(marker)) {
    fail(`locked localized image anchor is missing: ${marker}`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[season2-story1-uz] ${error}`))
  process.exit(1)
}

console.log('[season2-story1-uz] PASS')
console.log('[season2-story1-uz] 3/3 parts, 3 decisions, 6 choices aligned')
console.log('[season2-story1-uz] 2/2 Tier A image anchors validated')
console.log('[season2-story1-uz] Uzbek Latin-script continuity markers validated')
