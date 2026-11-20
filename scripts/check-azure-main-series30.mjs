/**
 * Check all eight canonical literary packages, both languages and the exact
 * 30-series runtime presentation from current main. No TTS/provider calls.
 *
 * Pinned Git blobs fail closed if approved literary sources change in main.
 * CI uses a temporary read-only checkout of main at a separate path.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const root = process.argv[2]
if (!root || root.startsWith('-')) throw new Error('Usage: check-azure-main-series30.mjs <read-only-main-checkout>')

/**
 * Optional OFFLINE-only preflight: --uz-voices 1|2 --max-uz-character-units N.
 * This never calls Azure. The cap is deliberately provided by an operator
 * and applies to the planned TTS input, not to Azure billing or free quotas.
 */
const parameter = (flag) => {
  const i = process.argv.indexOf(flag)
  return i < 0 ? null : process.argv[i+1] ?? null
}
const plannedUzVoices = Number(parameter('--uz-voices') ?? '1')
const maxUzUnitsRaw = parameter('--max-uz-character-units')
assert.ok(Number.isInteger(plannedUzVoices) && [1,2].includes(plannedUzVoices),
  'UZ voice count must be 1 or 2')
const maxUzUnits = maxUzUnitsRaw === null ? null : Number(maxUzUnitsRaw)
if (maxUzUnits !== null) assert.ok(
  Number.isSafeInteger(maxUzUnits) && maxUzUnits > 0,
  'Invalid offline character cap',
)

