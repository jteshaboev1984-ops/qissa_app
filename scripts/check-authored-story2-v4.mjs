import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const storyPath = path.join(root, 'src/data/authored/taynaVostochnogoKaravanaV4.ru.json')
const manifestPath = path.join(root, 'docs/qissa/story2/story2_v4_layout_manifest.json')
const seasonsPath = path.join(root, 'src/data/sevenRoadsSeasons.ts')
const appPath = path.join(root, 'src/App.tsx')
const playerPath = path.join(root, 'src/features/authoredStory/AuthoredStoryPlayer.tsx')

const story = JSON.parse(fs.readFileSync(storyPath, 'utf8'))
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const seasonsSource = fs.readFileSync(seasonsPath, 'utf8')
const appSource = fs.readFileSync(appPath, 'utf8')
const playerSource = fs.readFileSync(playerPath, 'utf8')

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
        if (choice.illustration.behavior !== 'show_in_resolution_after_anchor') {
          fail(`${choice.choice_id}: illustration must use show_in_resolution_after_anchor`)
        }
        const anchorCount = paragraphsOf(choice.resolution_text).filter(
          (paragraph) => paragraph === choice.illustration.after_text,
        ).length
        if (anchorCount !== 1) {
          fail(`${choice.choice_id}: branch image anchor must occur exactly once, got ${anchorCount}`)
        }
      }
    }
  }
}

if (sharedSlots.length !== 24) fail(`expected 24 shared scene images, got ${sharedSlots.length}`)
if (choiceArts.length !== 4) fail(`expected 4 selected-branch images, got ${choiceArts.length}`)

const expectedSharedAnchors = new Map([
  ['P1-IMG-01', 'Теперь проходом почти никто не пользовался.'],
  ['P1-IMG-02', 'Знал мастерскую лукодела у ремесленного ряда. Над дверью там висел круглый щит с тремя старыми стрелами, а в дни большого каравана мастер выставлял готовые луки прямо у входа.'],
  ['P2-IMG-01', 'К полудню тихий Арас загудел.'],
  ['P2-IMG-02', 'Молчаливого — Барласом.'],
  ['P3-IMG-01', 'Когда он поднял её, на красной поверхности остался глубокий рисунок.'],
  ['P3-IMG-02', '— Эй!'],
  ['P3-IMG-03', 'Теперь они провели лошадей наружу одну за другой.'],
  ['P4-IMG-01', 'Барлас быстро сравнил жетоны и кивнул.'],
  ['P4-IMG-02', '— Конечно, кусается.'],
  ['P5-IMG-01', 'Капитан поднял маленький отколовшийся кусочек сургуча. На одной стороне виднелись несколько вдавленных линий.'],
  ['P5-IMG-02', 'Тот самый.'],
  ['P6-IMG-01', 'Дальше земля становилась твёрже, и след быстро терялся.'],
  ['P6-IMG-02', '— Эти двое, если верить твоему письму, не отсюда.'],
  ['P7-IMG-01', 'Последним Самира надела широкий пояс Всадника короля и закрепила на нём церемониальную саблю в ножнах.'],
  ['P7-IMG-02', '— А потом кто-то другой вошёл.'],
  ['P7-IMG-03', 'И сразу понял слишком много.'],
  ['P9-IMG-01', 'Капитан сел напротив.'],
  ['P9-IMG-02', 'Темур достал металлическую накладку со знаком разбойников и положил рядом с деревянным жетоном.'],
  ['P9-IMG-03', '— Такой знак был на его воротах.'],
  ['P10-IMG-01', 'Со стороны разговор выглядел обычным.'],
  ['P10-IMG-02', 'С ними был старший стражник капитана. При нём находилось запечатанное письмо для начальника стражи Сарвана.'],
  ['P10-IMG-03', 'Булут пошёл следом.'],
  ['P10-IMG-04', 'Самира покачала головой.'],
  ['P10-IMG-05', 'В это же утро восточный караван уходил дальше с Надиром. Где-то среди обычных путников ехали люди капитана, а впереди уже спешил гонец с предупреждением.'],
])

