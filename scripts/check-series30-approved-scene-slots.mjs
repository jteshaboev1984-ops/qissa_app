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
assert.equal(series30ApprovedScenes.length, 5)
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
    base: 'src/data/authored/staging/season2Story1RoyalSilver',
    key: 'silver',
    expected: { 'SERIES30-S2E3-A01': 3, 'SERIES30-S2E3-A02': 3, 'SERIES30-S2E3-A03': 3 },
  },
  {
    base: 'src/data/authored/staging/season2Story4WaitedMan',
    key: 'waited',
    expected: { 'SERIES30-S4E2-A01': 2, 'SERIES30-S4E2-A02': 2 },
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
    for (const [id, expectedEpisode] of Object.entries(fixture.expected)) {
      const located = story.parts.flatMap((p, index) => p.image_slots
        .filter((slot) => slot.slot_id === id)
        .map((slot) => ({ slot, part: p, index })))
      assert.equal(located.length, 1, fixture.key + '/' + language + ': slot must be in one reading series')
      const item = located[0]
      assert.equal(story.reader_layout.episode_by_part[item.index], expectedEpisode,
        fixture.key + '/' + language + ': wrong virtual episode for ' + id)
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
      assert.equal(item.slot.phase, id === 'SERIES30-S2E3-A03' ? 'post_choice_text' : 'story_text')
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
  const match = queue.episodes.find(e => (scene.story_id === 'seven_roads_korolevskoe_serebro'
    ? e.season === 2 && e.episode === 3 : e.season === 4 && e.episode === 2))
  assert.ok(match?.asset_ids.includes(scene.asset_id),
    'approved asset missing from production queue: ' + scene.asset_id)
}

assert.ok(assetsSource.includes('seven_roads_s4e2_bay_horse_roadside_escape_01_APPROVED_v2.webp'),
  'superseded horse WebP must never be selected instead of corrected v2')
assert.equal(verifiedAnchors, 10)
console.log('[series30-art] PASS: 5 owner-approved assets, 10 unique RU/UZ anchors')
console.log('[series30-art] Correct reader episodes (S2E3 x3 / S4E2 x2), no prose/choice/ID drift')
console.log('[series30-art] Old accepted images preserved; corrected horse v2 object registered')

if (process.env.GITHUB_ACTIONS === 'true') {
  await import('./verify-series30-approved-public-webps.mjs')
}