const sources = [
  { key:'festival', number:5, ru:'src/data/authored/prazdnikMuzhestvaV3.ru.json', ruHash:'4e49f587ee2df3dc6c9f89fa74cca8c70b709e81', uz:'src/data/authored/prazdnikMuzhestvaV3.uz.json', uzHash:'a37cf8241c1f9b1a4de44f5ee2d9392f1d8e41eb' },
  { key:'silver', number:4, ru:'src/data/authored/staging/season2Story1RoyalSilver.ru.json', ruHash:'a3a1a43d1aa6f86c9a90fd97d1468ec3afd17430', uz:'src/data/authored/staging/season2Story1RoyalSilver.uz.json', uzHash:'81c08775a966c4a6db760e54a8df024ca72a3397' },
  { key:'caravan', number:8, ru:'src/data/authored/taynaVostochnogoKaravanaV4.ru.json', ruHash:'1eae700d477baad58b32dfca303e852d80d4e415', uz:'src/data/authored/taynaVostochnogoKaravanaV4.uz.json', uzHash:'6b0e69083a314c3e0761a4f759b153ef9a2eab11' },
  { key:'towers', number:3, ru:'src/data/authored/staging/season2Story3TwoTowers.ru.json', ruHash:'e889df65f5d5f877aedf7b71d7bb1cc487a0f3e3', uz:'src/data/authored/staging/season2Story3TwoTowers.uz.json', uzHash:'e20325c91dae8cc88e45265069313785017b7e49' },
  { key:'waited', number:4, ru:'src/data/authored/staging/season2Story4WaitedMan.ru.json', ruHash:'7c94223151a5d5ca287e59d350394aab22e5054e', uz:'src/data/authored/staging/season2Story4WaitedMan.uz.json', uzHash:'3cb6aaff57885d2aad346254d45f94c0368b02e5' },
  { key:'falseRoad', number:2, ru:'src/data/authored/staging/season2Story5FalseRoad.ru.json', ruHash:'787fcc6109f2f20758bea4a592090e55fe17c806', uz:'src/data/authored/staging/season2Story5FalseRoad.uz.json', uzHash:'b9df7fb184e1230c0d07be8999ab5cacb1131e3a' },
  { key:'reinforcements', number:2, ru:'src/data/authored/staging/season2Story6TwoReinforcements.ru.json', ruHash:'3130df982b8f64ad756ef5e60c2794c066463ebf', uz:'src/data/authored/staging/season2Story6TwoReinforcements.uz.json', uzHash:'70b48c7d84a2a63e0dba6977eb5fa98e9342fd22' },
  { key:'ordan', number:2, ru:'src/data/authored/staging/season2Story7BackToOrdan.ru.json', ruHash:'e5fde8ac773375a334ffab1c80fe621967674a3a', uz:'src/data/authored/staging/season2Story7BackToOrdan.uz.json', uzHash:'67101f138790269f3929f0c2ad3c4cd218242651' },
]
const pinnedCode = {
  localize: ['src/features/authoredStory/localizePackage.ts','d0e256d9e1523fbd6022f12a6d960893ece5909d'],
  reading: ['src/data/sevenRoadsReadingSeries.ts','05385936d2525362d47224043aee2b8d9fa2a648'],
  chronology: ['src/data/fourSeasonChronology.ts','0fade2771afac14a61dd668d07cd171799ed3669'],
}
const blob = (path, expectedHash) => {
  const data = readFileSync(join(root, path))
  const hash = createHash('sha1').update('blob ' + data.length + '\0').update(data).digest('hex')
  assert.equal(hash, expectedHash, path + ' has changed; re-check literary canon before updating audio sources')
  return data.toString('utf8')
}
const transpile = (text) => ts.transpileModule(text, {
  compilerOptions:{ module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022 },
}).outputText
const url = (code) => 'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
const engineUrl = url(transpile(readFileSync('src/features/authoredStory/engine.ts','utf8')))
const plannerUrl = url(
  transpile(readFileSync('src/features/authoredStory/authoredAudioPlan.ts','utf8'))
    .replace(/from ['"]\.\/engine['"]/, 'from "' + engineUrl + '"'),
)
const manifestUrl = url(
  transpile(readFileSync('src/features/authoredStory/audioManifest.ts','utf8'))
    .replace(/from ['"]\.\/authoredAudioPlan['"]/, 'from "' + plannerUrl + '"'),
)
const { localizeAuthoredStoryPackage } = await import(url(transpile(blob(...pinnedCode.localize))))
const { withReadingSeries } = await import(url(transpile(blob(...pinnedCode.reading))))
const { applyFourSeasonChronology } = await import(url(transpile(blob(...pinnedCode.chronology))))
const { buildAuthoredAudioPlan } = await import(plannerUrl)
const { compileDraftAuthoredAudioManifest } = await import(manifestUrl)

const progressFor = (story, index, selected) => ({
  story_id:story.story_id, story_version:story.story_version,
  current_part_index:index, selected_choices:selected,
  shown_resolution_decisions:story.parts[index].decision
    ? [story.parts[index].decision.decision_id] : [],
  choice_history:[],
  memory:{ lastEvent:'', canonState:{}, relationshipState:{} },
  completed:false, updated_at:'2026-11-20T00:00:00Z',
})
const textOf = (story, selected, manifest) => {
  const paragraphs = []
  const manifestText = new Map(manifest.segments.map(s => [s.segmentId, s.text]))
  for (let i=0; i<story.parts.length; i++) {
    const part = story.parts[i]
    const plan = buildAuthoredAudioPlan(story, progressFor(story,i,selected))
    assert.equal(plan.pauseForChoice,false,story.story_id + ' unexpectedly paused in a confirmed route')
    if (part.decision) {
      const choice = selected[part.decision.decision_id]
      assert.ok(choice, 'Missing confirmed choice')
      const outcomes = plan.segments.filter(s => s.phase === 'choice_resolution')
      assert.ok(outcomes.length > 0 && outcomes.every(s => s.choiceId === choice),
        'Unchosen resolution leaked or selected resolution missing')
    }
    for (const s of plan.segments) {
      assert.ok(s.text.length > 0 && s.text.length <= 2500,'Narration chunk outside capped size')
      assert.equal(manifestText.get(s.segmentId),s.text,'Requested audio segment absent from draft source manifest')
      paragraphs.push(s.text)
    }
  }
  return paragraphs.join(' ').replace(/\s+/g,' ').trim()
}
const assignmentsFor = (story) => {
  const allDecisions = new Map()
  for (const part of story.parts) {
    if (part.decision) {
      const id = part.decision.decision_id
      const choices = part.decision.choices.map(c => c.choice_id)
      if (!allDecisions.has(id)) allDecisions.set(id,choices)
    }
  }
  const referenced = new Set(story.parts.flatMap(p =>
    (p.conditional_segments ?? []).map(c => c.when.decision_id)))
  for (const id of referenced) {
    if (allDecisions.has(id)) continue
    const ext = story.external_choice_context?.find(c => c.decision_id === id)
    assert.ok(ext && ext.allowed_choice_ids.length > 0,
      'Unknown external inherited choice ' + id)
    allDecisions.set(id,ext.allowed_choice_ids)
  }
  let states = [{}]
  for (const [id,choices] of allDecisions) {
    assert.ok(choices.length >= 2 && choices.length <= 6,'Unexpected choice count')
    assert.ok(states.length*choices.length<=512,'Too many global route combinations')
    states=states.flatMap(state=>choices.map(choice=>({...state,[id]:choice})))
  }
  return states
}
let episodesRu=0,episodesUz=0,paths=0,entries=0
const uniqueAudio = new Map()
const inputCharacters = {ru:0,uz:0}
const report=[]
for (const def of sources) {
  const ruBase=JSON.parse(blob(def.ru,def.ruHash))
  const uzOverlay=JSON.parse(blob(def.uz,def.uzHash))
  for (const lang of ['ru','uz']) {
    const literary=lang==='ru' ? ruBase : localizeAuthoredStoryPackage(ruBase,uzOverlay)
    const current=applyFourSeasonChronology(literary)
    const {story,episodes}=withReadingSeries(current,def.key,0)
    assert.equal(episodes.length,def.number,'Unexpected number of reader episodes')
    if (lang==='ru') episodesRu+=episodes.length
    else episodesUz+=episodes.length
    assert.equal(story.language,lang)
    assert.equal(story.reader_layout?.version,'series-30-v1')
    const before=compileDraftAuthoredAudioManifest(current)
    const after=compileDraftAuthoredAudioManifest(story)
    assert.equal(after.isApproved,false)
    assert.equal(after.isPublished,false)
    const assignments=assignmentsFor(current)
    entries+=after.segments.length
    for (const segment of after.segments) {
      const textHash = createHash('sha256').update(segment.text,'utf8').digest('hex')
      const cacheKey = lang + ':' + textHash
      inputCharacters[lang] += segment.text.length
      if (!uniqueAudio.has(cacheKey)) uniqueAudio.set(cacheKey,{
        language:lang, textHash, characterUnits:segment.text.length,
      })
    }
    for (const selected of assignments) {
      const originalText=textOf(current,selected,before)
      const readingText=textOf(story,selected,after)
      assert.equal(readingText,originalText,
        'Narrated text lost/repeated/reordered in ' + def.key + '/' + lang)
      paths+=1
    }
    report.push({key:def.key,lang,episodes:episodes.length,
      choices:assignments.length,segments:after.segments.length})
  }
}
assert.equal(episodesRu,30)
assert.equal(episodesUz,30)
assert.equal(report.length,16)
const charactersByLang = {ru:0,uz:0}
const uniqueAssetsByLang = {ru:0,uz:0}
for (const item of uniqueAudio.values()) {
  charactersByLang[item.language] += item.characterUnits
  uniqueAssetsByLang[item.language] += 1
}
assert.ok(charactersByLang.uz>0 && charactersByLang.ru>0)
assert.ok(charactersByLang.uz<=inputCharacters.uz)
assert.ok(charactersByLang.ru<=inputCharacters.ru)
const plannedUzUnits = charactersByLang.uz * plannedUzVoices
if (maxUzUnits !== null && plannedUzUnits > maxUzUnits) {
  throw new Error('OFFLINE BUDGET STOP: planned Uzbek voice character units exceed the operator-supplied cap. No provider request was made.')
}
console.log('[azure-series30] PASS: 30 RU + 30 UZ reader episodes, all fully-selected source paths')
console.log(JSON.stringify({
  episodesRu,episodesUz,paths,
  manifestSegmentEntries:entries,
  distinctSpokenTextsByLanguage:uniqueAssetsByLang,
  uniqueAzureCharacterUnitsOneVoice:charactersByLang,
  uzPreflight:{plannedVoices:plannedUzVoices,plannedCharacterUnits:plannedUzUnits,operatorCap:maxUzUnits,providerCalled:false},
  allManifestCharacterUnits:inputCharacters,
  // Not a monetary quote. Azure billing depends on tier, region and provider policy.
  caveat:'Character units are UTF-16 JavaScript lengths, not guaranteed Azure billable characters or money.',
  packages:report,
},null,2))