const expectedChoiceAnchors = new Map([
  ['P6A-IMG-03', 'На воротах ещё сохранился старый знак двора: две узкие башни по сторонам проезда.'],
  ['P6B-IMG-03', '— У Каменного колодца. Они уже стояли возле дороги. Две лошади, несколько связок кожи.'],
  ['P8A-IMG-01', 'Он увидел стражников впереди и резко остановился.'],
  ['P8B-IMG-01', 'Вторая легла дальше по той же стороне, не давая ему снова взять левее.'],
])

for (const slot of sharedSlots) {
  const expected = expectedSharedAnchors.get(slot.slot_id)
  if (!expected) fail(`unexpected shared image slot: ${slot.slot_id}`)
  if (slot.after_text !== expected) {
    fail(`${slot.slot_id}: exact approved anchor drifted`)
  }
}
if (expectedSharedAnchors.size !== sharedSlots.length) {
  fail(`expected ${expectedSharedAnchors.size} locked shared anchors, got ${sharedSlots.length}`)
}

for (const art of choiceArts) {
  const expected = expectedChoiceAnchors.get(art.slot_id)
  if (!expected) fail(`unexpected selected-branch image slot: ${art.slot_id}`)
  if (art.after_text !== expected) {
    fail(`${art.slot_id}: exact approved branch anchor drifted`)
  }
}
if (expectedChoiceAnchors.size !== choiceArts.length) {
  fail(`expected ${expectedChoiceAnchors.size} locked branch anchors, got ${choiceArts.length}`)
}


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


const imageIdsForPhase = (part, phase) => {
  const byAnchor = new Map()
  for (const slot of part.image_slots ?? []) {
    if (slot.phase !== phase) continue
    const existing = byAnchor.get(slot.after_text) ?? []
    existing.push(slot.asset_id)
    byAnchor.set(slot.after_text, existing)
  }

  const ordered = []
  const phaseText = phase === 'story_text' ? part.story_text : part.post_choice_text
  for (const paragraph of paragraphsOf(phaseText)) {
    ordered.push(...(byAnchor.get(paragraph) ?? []))
  }
  return ordered
}

const visibleImageOrderForChoices = (selectedByDecision) => {
  const ordered = []

  for (const part of story.parts) {
    ordered.push(...imageIdsForPhase(part, 'story_text'))

    if (part.decision) {
      const selectedChoiceId = selectedByDecision[part.decision.decision_id]
      const selectedChoice = part.decision.choices.find(
        (choice) => choice.choice_id === selectedChoiceId,
      )
      if (!selectedChoice) {
        fail('missing selected choice for ' + part.decision.decision_id)
      } else if (selectedChoice.illustration) {
        const illustration = selectedChoice.illustration
        if (illustration.behavior !== 'show_in_resolution_after_anchor') {
          fail(selectedChoice.choice_id + ': unexpected choice illustration behavior')
        } else {
          let inserted = false
          for (const paragraph of paragraphsOf(selectedChoice.resolution_text)) {
            if (paragraph === illustration.after_text) {
              ordered.push(illustration.asset_id)
              inserted = true
            }
          }
          if (!inserted) {
            fail(selectedChoice.choice_id + ': selected illustration was not inserted')
          }
        }
      }
    }

    ordered.push(...imageIdsForPhase(part, 'post_choice_text'))
  }

  return ordered
}


const renderedParagraphsForPhase = (part, phase, selectedByDecision) => {
  const phaseText = phase === 'story_text' ? part.story_text : part.post_choice_text
  const segmentsByAnchor = new Map()

  for (const segment of part.conditional_segments ?? []) {
    if (segment.phase !== phase) continue
    if (selectedByDecision[segment.when.decision_id] !== segment.when.choice_id) continue
    const existing = segmentsByAnchor.get(segment.after_text) ?? []
    existing.push(segment)
    segmentsByAnchor.set(segment.after_text, existing)
  }

  const rendered = []
  for (const paragraph of paragraphsOf(phaseText)) {
    rendered.push(paragraph)
    for (const segment of segmentsByAnchor.get(paragraph) ?? []) {
      rendered.push(...paragraphsOf(segment.text))
    }
  }
  return rendered
}

