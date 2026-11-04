import fs from 'node:fs'
import path from 'node:path'

/**
 * Deterministic reviewer pack for QISSA S2E6/E7.
 * This does NOT synthesize or certify audio. It mirrors the authored narrative
 * engine's paragraph order, inherited Episode 5 branches, and choice pauses.
 *
 * Usage:
 *   node scripts/check-season2-listening-paths.mjs
 *   node scripts/check-season2-listening-paths.mjs --write /tmp/qissa-listening-review
 */
const root = process.cwd()
const outputAt = process.argv.indexOf('--write')
const outDir = outputAt >= 0 ? process.argv[outputAt + 1] : null
if (outputAt >= 0 && !outDir) {
  console.error('--write requires a directory')
  process.exit(2)
}

const read = (name) => JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/authored/staging', name), 'utf8'),
)
const sources = {
  '6-ru': read('season2Story6TwoReinforcements.ru.json'),
  '6-uz': read('season2Story6TwoReinforcements.uz.json'),
  '7-ru': read('season2Story7BackToOrdan.ru.json'),
  '7-uz': read('season2Story7BackToOrdan.uz.json'),
}
const originalSix = sources['6-ru']
const errors = []
const warn = []
const assert = (good, why) => { if (!good) errors.push(why) }
const paragraphs = (text = '') => String(text).split(/\n\n+/).map(s => s.trim()).filter(Boolean)
const words = text => text.trim().split(/\s+/).filter(Boolean).length

const inherited = originalSix.external_choice_context?.[0]
assert(inherited?.decision_id === 'story5_choice_1_road_post_approach', 'Episode 5 inherited decision ID changed')
assert(inherited?.allowed_choice_ids?.length === 2, 'Episode 5 must have two inherited routes')
assert(originalSix.parts.length === 2 && originalSix.parts[0].decision === null, 'Episode 6 should have two parts, one battle choice')
assert(sources['6-uz'].parts[0].decision === null, 'Uzbek roadblock decision was not removed')

function localizedSegments(basePart, localizedPart, language, phase) {
  return (basePart.conditional_segments ?? [])
    .filter(segment => segment.phase === phase)
    .map(segment => {
      const tr = language === 'ru' ? segment : localizedPart.conditional_segment_texts?.[segment.segment_id]
      assert(Boolean(tr), 'Missing localized inherited segment ' + segment.segment_id)
      return { ...segment, after_text: tr?.after_text, text: tr?.text }
    })
}

/** Mirrors buildAuthoredNarrativeBlocks(): append inherited text after its anchor. */
function renderPhase(basePart, localPart, language, phase, selected) {
  const content = paragraphs(localPart[phase])
  const segments = localizedSegments(basePart, localPart, language, phase)
  const rendered = []
  const activated = []
  for (const segment of segments) {
    assert(content.filter(text => text === segment.after_text).length === 1,
      'Expected one anchor for ' + segment.segment_id + ' (' + language + ')')
  }
  for (const text of content) {
    rendered.push(text)
    for (const segment of segments) {
      if (segment.after_text !== text) continue
      if (selected[segment.when.decision_id] !== segment.when.choice_id) continue
      rendered.push(...paragraphs(segment.text))
      activated.push(segment.segment_id)
    }
  }
  return { rendered, activated }
}

