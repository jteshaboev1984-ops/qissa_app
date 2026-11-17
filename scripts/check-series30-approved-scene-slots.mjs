import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Check the actual TypeScript runtime overlay and the real reader split adapter.
// The authored literary packages and historical RU blob hashes stay immutable.
const transpileExports = (file, globals = {}) => {
  const source = fs.readFileSync(file, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  })
  const errors = (compiled.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error)
  assert.equal(errors.length, 0, file + ': TypeScript errors')
  const exports = {}
  vm.runInNewContext(compiled.outputText, { exports, console, ...globals }, { filename: file })
  return exports
}

const { series30ApprovedScenes, withSeries30ApprovedSceneSlots } =
  transpileExports('src/data/series30ApprovedSceneSlots.ts')
const { withReadingSeries } = transpileExports('src/data/sevenRoadsReadingSeries.ts')
assert.equal(series30ApprovedScenes.length, 26)
assert.equal(typeof withSeries30ApprovedSceneSlots, 'function')
assert.equal(typeof withReadingSeries, 'function')

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const pars = (text) => text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
const assetsSource = fs.readFileSync('src/data/authoredStoryAssets.ts', 'utf8')
const queue = read('docs/qissa/illustrations/series30/ART_QUEUE_2026-11-14.json')

const galleryStore = new Map()
const fakeLocalStorage = {
  getItem: (key) => galleryStore.get(key) ?? null,
  setItem: (key, value) => { galleryStore.set(key, String(value)) },
  removeItem: (key) => { galleryStore.delete(key) },
  get length() { return galleryStore.size },
  key: (index) => [...galleryStore.keys()][index] ?? null,
}
const { authoredIllustrationDiscovery } = transpileExports(
  'src/lib/authoredIllustrationDiscovery.ts',
  { window: { localStorage: fakeLocalStorage } },
)

const fixtures = [
  {
    base: 'src/data/authored/staging/season2Story5FalseRoad',
    key: 'falseRoad',
    expected: { 'SERIES30-S4E5-A01': 1, 'SERIES30-S4E5-A02': 1, 'SERIES30-S4E6-A01': 2 },
  },
  {
    base: 'src/data/authored/staging/season2Story1RoyalSilver',
    key: 'silver',
    expected: {
      'SERIES30-S2E1-A01': 1,
      'SERIES30-S2E1-A02': 1,
      'SERIES30-S2E2-A01': 2,
      'SERIES30-S2E3-A01': 3,
      'SERIES30-S2E3-A02': 3,
      'SERIES30-S2E3-A03': 3,
      'SERIES30-S2E4-A01': 4,
      'SERIES30-S2E4-A02': 4,
    },
  },
  {
    base: 'src/data/authored/taynaVostochnogoKaravanaV4',
    key: 'caravan',
    expected: { 'SERIES30-S3E3-A01': 3, 'SERIES30-S3E3-A02': 3, 'SERIES30-S3E6-A01': 6 },
  },
  {
    base: 'src/data/authored/staging/season2Story3TwoTowers',
    key: 'towers',
    expected: { 'SERIES30-S3E10-A01': 2, 'SERIES30-S3E10-A02': 2, 'SERIES30-S3E11-A01': 3, 'SERIES30-S3E11-A02': 3 },
  },
  {
    base: 'src/data/authored/staging/season2Story4WaitedMan',
    key: 'waited',
    expected: { 'SERIES30-S4E1-A01': 1, 'SERIES30-S4E2-A01': 2, 'SERIES30-S4E2-A02': 2, 'SERIES30-S4E2-A03': 2, 'SERIES30-S4E3-A01': 3, 'SERIES30-S4E4-A01': 4, 'SERIES30-S4E4-A02': 4 },
  },
  {
    base: 'src/data/authored/staging/season2Story7BackToOrdan',
    key: 'ordan',
    expected: { 'SERIES30-S4E9-A01': 1 },
  },
]

