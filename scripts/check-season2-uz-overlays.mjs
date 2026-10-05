import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))

const cases = [
  {
    story: 1,
    base: 'src/data/authored/staging/season2Story1RoyalSilver.ru.json',
    overlay: 'src/data/authored/staging/season2Story1RoyalSilver.uz.json',
    title: 'Qirollik kumushi',
    markers: [
      'Jasorat bayrami',
      'Qirol chavandozi',
      'Va Daniyar uni payqaganini tushundi.',
    ],
  },
  {
    story: 3,
    base: 'src/data/authored/staging/season2Story3TwoTowers.ru.json',
    overlay: 'src/data/authored/staging/season2Story3TwoTowers.uz.json',
    title: 'Ikki minora',
    markers: [
      'eski karvonsaroy',
      'Uch ustun',
      'Ulardan birining ostida devorga kaftdan sal kattaroq yog‘och eshikcha o‘rnatilgan edi.',
    ],
  },
  {
    story: 4,
    base: 'src/data/authored/staging/season2Story4WaitedMan.ru.json',
    overlay: 'src/data/authored/staging/season2Story4WaitedMan.uz.json',
    title: 'Kutilayotgan odam',
    markers: [
      'Qizil tepalik',
      'eski patrul yo‘li',
      'Yopiq yog‘och kuzovi, mustahkamlangan g‘ildiraklari va ikkita oti bor edi.',
      'Hammasi Arasdan kelgan oddiy yo‘l xabarnomasidek ko‘rinardi.',
    ],
  },
  {
    story: 5,
    base: 'src/data/authored/staging/season2Story5FalseRoad.ru.json',
    overlay: 'src/data/authored/staging/season2Story5FalseRoad.uz.json',
    title: 'Soxta yo‘l',
    markers: [
      'Shimoliy chegara yo‘li',
      'Tosh tizmasi',
      'chap qoshidan chakkasigacha',
      '— Razvedka ularni topdi.',
      'Ular postdan chiqib ketishdi.',
    ],
  },
  {
    story: 6,
    base: 'src/data/authored/staging/season2Story6TwoReinforcements.ru.json',
    overlay: 'src/data/authored/staging/season2Story6TwoReinforcements.uz.json',
    title: 'Ikki yordam guruhi',
    markers: [
      '— Bizni Rustam yubordi.',
      '— Men hech kimni oldindan yubormadim.',
      'Minora yonida allaqachon beshta ot turardi.',
      'Shimoliy chegara yo‘li',
    ],
  },
  {
    story: 7,
    base: 'src/data/authored/staging/season2Story7BackToOrdan.ru.json',
    overlay: 'src/data/authored/staging/season2Story7BackToOrdan.uz.json',
    title: 'Ordanga qaytish',
    markers: [
      'ustaxona tamg‘asi',
      '— Mana. Yangi muhr izida uchi yumaloq. Eskisida esa kichkina tekis qirra bor, xuddi eng cheti kesilgandek.',
      '— Bu yo‘l — endi yo‘q.',
      'Shimoliy chegara yo‘li',
    ],
  },
]

const errors = []
const fail = (message) => errors.push(message)
const paragraphsOf = (text = '') =>
  text.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)