const reviewPack = []
const languageNames = { ru: 'Русский', uz: 'O‘zbekcha' }
for (const language of ['ru', 'uz']) {
  const ep6 = sources['6-' + language]
  const ep7 = sources['7-' + language]
  for (const [episode, base, localized, routeList] of [
    [6, originalSix, ep6, inherited.allowed_choice_ids.map((routeId, i) => ({ routeId, routeIndex: i }))],
    [7, sources['7-ru'], ep7, [{ routeId: null, routeIndex: null }]],
  ]) {
    const decisionPart = localized.parts.find(part => part.decision)
    assert(Boolean(decisionPart), 'Missing choice in E' + episode + ' ' + language)
    const choiceCount = decisionPart?.decision?.choices.length ?? 0
    assert(choiceCount === 2, 'E' + episode + ' ' + language + ' must have exactly two choices')
    for (const route of routeList) {
      for (const choiceIndex of [0, 1]) {
        const choice = decisionPart.decision.choices[choiceIndex]
        const selected = route.routeId ? { [inherited.decision_id]: route.routeId } : {}
        const segments = []
        const conditionalActivated = []
        for (let index = 0; index < localized.parts.length; index++) {
          const localPart = localized.parts[index]
          const basePart = base.parts[index]
          const before = renderPhase(basePart, localPart, language, 'story_text', selected)
          conditionalActivated.push(...before.activated)
          segments.push({ type: 'narration', scene: localPart.part_id + ':story_text', paragraphs: before.rendered })
          if (localPart.decision) {
            segments.push({
              type: 'choice_pause',
              scene: localPart.part_id,
              prompt: localPart.decision.prompt,
              options: localPart.decision.choices.map(c => ({ id: c.choice_id, text: c.text })),
              selected_choice_id: choice.choice_id,
            })
            segments.push({
              type: 'narration',
              scene: localPart.part_id + ':choice_resolution',
              paragraphs: paragraphs(choice.resolution_text),
            })
          }
          const after = renderPhase(basePart, localPart, language, 'post_choice_text', selected)
          conditionalActivated.push(...after.activated)
          if (after.rendered.length) {
            segments.push({ type: 'narration', scene: localPart.part_id + ':post_choice_text', paragraphs: after.rendered })
          }
        }

        const narration = segments.filter(segment => segment.type === 'narration')
        const spoken = narration.flatMap(segment => segment.paragraphs)
        const allText = spoken.join('\n\n')
        const pauses = segments.filter(segment => segment.type === 'choice_pause')
        assert(pauses.length === 1, 'Expected one pause E' + episode + ' ' + language)
        assert(spoken.every(text => text.length > 0), 'Empty narration paragraph')
        assert(!allText.includes('undefined') && !allText.includes('[object Object]'), 'Broken narrative output')
        assert(!/^\s*#{1,6}\s/m.test(allText), 'Markdown header leaked into narration')
        assert(!allText.includes('**'), 'Markdown formatting leaked into narration')
        assert(!/[А-Яа-яЁё]/u.test(language === 'uz' ? allText : ''), 'Cyrillic leaked into Uzbek narration')
        const size = words(allText)
        assert(size > (episode === 6 ? 1500 : 900), 'Unexpectedly short narrative E' + episode + ' ' + language)
        const long = spoken.filter(text => words(text) > 75)
        if (long.length) warn.push('E' + episode + ' ' + language + ': ' + long.length + ' paragraph(s) >75 words, check read-aloud pacing')

        if (episode === 6) {
          assert(conditionalActivated.length === 1, 'Episode 6 must realize exactly one inherited Episode 5 payoff')
          const expected = route.routeIndex === 0 ? 'story6_inherited_e5_fast_spare_reins' : 'story6_inherited_e5_plateau_riders'
          assert(conditionalActivated[0] === expected, 'Wrong payoff for Episode 5 route: ' + expected)
          assert(
            language === 'ru' ? allText.includes('Восемь скрылись') : allText.includes('Sakkiztasi'),
            'Episode 6 ending must explain eight escaped'
          )
          assert(
            language === 'ru' ? allText.includes('семерых разбойников') : allText.includes('yetti bosqinchi'),
            'Episode 6 ending must account for seven captured'
          )
          assert(
            language === 'ru' ? allText.includes('Фарид') : allText.includes('Farid'),
            'Episode 6 must use the prisoner guard alias'
          )
          if (choiceIndex === 0) {
            assert(
              language === 'ru' ? allText.includes('— Повозка цела!') : allText.includes('— Arava sog‘!'),
              'E6 tower branch must show the other front succeeded'
            )
          } else {
            assert(
              language === 'ru' ? allText.includes('другие конвойные стражники задержали ещё двух') : allText.includes('boshqa konvoy qo‘riqchilari yana ikki bosqinchini'),
              'E6 wagon branch must account for two other convoy arrests'
            )
          }
        } else {
          assert(allText.includes(language === 'ru' ? '— Камран?' : '— Kamran?'),
            'E7 network must use Kamran, the prisoner true name')
          assert(allText.includes(language === 'ru' ? '— Фарид?' : '— Farid-chi?'),
            'E7 guards must use Farid, the prisoner alias')
          assert(allText.includes(language === 'ru'
            ? '— Им нужен был рисунок настоящей печати!'
            : '— Ularga haqiqiy muhrning rasmi kerak bo‘lgan!'),
          'E7 child-led central detective inference missing')
        }

        const id = 'E' + episode + '_' + language.toUpperCase()
          + (episode === 6 ? '_E5' + (route.routeIndex === 0 ? 'A' : 'B') : '')
          + '_CHOICE' + (choiceIndex === 0 ? 'A' : 'B')
        reviewPack.push({
          id, episode, language, route_from_e5: route.routeId,
          selected_choice: choice.choice_id, word_count: size, paragraph_count: spoken.length,
          inherited_payoffs: conditionalActivated,
          segments,
        })
      }
    }
  }
}

assert(reviewPack.length === 12, 'Expected 12 renderable listener routes, got ' + reviewPack.length)
for (const e of [6, 7]) {
  for (const lang of ['ru', 'uz']) {
    const matches = reviewPack.filter(x => x.episode === e && x.language === lang)
    assert(matches.length === (e === 6 ? 4 : 2), 'Listener path count differs E' + e + ' ' + lang)
  }
}
if (errors.length) {
  for (const error of errors) console.error('[season2-listening-paths] ' + error)
  process.exit(1)
}

if (outDir) {
  const target = path.resolve(root, outDir)
  fs.mkdirSync(target, { recursive: true })
  for (const route of reviewPack) {
    const heading = route.language === 'ru'
      ? 'Сценарий редакторского прослушивания (служебные пометки не озвучивать)'
      : 'Tahririy tinglash ssenariysi (xizmat izohlarini ovoz chiqarib o‘qimang)'
    const lines = [heading, route.id, '']
    for (const segment of route.segments) {
      if (segment.type === 'narration') {
        lines.push(...segment.paragraphs, '')
      } else {
        lines.push('========== [CHOICE PAUSE: FACILITATOR ONLY] ==========')
        lines.push(segment.prompt)
        for (const [index, option] of segment.options.entries()) {
          lines.push((index === 0 ? 'A. ' : 'B. ') + option.text)
        }
        lines.push('Selected path: ' + segment.selected_choice_id)
        lines.push('========== [RESUME NARRATION] ==========', '')
      }
    }
    fs.writeFileSync(path.join(target, route.id + '_review.txt'), lines.join('\n\n'), 'utf8')
  }
  const manifest = reviewPack.map(({ segments, ...rest }) => ({
    ...rest,
    scenes: segments.map(s => s.scene),
  }))
  fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  fs.writeFileSync(path.join(target, 'README.txt'), [
    'QISSA S2 Episodes 6-7 / editorial listening pack',
    '',
    'Contains 12 deterministic paths: E6 two inherited Episode 5 routes x two choices x RU/UZ, E7 two choices x RU/UZ.',
    'These TEXT scripts are NOT audio, and not a verification of TTS, children listening comprehension or native Uzbek literary quality.',
    'For each route, read only narrative paragraphs aloud. At [CHOICE PAUSE], stop and display the two options.',
    'The facilitator chooses the route named in the filename, then continues with its resolution.',
    'Use different participants or separate sessions when comparing outcomes, to avoid revealing alternatives in advance.',
    'Ask after E6: Who was pretending to be a road guard? Why did the children help this group? What happened to the other group? Was Farid freed?',
    'Ask after E7: Why did the old seal differ from Kamol’s fresh one? What did the thieves really want? Why do guards call Kamran Farid?',
    'Record uncertainty and exact confusing words/paragraphs, then edit the authored sources and rerun this script.',
    'Listen controls are NOT provided by the authored episode player at the time of this editorial pack.',
    'The Episode 6 Tier A REVEAL illustration needs scene compatibility review: original image/manifest predates the new combat arrival.',
  ].join('\n') + '\n', 'utf8')
}

const table = reviewPack.map(x => x.id + ': ' + x.word_count + ' words, '
  + x.paragraph_count + ' spoken paragraphs').join('\n')
console.log('[season2-listening-paths] PASS: 12 deterministic reviewer routes')
console.log(table)
for (const warning of warn) console.warn('[season2-listening-paths] WARN: ' + warning)
if (outDir) console.log('[season2-listening-paths] Reviewer pack saved: ' + outDir)