const localize = (base, overlay) => {
  assert.equal(base.story_id, overlay.story_id)
  assert.equal(base.story_version, overlay.story_version)
  return {
    ...base,
    language: 'uz',
    title: overlay.title,
    parts: base.parts.map((part, index) => {
      const localized = overlay.parts[index]
      assert.equal(localized.part_id, part.part_id)
      return {
        ...part,
        title: localized.title,
        story_text: localized.story_text,
        post_choice_text: localized.post_choice_text,
        image_slots: part.image_slots.map((slot) => ({
          ...slot,
          after_text: localized.image_anchor_texts[slot.slot_id],
        })),
        decision: part.decision === null ? null : {
          ...part.decision,
          prompt: localized.decision.prompt,
          choices: part.decision.choices.map((choice) => {
            const translated = localized.decision.choices.find((c) => c.choice_id === choice.choice_id)
            assert.ok(translated)
            return {
              ...choice,
              text: translated.text,
              effect_summary: translated.effect_summary,
              resolution_text: translated.resolution_text,
            }
          }),
        },
      }
    }),
  }
}

let verifiedAnchors = 0
for (const fixture of fixtures) {
  const ru = read(fixture.base + '.ru.json')
  const uz = read(fixture.base + '.uz.json')
  for (const language of ['ru', 'uz']) {
    const input = language === 'ru' ? ru : localize(ru, uz)
    const originalJson = JSON.stringify(input)
    const applied = withSeries30ApprovedSceneSlots(input)
    assert.equal(JSON.stringify(input), originalJson, 'overlay may not mutate literary source object')
    assert.equal(applied.story_id, input.story_id)
    assert.equal(applied.story_version, input.story_version)
    const addedCount = Object.keys(fixture.expected).length
    assert.equal(applied.illustration_plan.planned_asset_count,
      input.illustration_plan.planned_asset_count + addedCount,
      'runtime illustration_plan count must increase with new approved scenes')
    assert.equal(applied.illustration_plan.shared_asset_count,
      input.illustration_plan.shared_asset_count + addedCount)
    assert.equal(applied.illustration_plan.visible_assets_per_playthrough,
      input.illustration_plan.visible_assets_per_playthrough + addedCount)
    const actualAssetIds = new Set([
      applied.cover_illustration.asset_id,
      ...applied.parts.flatMap(p => p.image_slots.map(s => s.asset_id)),
      ...applied.parts.flatMap(p => (p.decision?.choices ?? [])
        .flatMap(ch => ch.illustration ? [ch.illustration.asset_id] : [])),
    ])
    assert.equal(applied.illustration_plan.planned_asset_count, actualAssetIds.size,
      'engine validation would reject runtime package: wrong planned_asset_count')
    assert.equal(applied.parts.length, input.parts.length)
    for (let i = 0; i < input.parts.length; i++) {
      const before = input.parts[i], after = applied.parts[i]
      for (const field of ['part_id', 'order', 'story_text', 'post_choice_text', 'is_final']) {
        assert.equal(after[field], before[field], 'literary ' + field + ' changed')
      }
      assert.equal(JSON.stringify(after.decision), JSON.stringify(before.decision),
        'branch choice text or state drift')
      for (const old of before.image_slots) {
        assert.ok(after.image_slots.some((s) => s.slot_id === old.slot_id && s.after_text === old.after_text),
          'previously approved slot lost ' + old.slot_id)
      }
    }
    const { story, episodes } = withReadingSeries(applied, fixture.key, 0)
    // The live gallery should contain every image in its reader episode, but
    // should keep new images locked until the child actually sees them.
    authoredIllustrationDiscovery.clear(story)
    const episodeForPart = (index) => story.reader_layout.episode_by_part[index]
    const galleryBefore = authoredIllustrationDiscovery.buildGalleryEpisodes(
      story, episodes.map(e => e.title), null, episodeForPart,
    )

    if (fixture.key === 'ordan') {
      // The new scene is BEFORE the Aras reply and before the S4E9/S4E10 split.
      const s4e9Gallery = galleryBefore[0].items.map(item => item.assetId)
      assert.deepEqual(
        s4e9Gallery.join('|'),
        [
          'seven_roads_s2_story7_return_to_ordan_01_APPROVED',
          'seven_roads_s2_story7_said_suspicious_road_notice_01_APPROVED',
          'seven_roads_s2_story7_morning_horses_01_APPROVED',
        ].join('|'),
        language + ': S4E9 must show return → suspicious notice → morning horses',
      )
      assert.equal(
        galleryBefore[1].items.some(item => item.assetId === 'seven_roads_s2_story7_said_suspicious_road_notice_01_APPROVED'),
        false, language + ': S4E9 notice leaked into S4E10 seal comparison',
      )
      assert.equal(
        galleryBefore[0].items.some(item => item.assetId === 'seven_roads_s2_story7_aras_seal_comparison_01_APPROVED'),
        false, language + ': future S4E10 seal comparison spoiled in S4E9',
      )
      assert.equal(
        galleryBefore[0].items.find(item => item.assetId === 'seven_roads_s2_story7_said_suspicious_road_notice_01_APPROVED')?.unlocked,
        false, language + ': S4E9 notice must be locked until seen',
      )
    }
    if (fixture.key === 'waited') {
      const firstSeries = galleryBefore[0].items.map(item => item.assetId)
      const homecoming = firstSeries.indexOf('seven_roads_s2_story4_homecoming_01_APPROVED')
      const departure = firstSeries.indexOf('seven_roads_s4e1_dawn_departure_to_ordan_01_APPROVED')
      const pillars = firstSeries.indexOf('seven_roads_s2_story4_three_pillars_01_APPROVED')
      assert.ok(homecoming >= 0 && departure > homecoming && pillars > departure,
        language + ': S4E1 gallery must show homecoming → morning departure → existing three pillars')
      assert.ok(
        galleryBefore[1].items.every(item => item.assetId !== 'seven_roads_s4e1_dawn_departure_to_ordan_01_APPROVED'),
        language + ': S4E1 departure must not leak into S4E2',
      )
    }
    if (fixture.key === 'waited') {
      const s4e3 = galleryBefore[2].items.map(item => item.assetId)
      assert.deepEqual(
        s4e3.join('|'),
        [
          'seven_roads_s2_story4_false_aras_notice_01_APPROVED',
          'seven_roads_s2_story4_wagon_lock_dawn_01_APPROVED',
          'seven_roads_s4e3_prison_wagon_road_fork_01_APPROVED',
        ].join('|'),
        language + ': S4E3 gallery must show false notice → wagon lock → road fork',
      )
      assert.equal(
        galleryBefore[3].items.some(item =>
          item.assetId === 'seven_roads_s4e3_prison_wagon_road_fork_01_APPROVED'),
        false,
        language + ': S4E3 road fork must not leak into S4E4',
      )
    }
    if (fixture.key === 'waited') {
      const s4e4Gallery = galleryBefore[3].items.map((item) => item.assetId)
      assert.deepEqual(
        s4e4Gallery.join('|'),
        [
          'seven_roads_s2_story4_nadir_contact_01_APPROVED',
          'seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED',
          'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED',
        ].join('|'),
        language + ': S4E4 gallery must keep Nadir contact → wooden tokens → rear-hook flask',
      )
      assert.equal(
        galleryBefore[2].items.some(item => item.assetId === 'seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED'),
        false,
        language + ': S4E4 wooden-token image leaked into S4E3',
      )
      assert.equal(galleryBefore[2].items.some(item => item.assetId === 'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED'),
        false, language + ': S4E4 flask must not leak into S4E3')
      const s4e4FlaskSlot = story.parts.flatMap(part => part.image_slots).find(slot =>
        slot.slot_id === 'SERIES30-S4E4-A02')
      assert.equal(s4e4FlaskSlot?.kind, 'shared',
        language + ': S4E4 flask must be available on both choices')
      assert.equal(s4e4FlaskSlot?.phase, 'post_choice_text',
        language + ': S4E4 flask must be after the choice')
      assert.equal(
        galleryBefore[3].items.find(item => item.assetId === 'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED')?.unlocked,
        false, language + ': S4E4 post-choice flask must remain spoiler-locked')
      const s4e4TokenSlot = story.parts.flatMap(part => part.image_slots).find(slot => slot.slot_id === 'SERIES30-S4E4-A01')
      assert.equal(s4e4TokenSlot?.kind, 'shared', language + ': S4E4 token image must be shared between choices')
      assert.equal(s4e4TokenSlot?.phase, 'story_text', language + ': S4E4 token scene must appear before choice')
      assert.equal(
        galleryBefore[3].items.find(item => item.assetId === 'seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED')?.unlocked,
        false,
        language + ': S4E4 new artwork must stay locked until seen',
      )
      authoredIllustrationDiscovery.markSeen(story, 'seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED')
      const galleryOnToken = authoredIllustrationDiscovery.buildGalleryEpisodes(
        story, episodes.map(e => e.title), null, episodeForPart,
      )
      assert.equal(
        galleryOnToken[3].items.find(item => item.assetId === 'seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED')?.unlocked,
        true,
        language + ': S4E4 token image must unlock when seen',
      )
      assert.equal(
        galleryOnToken[2].items.find(item => item.assetId === 'seven_roads_s4e3_prison_wagon_road_fork_01_APPROVED')?.unlocked,
        false,
        language + ': seeing S4E4 token scene must not unlock unrelated S4E3 road fork',
      )
      assert.equal(galleryOnToken[3].items.find(item => item.assetId === 'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED')?.unlocked,
        false, language + ': reading wooden-token scene must not unlock future flask')
      authoredIllustrationDiscovery.markSeen(story, 'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED')
      const galleryOnFlask = authoredIllustrationDiscovery.buildGalleryEpisodes(
        story, episodes.map(e => e.title), null, episodeForPart,
      )
      assert.equal(galleryOnFlask[3].items.find(item => item.assetId === 'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED')?.unlocked,
        true, language + ': viewing S4E4 flask must unlock it')
      assert.equal(galleryOnFlask[2].items.some(item => item.assetId === 'seven_roads_s4e4_nadir_flask_left_rear_hook_02_APPROVED'),
        false, language + ': S4E4 flask never appears in S4E3')
      authoredIllustrationDiscovery.clear(story)
    }
    if (fixture.key === 'falseRoad') {
      const s4e5 = galleryBefore[0].items.map(item => item.assetId)
      const scarIndex = s4e5.indexOf('seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED')
      const reconIndex = s4e5.indexOf('seven_roads_s2_story5_red_hill_recon_01_APPROVED')
      const mapIndex = s4e5.indexOf('seven_roads_s4e5_said_stone_ridge_map_02_APPROVED')
      assert.ok(scarIndex >= 0 && reconIndex > scarIndex && mapIndex > reconIndex,
        language + ': S4E5 gallery must show scar clue → existing Red Hill reconnaissance → Stone Ridge map')
      assert.equal(galleryBefore[1].items.some(item => item.assetId === 'seven_roads_s4e5_said_stone_ridge_map_02_APPROVED'),
        false, language + ': S4E5 map must not leak to S4E6')
      const mapSlot = story.parts.flatMap(p => p.image_slots).find(s => s.slot_id === 'SERIES30-S4E5-A02')
      assert.equal(mapSlot?.kind, 'shared', language + ': S4E5 map must be available on both choices')
      assert.equal(mapSlot?.phase, 'story_text', language + ': map must precede route choice')
      assert.equal(galleryBefore[0].items.find(item => item.assetId === 'seven_roads_s4e5_said_stone_ridge_map_02_APPROVED')?.unlocked,
        false, language + ': S4E5 map must be locked before reading')
      authoredIllustrationDiscovery.markSeen(story, 'seven_roads_s4e5_said_stone_ridge_map_02_APPROVED')
      const mapGallery = authoredIllustrationDiscovery.buildGalleryEpisodes(
        story, episodes.map(e => e.title), null, episodeForPart,
      )
      assert.equal(mapGallery[0].items.find(item => item.assetId === 'seven_roads_s4e5_said_stone_ridge_map_02_APPROVED')?.unlocked,
        true, language + ': S4E5 map must unlock when seen')
      assert.equal(mapGallery[1].items.some(item => item.assetId === 'seven_roads_s4e5_said_stone_ridge_map_02_APPROVED'),
        false, language + ': S4E5 map must never appear in S4E6')
      assert.equal(mapGallery[0].items.find(item => item.assetId === 'seven_roads_s2_story5_red_hill_recon_01_APPROVED')?.unlocked,
        false, language + ': seeing map must not unlock unread Red Hill reconnaissance')
      authoredIllustrationDiscovery.clear(story)
      const s4e6 = galleryBefore[1].items.map(item => item.assetId)
      const northRidge = s4e6.indexOf('seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED')
      const fork = s4e6.indexOf('seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED')
      const realHelp = s4e6.indexOf('seven_roads_s2_story5_real_reinforcement_departure_01_APPROVED')
      assert.ok(northRidge >= 0 && fork > northRidge && realHelp > fork,
        language + ': S4E6 gallery must show northern ridge → existing fork → real reinforcement')
      assert.equal(galleryBefore[0].items.some(item => item.assetId === 'seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED'),
        false, language + ': S4E6 ridge leaked backwards into S4E5')
      const ridgeSlot = story.parts.flatMap(p => p.image_slots).find(s => s.slot_id === 'SERIES30-S4E6-A01')
      assert.equal(ridgeSlot?.kind, 'shared', language + ': ridge must be shared by both choice routes')
      assert.equal(ridgeSlot?.phase, 'story_text', language + ': ridge must display before choice')
      assert.equal(galleryBefore[1].items.find(item => item.assetId === 'seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED')?.unlocked,
        false, language + ': S4E6 ridge must remain spoiler-locked before reading')
      authoredIllustrationDiscovery.markSeen(story, 'seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED')
      const ridgeSeen = authoredIllustrationDiscovery.buildGalleryEpisodes(
        story, episodes.map(e => e.title), null, episodeForPart,
      )
      assert.equal(ridgeSeen[1].items.find(item => item.assetId === 'seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED')?.unlocked,
        true, language + ': ridge should unlock after being seen')
      assert.equal(ridgeSeen[1].items.find(item => item.assetId === 'seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED')?.unlocked,
        false, language + ': ridge cannot reveal later fork before it is read')
      assert.equal(ridgeSeen[1].items.find(item => item.assetId === 'seven_roads_s2_story5_real_reinforcement_departure_01_APPROVED')?.unlocked,
        false, language + ': ridge cannot reveal future post-choice event')
      authoredIllustrationDiscovery.clear(story)
      assert.equal(galleryBefore[1].items.some(item => item.assetId === 'seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED'),
        false, language + ': S4E5 scar clue must never leak into S4E6')
      const scarSlot = story.parts.flatMap(part => part.image_slots).find(s => s.slot_id === 'SERIES30-S4E5-A01')
      assert.equal(scarSlot?.kind, 'shared', language + ': scar clue must be branch-neutral')
      assert.equal(scarSlot?.phase, 'story_text', language + ': scar clue is before route choice')
      assert.equal(galleryBefore[0].items.find(item => item.assetId === 'seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED')?.unlocked,
        false, language + ': S4E5 scar clue must remain locked before reading')
      authoredIllustrationDiscovery.markSeen(story, 'seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED')
      const seenGallery = authoredIllustrationDiscovery.buildGalleryEpisodes(
        story, episodes.map(e => e.title), null, episodeForPart,
      )
      assert.equal(seenGallery[0].items.find(item => item.assetId === 'seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED')?.unlocked,
        true, language + ': S4E5 new image must unlock after being seen')
      assert.equal(seenGallery[0].items.find(item => item.assetId === 'seven_roads_s2_story5_red_hill_recon_01_APPROVED')?.unlocked,
        false, language + ': S4E5 scar clue must not reveal the later Red Hill scene')
      authoredIllustrationDiscovery.clear(story)
    }
    if (fixture.key === 'towers') {
      assert.equal(
        galleryBefore[2].items.map(item => item.assetId).join('|'),
        [
          'seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED',
          'seven_roads_s2_story3_guardhouse_two_drawings_map_01_APPROVED',
          'seven_roads_s3e11_bulut_apple_evening_02_APPROVED_v3',
        ].join('|'),
        language + ': S3E11 gallery must show arriving guard before existing unfolded-map scene',
      )
      assert.equal(
        galleryBefore[1].items.some(item => item.assetId === 'seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED'),
        false,
        language + ': S3E11 arrival leaked into S3E10',
      )
      assert.equal(
        galleryBefore[1].items.some(item => item.assetId === 'seven_roads_s3e11_bulut_apple_evening_02_APPROVED_v3'),
        false,
        language + ': S3E11 Bulut apple leaked into S3E10',
      )
      assert.equal(
        galleryBefore[1].items.map(item => item.assetId).join('|'),
        [
          'seven_roads_s2_story3_sarvan_market_01_APPROVED',
          'seven_roads_s3e10_memorize_route_gate_01_APPROVED_v2',
          'seven_roads_s3e10_young_guard_water_trough_02_APPROVED',
        ].join('|'),
        language + ': S3E10 gallery must show existing Sarvan market before route-study scene',
      )
      assert.equal(
        galleryBefore[0].items.some(item => item.assetId === 'seven_roads_s3e10_memorize_route_gate_01_APPROVED_v2'),
        false,
        language + ': S3E10 route study leaked into S3E9',
      )
      assert.equal(
        galleryBefore[2].items.some(item => item.assetId === 'seven_roads_s3e10_memorize_route_gate_01_APPROVED_v2'),
        false,
        language + ': S3E10 route study leaked into S3E11',
      )
    }
    if (fixture.key === 'caravan') {
      const episode6 = galleryBefore[5].items.map(item => item.assetId)
      const p7Last = episode6.indexOf('seven_roads_story2_p7_img_03_v1')
      const flight = episode6.indexOf('seven_roads_s3e6_nadir_runs_between_wagons_01_APPROVED')
      assert.ok(p7Last >= 0 && flight > p7Last,
        language + ': S3E6 must show Nadir noticing the evidence before he flees')
      for (const alternate of ['seven_roads_story2_p8a_img_01_v1', 'seven_roads_story2_p8b_img_01_v1']) {
        assert.ok(episode6.includes(alternate),
          language + ': existing S3E6 branch illustration lost ' + alternate)
      }
      assert.ok(!galleryBefore[4].items.some(item => item.assetId === 'seven_roads_s3e6_nadir_runs_between_wagons_01_APPROVED'),
        language + ': Nadir flight leaked into S3E5 before story beat')
      assert.equal(
        galleryBefore[2].items.slice(0, 3).map(item => item.assetId).join('|'),
        [
          'seven_roads_s3e3_morning_alarm_window_01_APPROVED',
          'seven_roads_story2_p5_img_01_v1',
          'seven_roads_s3e3_temur_caravan_courtyard_02_APPROVED',
        ].join('|'),
        language + ': S3E3 must show alarm before existing wax clue scene',
      )
      assert.equal(
        galleryBefore[3].items.some(item => item.assetId === 'seven_roads_s3e3_morning_alarm_window_01_APPROVED'),
        false,
        language + ': S3E3 alarm leaked past investigation split into S3E4',
      )
    }
    if (fixture.key === 'silver') {
      const s2e1GalleryOrder = galleryBefore[0].items.map((entry) => entry.assetId)
      assert.equal(
        galleryBefore[3].items.map(item => item.assetId).join('|'),
        [
          'seven_roads_s2e4_missing_kamran_oak_01_APPROVED',
          'seven_roads_s2_story1_hidden_network_settlement_01_APPROVED',
          'seven_roads_s2e4_western_road_map_02_APPROVED',
        ].join('|'),
        language + ': S2E4 gallery must show the forest rendezvous before the hidden settlement',
      )
      assert.deepEqual(
        galleryBefore[1].items.map(item => item.assetId).join('|'),
        [
          'seven_roads_s2_story1_kamran_rescues_comrade_01_APPROVED',
          'seven_roads_s2_story1_danyar_pursuit_01_APPROVED',
          'seven_roads_s2e2_missing_dark_horse_01_APPROVED',
        ].join('|'),
        language + ': S2E2 gallery must show rescue, pursuit and missing dark horse in sequence',
      )
      assert.deepEqual(
        s2e1GalleryOrder.slice(0, 3).join('|'),
        [
          'seven_roads_s2e1_danyar_old_belt_dialogue_01_APPROVED',
          'seven_roads_s2e1_startled_birds_02_APPROVED',
          'seven_roads_s2_story1_royal_silver_attack_01_APPROVED',
        ].join('|'),
        language + ': S2E1 gallery must show dialogue, birds, then attack',
      )
    }
    for (const [id, expectedEpisode] of Object.entries(fixture.expected)) {
      const located = story.parts.flatMap((p, index) => p.image_slots
        .filter((slot) => slot.slot_id === id)
        .map((slot) => ({ slot, part: p, index })))
      assert.equal(located.length, 1, fixture.key + '/' + language + ': slot must be in one reading series')
      const item = located[0]
      assert.equal(story.reader_layout.episode_by_part[item.index], expectedEpisode,
        fixture.key + '/' + language + ': wrong virtual episode for ' + id)
      if (id === 'SERIES30-S2E4-A01' || id === 'SERIES30-S2E4-A02') {
        const splitAt = story.parts.findIndex(p =>
          pars(p.story_text).includes(language === 'ru'
            ? 'К вечеру Ордан снова выглядел обычным.'
            : 'Kechga kelib Ordan yana odatdagidek ko‘rina boshladi.'))
        assert.equal(item.index, splitAt,
          'S2E4 opening image must be in the part created by the virtual split')
        assert.equal(item.slot.phase, 'story_text',
          'S2E4 image must render during the newly split story_text')
        assert.equal(galleryBefore[2].items.some(entry => entry.assetId === item.slot.asset_id),
          false, 'S2E4 image leaked into S2E3 gallery')
      }
      if (id === 'SERIES30-S2E3-A03') {
        // The picture must follow the commandant's capital-trial reveal,
        // but precede the virtual series boundary and remain in post-choice content.
        const splitAt = story.parts.findIndex(p =>
          pars(p.story_text).includes(
            language === 'ru' ? 'К вечеру Ордан снова выглядел обычным.' :
              'Kechga kelib Ordan yana odatdagidek ko‘rina boshladi.',
          ),
        )
        assert.ok(splitAt > item.index, 'Farid A03 must precede S2E4 split')
        assert.ok(item.part.post_choice_text.includes(item.slot.after_text),
          'Farid A03 anchor must be located in the reader-visible continuation')
      }
      const galleryItem = galleryBefore[expectedEpisode - 1].items.find(g => g.assetId === item.slot.asset_id)
      assert.ok(galleryItem, id + '/' + language + ': missing from correct gallery episode')
      assert.equal(galleryItem.unlocked, false, 'new illustration spoiled before reading')
      assert.equal(item.slot.kind, 'shared')
      assert.equal(item.slot.phase, ['SERIES30-S2E3-A03', 'SERIES30-S3E11-A02', 'SERIES30-S4E4-A02'].includes(id) ? 'post_choice_text' : 'story_text')
      assert.equal(pars(item.part[item.slot.phase]).filter((p) => p === item.slot.after_text).length, 1,
        id + '/' + language + ': anchor missing or repeated')
      assert.ok(assetsSource.includes("'" + item.slot.asset_id + "'"),
        id + ': missing authoredStoryAssets registry entry')
      verifiedAnchors++
    }
    const sceneAssetId = story.parts.flatMap(p => p.image_slots)
      .find(slot => slot.slot_id === Object.keys(fixture.expected)[0])?.asset_id
    assert.ok(sceneAssetId)
    authoredIllustrationDiscovery.markSeen(story, sceneAssetId)
    const galleryAfter = authoredIllustrationDiscovery.buildGalleryEpisodes(
      story, episodes.map(e => e.title), null, episodeForPart,
    )
    assert.equal(galleryAfter.flatMap(e => e.items).find(g => g.assetId === sceneAssetId)?.unlocked, true,
      'gallery did not unlock after StoryImage observation')
    const otherNewIds = story.parts.flatMap(p => p.image_slots.map(s => s.asset_id))
      .filter(assetId => assetId !== sceneAssetId &&
        series30ApprovedScenes.some(scene => scene.asset_id === assetId))
    for (const other of otherNewIds) {
      assert.equal(galleryAfter.flatMap(e => e.items).find(g => g.assetId === other)?.unlocked, false,
        'gallery leaked another unread new illustration')
    }
    const allSlotIds = applied.parts.flatMap(p => p.image_slots.map(s => s.slot_id))
    assert.equal(allSlotIds.length, new Set(allSlotIds).size, 'duplicate slot ID')
    const allAssetIds = applied.parts.flatMap(p => p.image_slots.map(s => s.asset_id))
    assert.equal(allAssetIds.length, new Set(allAssetIds).size, 'duplicate asset ID')
  }
}