for (const item of cases) {
  const base = readJson(item.base)
  const overlay = readJson(item.overlay)

  if (overlay.story_id !== base.story_id) {
    fail(`Story ${item.story}: story_id mismatch`)
  }
  if (overlay.story_version !== base.story_version) {
    fail(`Story ${item.story}: story_version mismatch`)
  }
  if (overlay.language !== 'uz') {
    fail(`Story ${item.story}: language must be uz`)
  }
  if (overlay.title !== item.title) {
    fail(`Story ${item.story}: unexpected Uzbek title "${overlay.title}"`)
  }
  if (!Array.isArray(overlay.parts) || overlay.parts.length !== base.parts.length) {
    fail(
      `Story ${item.story}: part count mismatch ${overlay.parts?.length ?? 0} != ${base.parts.length}`,
    )
    continue
  }

  const localizedByPart = new Map(
    overlay.parts.map((part) => [part.part_id, part]),
  )

  for (const basePart of base.parts) {
    const localized = localizedByPart.get(basePart.part_id)
    if (!localized) {
      fail(`Story ${item.story}: missing localized part ${basePart.part_id}`)
      continue
    }

    if (!localized.title?.trim()) {
      fail(`Story ${item.story} ${basePart.part_id}: localized title is empty`)
    }
    if (!localized.story_text?.trim()) {
      fail(`Story ${item.story} ${basePart.part_id}: localized story_text is empty`)
    }
    if (typeof localized.post_choice_text !== 'string') {
      fail(`Story ${item.story} ${basePart.part_id}: post_choice_text must be a string`)
    }

    const phaseText = {
      story_text: localized.story_text ?? '',
      post_choice_text: localized.post_choice_text ?? '',
    }

    const baseSlots = basePart.image_slots ?? []
    const localizedAnchorKeys = Object.keys(localized.image_anchor_texts ?? {})
    if (localizedAnchorKeys.length !== baseSlots.length) {
      fail(
        `Story ${item.story} ${basePart.part_id}: shared image anchor count mismatch`,
      )
    }
    for (const slot of baseSlots) {
      const anchor = localized.image_anchor_texts?.[slot.slot_id]
      if (!anchor?.trim()) {
        fail(`Story ${item.story} ${slot.slot_id}: missing Uzbek image anchor`)
        continue
      }
      const count = paragraphsOf(phaseText[slot.phase]).filter(
        (paragraph) => paragraph === anchor.trim(),
      ).length
      if (count !== 1) {
        fail(
          `Story ${item.story} ${slot.slot_id}: localized anchor must occur exactly once, got ${count}`,
        )
      }
    }

    const baseSegments = basePart.conditional_segments ?? []
    const localizedSegments = localized.conditional_segment_texts ?? {}
    if (Object.keys(localizedSegments).length !== baseSegments.length) {
      fail(
        `Story ${item.story} ${basePart.part_id}: conditional segment count mismatch`,
      )
    }
    for (const segment of baseSegments) {
      const localizedSegment = localizedSegments[segment.segment_id]
      if (!localizedSegment?.after_text?.trim() || !localizedSegment?.text?.trim()) {
        fail(
          `Story ${item.story} ${segment.segment_id}: missing localized conditional text/anchor`,
        )
        continue
      }
      const count = paragraphsOf(phaseText[segment.phase]).filter(
        (paragraph) => paragraph === localizedSegment.after_text.trim(),
      ).length
      if (count !== 1) {
        fail(
          `Story ${item.story} ${segment.segment_id}: localized conditional anchor must occur exactly once, got ${count}`,
        )
      }
    }

    if (!basePart.decision) {
      if (localized.decision !== null) {
        fail(`Story ${item.story} ${basePart.part_id}: unexpected localized decision`)
      }
      continue
    }

    const decision = localized.decision
    if (!decision || decision.decision_id !== basePart.decision.decision_id) {
      fail(`Story ${item.story} ${basePart.part_id}: decision id mismatch`)
      continue
    }
    if (!decision.prompt?.trim()) {
      fail(`Story ${item.story} ${decision.decision_id}: empty prompt`)
    }
    if (!Array.isArray(decision.choices) ||
        decision.choices.length !== basePart.decision.choices.length) {
      fail(`Story ${item.story} ${decision.decision_id}: choice count mismatch`)
      continue
    }

    const localizedChoices = new Map(
      decision.choices.map((choice) => [choice.choice_id, choice]),
    )
    for (const baseChoice of basePart.decision.choices) {
      const choice = localizedChoices.get(baseChoice.choice_id)
      if (!choice) {
        fail(`Story ${item.story} ${baseChoice.choice_id}: localized choice missing`)
        continue
      }
      for (const key of ['text', 'effect_summary', 'resolution_text', 'last_event']) {
        if (!choice[key]?.trim()) {
          fail(`Story ${item.story} ${baseChoice.choice_id}: localized ${key} is empty`)
        }
      }
      if (baseChoice.illustration?.behavior === 'show_in_resolution_after_anchor') {
        const anchor = choice.illustration_after_text
        if (!anchor?.trim()) {
          fail(`Story ${item.story} ${baseChoice.choice_id}: missing branch-image anchor`)
        } else {
          const count = paragraphsOf(choice.resolution_text).filter(
            (paragraph) => paragraph === anchor.trim(),
          ).length
          if (count !== 1) {
            fail(
              `Story ${item.story} ${baseChoice.choice_id}: branch-image anchor must occur exactly once`,
            )
          }
        }
      } else if (choice.illustration_after_text != null) {
        fail(
          `Story ${item.story} ${baseChoice.choice_id}: unexpected branch-image anchor`,
        )
      }
    }
  }

  const corpus = overlay.parts.flatMap((part) => [
    part.title ?? '',
    part.story_text ?? '',
    part.post_choice_text ?? '',
    ...Object.values(part.conditional_segment_texts ?? {}).flatMap((segment) => [
      segment.after_text ?? '',
      segment.text ?? '',
    ]),
    part.decision?.prompt ?? '',
    ...(part.decision?.choices ?? []).flatMap((choice) => [
      choice.text ?? '',
      choice.effect_summary ?? '',
      choice.resolution_text ?? '',
      choice.last_event ?? '',
      choice.illustration_after_text ?? '',
    ]),
  ]).join('\n\n')

  if (/[А-Яа-яЁё]/u.test(corpus)) {
    fail(`Story ${item.story}: Cyrillic characters leaked into Uzbek localization`)
  }
  if (/^#{1,6}\s/m.test(corpus) || corpus.includes('**') || /^---+$/m.test(corpus)) {
    fail(`Story ${item.story}: Markdown presentation markers leaked into Uzbek localization`)
  }
  for (const marker of item.markers) {
    if (!corpus.includes(marker)) {
      fail(`Story ${item.story}: critical Uzbek marker missing: ${marker}`)
    }
  }
}