const renderedTextForChoices = (selectedByDecision) => {
  const rendered = []
  for (const part of story.parts) {
    rendered.push(...renderedParagraphsForPhase(part, 'story_text', selectedByDecision))

    if (part.decision) {
      const selectedChoiceId = selectedByDecision[part.decision.decision_id]
      const selectedChoice = part.decision.choices.find(
        (choice) => choice.choice_id === selectedChoiceId,
      )
      if (selectedChoice) {
        rendered.push(...paragraphsOf(selectedChoice.resolution_text))
      }
    }

    rendered.push(...renderedParagraphsForPhase(part, 'post_choice_text', selectedByDecision))
  }
  return rendered
}

const sharedSequencePrefix = [
  'seven_roads_story2_p1_img_01_v1',
  'seven_roads_story2_p1_img_02_v1',
  'seven_roads_story2_p2_img_01_v1',
  'seven_roads_story2_p2_img_02_v1',
  'seven_roads_story2_p3_img_01_v2',
  'seven_roads_story2_p3_img_02_v1',
  'seven_roads_story2_p3_img_03_v1',
  'seven_roads_story2_p4_img_01_v1',
  'seven_roads_story2_p4_img_02_v1',
  'seven_roads_story2_p5_img_01_v1',
  'seven_roads_story2_p5_img_02_v1',
  'seven_roads_story2_p6_img_01_v1',
  'seven_roads_story2_p6_img_02_v1',
]
const sharedSequenceMiddle = [
  'seven_roads_story2_p7_img_01_v1',
  'seven_roads_story2_p7_img_02_v1',
  'seven_roads_story2_p7_img_03_v1',
]
const sharedSequenceTail = [
  'seven_roads_story2_p9_img_01_v1',
  'seven_roads_story2_p9_img_02_v1',
  'seven_roads_story2_p9_img_03_v1',
  'seven_roads_story2_p10_img_01_v1',
  'seven_roads_story2_p10_img_02_v1',
  'seven_roads_story2_p10_img_03_v1',
  'seven_roads_story2_p10_img_04_v1',
  'seven_roads_story2_p10_img_05_v1',
]