for (const scene of series30ApprovedScenes) {
  const match = queue.episodes.find(e =>
    scene.slot_id.startsWith('SERIES30-S2E1-') ? e.season === 2 && e.episode === 1 :
    scene.slot_id.startsWith('SERIES30-S2E2-') ? e.season === 2 && e.episode === 2 :
    scene.slot_id.startsWith('SERIES30-S2E3-') ? e.season === 2 && e.episode === 3 :
    scene.slot_id.startsWith('SERIES30-S2E4-') ? e.season === 2 && e.episode === 4 :
    scene.slot_id.startsWith('SERIES30-S3E3-') ? e.season === 3 && e.episode === 3 :
    scene.slot_id.startsWith('SERIES30-S3E6-') ? e.season === 3 && e.episode === 6 :
    scene.slot_id.startsWith('SERIES30-S3E10-') ? e.season === 3 && e.episode === 10 :
    scene.slot_id.startsWith('SERIES30-S3E11-') ? e.season === 3 && e.episode === 11 :
    scene.slot_id.startsWith('SERIES30-S4E1-') ? e.season === 4 && e.episode === 1 :
    scene.slot_id.startsWith('SERIES30-S4E2-') ? e.season === 4 && e.episode === 2 :
    scene.slot_id.startsWith('SERIES30-S4E3-') ? e.season === 4 && e.episode === 3 :
    scene.slot_id.startsWith('SERIES30-S4E4-') ? e.season === 4 && e.episode === 4 :
    scene.slot_id.startsWith('SERIES30-S4E5-') ? e.season === 4 && e.episode === 5 :
    scene.slot_id.startsWith('SERIES30-S4E6-') ? e.season === 4 && e.episode === 6 :
    scene.slot_id.startsWith('SERIES30-S4E9-') ? e.season === 4 && e.episode === 9 : false,
  )
  assert.ok(match?.asset_ids.includes(scene.asset_id),
    'approved asset missing from production queue: ' + scene.asset_id)
}

assert.ok(assetsSource.includes('seven_roads_s4e2_bay_horse_roadside_escape_01_APPROVED_v2.webp'),
  'superseded horse WebP must never be selected instead of corrected v2')
assert.equal(verifiedAnchors, 52)
console.log('[series30-art] PASS: 26 owner-approved assets, 52 unique RU/UZ anchors')
console.log('[series30-art] Correct reader episodes (S2E1 x2 / S2E2 x1 / S2E3 x3 / S2E4 x2 / S3E3 x2 / S3E6 x1 / S3E10 x2 / S3E11 x2 / S4E1 x1 / S4E2 x3 / S4E3 x1 / S4E4 x2 / S4E5 x2 / S4E6 x1 / S4E9 x1), no prose/choice/ID drift')
console.log('[series30-art] Old accepted images preserved; corrected horse v2 object registered')

if (process.env.GITHUB_ACTIONS === 'true') {
  await import('./verify-series30-approved-public-webps.mjs')
}