const story4 = readJson(cases.find((item) => item.story === 4).overlay)
const story4Corpus = story4.parts
  .flatMap((part) => [part.story_text, part.post_choice_text])
  .join('\n\n')
if (/to‘rtta\s+ot/i.test(story4Corpus) || /ikki\s+juft\s+ot/i.test(story4Corpus)) {
  fail('Story 4: prison wagon must not regress to four horses / two pairs')
}

const story3 = readJson(cases.find((item) => item.story === 3).overlay)
const story3Corpus = story3.parts
  .flatMap((part) => [part.story_text, part.post_choice_text])
  .join('\n\n')
for (const editorialLabel of [
  'Agar Samira oldin eski',
  'Agar Samira Azim',
  'Agar oldin Samira',
]) {
  if (story3Corpus.includes(editorialLabel)) {
    fail('Story 3: inherited-choice editorial branch label leaked into visible Uzbek prose')
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[season2-uz-overlays] ${error}`))
  process.exit(1)
}

console.log('[season2-uz-overlays] PASS')
console.log('[season2-uz-overlays] Episodes 1, 3, 4, 5, 6, 7 overlays align with their Russian runtime packages')
console.log('[season2-uz-overlays] localized image anchors + conditional segments + choices validated')
console.log('[season2-uz-overlays] Latin-script and critical Season 2 canon markers validated')
console.log('[season2-uz-overlays] Story 3 inherited Episode 2 branch labels stay hidden; Story 4 prison wagon remains exactly two horses')