const choicePairs = decisions.map((part) => part.decision.choices)
const pathCount = 2 ** choicePairs.length
for (let mask = 0; mask < pathCount; mask += 1) {
  const selectedByDecision = {}
  const selectedIds = []

  decisions.forEach((part, decisionIndex) => {
    const choice = part.decision.choices[(mask >> decisionIndex) & 1]
    selectedByDecision[part.decision.decision_id] = choice.choice_id
    selectedIds.push(choice.choice_id)
  })

  const choice3 = selectedIds.find((id) => id.startsWith('story2_choice_3'))
  const choice4 = selectedIds.find((id) => id.startsWith('story2_choice_4'))
  const choice3Asset =
    choice3 === 'story2_choice_3a_old_sarvan_yard'
      ? 'seven_roads_story2_p6a_img_03_v1'
      : 'seven_roads_story2_p6b_img_03_v1'
  const choice4Asset =
    choice4 === 'story2_choice_4a_guard_shortcut'
      ? 'seven_roads_story2_p8a_img_01_v1'
      : 'seven_roads_story2_p8b_img_01_v1'

  const expectedOrder = [
    ...sharedSequencePrefix,
    choice3Asset,
    ...sharedSequenceMiddle,
    choice4Asset,
    ...sharedSequenceTail,
  ]
  const actualOrder = visibleImageOrderForChoices(selectedByDecision)
  const renderedParagraphs = renderedTextForChoices(selectedByDecision)
  const renderedCorpus = renderedParagraphs.join('\n\n')
  const pathLabel = selectedIds.join(' > ')

  const has3aReunion = renderedCorpus.includes(
    'Перед отъездом я ещё была у старого караванного двора Сарвана,',
  )
  const has3bReunion = renderedCorpus.includes(
    'И ещё я нашла Азима, проводника, который выводил караван из Сарвана,',
  )
  const has3aToken = renderedCorpus.includes('Я видела этот знак вчера на воротах.')
  const has3bToken = renderedCorpus.includes('Да. Я знаю эти ворота.')
  const has3bWellPayoff = renderedCorpus.includes(
    'Азим видел Рашида и Барласа у Каменного колодца.',
  )

  if (choice3 === 'story2_choice_3a_old_sarvan_yard') {
    if (!has3aReunion || !has3aToken) {
      fail('path ' + pathLabel + ': Choice 3A deferred payoff text is incomplete')
    }
    if (has3bReunion || has3bToken || has3bWellPayoff) {
      fail('path ' + pathLabel + ': Choice 3B deferred text leaked into Choice 3A path')
    }
  } else {
    if (!has3bReunion || !has3bToken || !has3bWellPayoff) {
      fail('path ' + pathLabel + ': Choice 3B deferred payoff text is incomplete')
    }
    if (has3aReunion || has3aToken) {
      fail('path ' + pathLabel + ': Choice 3A deferred text leaked into Choice 3B path')
    }
  }

  if (actualOrder.length !== 26) {
    fail(
      'path ' + pathLabel + ': expected 26 visible scene images, got ' + actualOrder.length,
    )
  }
  if (new Set(actualOrder).size !== actualOrder.length) {
    fail('path ' + pathLabel + ': duplicate visible image detected')
  }
  if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
    fail(
      'path ' + pathLabel + ': text/image sequence drifted\n' +
      '  expected: ' + expectedOrder.join(' -> ') + '\n' +
      '  actual:   ' + actualOrder.join(' -> '),
    )
  }

  const forbiddenChoice3Asset =
    choice3Asset === 'seven_roads_story2_p6a_img_03_v1'
      ? 'seven_roads_story2_p6b_img_03_v1'
      : 'seven_roads_story2_p6a_img_03_v1'
  const forbiddenChoice4Asset =
    choice4Asset === 'seven_roads_story2_p8a_img_01_v1'
      ? 'seven_roads_story2_p8b_img_01_v1'
      : 'seven_roads_story2_p8a_img_01_v1'

  if (actualOrder.includes(forbiddenChoice3Asset)) {
    fail('path ' + pathLabel + ': unchosen Choice 3 image leaked into reader')
  }
  if (actualOrder.includes(forbiddenChoice4Asset)) {
    fail('path ' + pathLabel + ': unchosen Choice 4 image leaked into reader')
  }
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
if (!seasonsSource.includes("id: 'seven-roads-season-2-story-2'")) {
  fail('Published Story 2 entry is missing from Season 2')
}
if (!seasonsSource.includes("status: 'published'")) {
  fail('Story 2 release requires published Season 2/story state')
}
if (!seasonsSource.includes("taynaVostochnogoKaravanaV4ByLanguage[language]")) {
  fail('Season 2 must resolve the published Story 2 package by language')
}
if (!seasonsSource.includes("completionScope: 'story'")) {
  fail('Story 2 must retain story-level completion semantics')
}
if (!seasonsSource.includes("readerUnit: 'part'")) {
  fail('Story 2 must retain part-level reader progress')
}
for (const marker of [
  'storyNumber={2}',
  'completionScope="story"',
  'readerUnit="part"',
]) {
  if (!appSource.includes(marker)) {
    fail(`Story 2 preview reader contract is missing: ${marker}`)
  }
}
for (const marker of [
  "completionScope === 'story'",
  "readerUnit === 'part'",
  'formatSevenRoadsStoryCompleted(language, storyNumber)',
  'part.is_final ? finishLabel : copy.continue',
]) {
  if (!playerSource.includes(marker)) {
    fail(`Story 2 story-scope completion contract is missing: ${marker}`)
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[story2-v4] ${error}`))
  process.exit(1)
}

console.log('[story2-v4] PASS')
console.log('[story2-v4] 10 parts · 4 decisions · 16 choice paths')
console.log('[story2-v4] 28 approved scene assets · 24 shared · 4 selected-branch')
console.log('[story2-v4] all 28 scene images are locked to exact approved text anchors')
console.log('[story2-v4] 5 deferred Choice-3 payoff segments')
console.log('[story2-v4] all 16 paths preserve the exact 26-image reader sequence without branch leaks')
console.log('[story2-v4] Choice 3 deferred payoff text is present only on the selected path')
console.log('[story2-v4] critical road-seal canon and app-layout manifest are locked')
console.log('[story2-v4] Season 2 publishes Story 2 as story #2 with RU/UZ package resolution')
console.log('[story2-v4] Story 2 completes as Сказка 2 and uses part-level reader progress, never false season completion')
