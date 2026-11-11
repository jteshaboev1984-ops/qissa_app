// QISSA #318 — fail-fast editorial source validation for the owner-approved
// costume continuity sidecar. No writes, image generation, runtime or DB changes.
import fs from 'node:fs'

const source = path => fs.readFileSync(path, 'utf8')
const json = path => JSON.parse(source(path))
const ledgerPath = 'docs/qissa/season2/season2_wardrobe_continuity_v1.json'
const addendumPath = 'docs/qissa/ai/SEVEN_ROADS_COSTUME_CONTINUITY_V1.md'
const auditPath = 'docs/qissa/season2/2026-11-11_temur_samira_costume_chronology_audit.md'
const ledger = json(ledgerPath)
const addendum = source(addendumPath)
const inventory = json('docs/qissa/season2/season2_staging_authored_package_inventory.json')
const registry = source('src/data/authoredStoryAssets.ts')
const pairs = {
  2: ['src/data/authored/taynaVostochnogoKaravanaV4.ru.json',
      'src/data/authored/taynaVostochnogoKaravanaV4.uz.json'],
  3: ['src/data/authored/staging/season2Story3TwoTowers.ru.json',
      'src/data/authored/staging/season2Story3TwoTowers.uz.json'],
  4: ['src/data/authored/staging/season2Story4WaitedMan.ru.json',
      'src/data/authored/staging/season2Story4WaitedMan.uz.json'],
  5: ['src/data/authored/staging/season2Story5FalseRoad.ru.json',
      'src/data/authored/staging/season2Story5FalseRoad.uz.json'],
  6: ['src/data/authored/staging/season2Story6TwoReinforcements.ru.json',
      'src/data/authored/staging/season2Story6TwoReinforcements.uz.json'],
  7: ['src/data/authored/staging/season2Story7BackToOrdan.ru.json',
      'src/data/authored/staging/season2Story7BackToOrdan.uz.json'],
}
const errors = []
const fail = text => errors.push(text)
const paragraphs = text => String(text ?? '').split(/\n\n+/).map(p=>p.trim()).filter(Boolean)

if (ledger.schema_version !== 'qissa-seven-roads-s2-wardrobe-continuity-v1' ||
    ledger.status !== 'owner-approved-visual-continuity-addendum' ||
    ledger.publication_state !== 'unpublished' ||
    ledger.changes_runtime !== false ||
    ledger.authority?.base !== 'docs/qissa/ai/SEVEN_ROADS_WORLD_BIBLE_V2.md' ||
    ledger.authority?.addendum !== addendumPath ||
    ledger.authority?.audit !== auditPath ||
    !source(auditPath).includes('NON-CANON') ||
    !addendum.includes('APPROVED CANON ADDENDUM (NARROW SCOPE)')) {
  fail('Costume addendum provenance/approval/release contract drift')
}
for (const k of ['TEMUR_TRAVEL_BASE','SAMIRA_TRAVEL_BASE','SAMIRA_LIGHT_TRAVEL_OVERSET','POST_TOWER_TRAVEL_WORN','ORDAN_NEXT_MORNING']) {
  if (!ledger.definitions?.[k]) fail('Missing visual continuity definition '+k)
}
if (!ledger.definitions?.SAMIRA_LIGHT_TRAVEL_OVERSET?.primary_underlayer?.includes('SAMIRA_TRAVEL_BASE') ||
    !ledger.definitions?.SAMIRA_LIGHT_TRAVEL_OVERSET?.removed_when?.includes('road post')) {
  fail('Samira removable layers no longer resolve to original burgundy base after the road post')
}
for (const marker of ['small narrow white forehead star','no white socks','no forehead star/blaze','one long, thick, dark braid','cream','burgundy']) {
  if (!addendum.toLowerCase().includes(marker.toLowerCase())) fail('Costume/horse invariant omitted from addendum: '+marker)
}
if (!Array.isArray(ledger.checkpoints) || ledger.checkpoints.length !== 10) {
  fail('Expected 10 explicit source-grounded Season 2 continuity checkpoints')
}
const uniq = new Set()
const cache = new Map()
for (const checkpoint of ledger.checkpoints || []) {
  if (!checkpoint?.id || uniq.has(checkpoint.id)) { fail('Duplicated/missing checkpoint id'); continue }
  uniq.add(checkpoint.id)
  const pair = pairs[checkpoint.story]
  if (!pair || !checkpoint.part_id || !['story_text','post_choice_text'].includes(checkpoint.phase) ||
      !checkpoint.anchor_ru?.trim() || !checkpoint.anchor_uz?.trim() ||
      !checkpoint.text_fact || !checkpoint.visual_policy || !checkpoint.certainty) {
    fail(checkpoint.id+': incomplete bilingual event metadata')
    continue
  }
  const [ruPath,uzPath] = pair
  for (const [language,path,anchor] of [['ru',ruPath,checkpoint.anchor_ru],['uz',uzPath,checkpoint.anchor_uz]]) {
    if (!cache.has(path)) cache.set(path,json(path))
    const document = cache.get(path)
    const part = document.parts?.find(p=>p.part_id===checkpoint.part_id)
    if (!part || document.language !== language) {
      fail(checkpoint.id+': incorrect '+language+' source/part identity')
      continue
    }
    const count = paragraphs(part[checkpoint.phase]).filter(p=>p===anchor).length
    if (count !== 1) fail(checkpoint.id+': '+language+' exact paragraph anchor count='+count)
  }
  if (checkpoint.image_slot_id) {
    const base = cache.get(ruPath)
    const part = base.parts.find(p=>p.part_id===checkpoint.part_id)
    const slot = part.image_slots?.find(s=>s.slot_id===checkpoint.image_slot_id)
    if (slot?.asset_id!==checkpoint.asset_id ||
        slot?.phase!==checkpoint.phase || slot?.after_text!==checkpoint.anchor_ru ||
        slot?.status!=='approved' || slot?.runtime_url!==null ||
        !registry.includes("'"+checkpoint.asset_id+"'")) {
      fail(checkpoint.id+': preapproved art slot or exact placement drifted')
    }
  }
}
const idOrder = (before,after)=>{
  const i = ledger.checkpoints.findIndex(x=>x.id===before)
  const j = ledger.checkpoints.findIndex(x=>x.id===after)
  if (i<0 || j<0 || i>=j) fail('Invalid travel chronology '+before+' -> '+after)
}
idOrder('aras_home_overnight','ordan_mission_departs')
idOrder('fork_owner_approved_light_layer','post_rustam_departure')
idOrder('post_rustam_departure','tower_conflict_return')
idOrder('tower_conflict_return','ordan_evening_arrival')
idOrder('ordan_evening_arrival','ordan_next_morning_rest')
for (const [id,expected] of [
  ['fork_owner_approved_light_layer','fork_light_travel_overset'],
  ['post_rustam_departure','post_departs_burgundy_base'],
  ['tower_conflict_return','after_tower_travel_worn'],
  ['ordan_evening_arrival','after_tower_travel_worn'],
  ['ordan_next_morning_rest','ordan_next_morning']
]) {
  if (ledger.checkpoints.find(x=>x.id===id)?.state!==expected) fail('Visual state transition drift: '+id)
}
const fork = ledger.checkpoints.find(x=>x.id==='fork_owner_approved_light_layer')
if (fork?.image_slot_id!=='S2-ST5-BLANK-FORK' ||
  fork?.asset_id!=='seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED') {
  fail('Owner-approved fork image identity changed')
}
for (const row of inventory.packages || []) {
  if (row.publication_state!=='not-published') fail('Season 2 staging publication state changed in story '+row.story_number)
}
if (errors.length) {
  for (const e of errors) console.error('[s2-costume-canon] '+e)
  process.exit(1)
}
console.log('[s2-costume-canon] PASS: narrow approved costume interpretation, 10 bilingual literary anchors, horse/character invariants, E5 image and travel transitions, Season 2 unpublished')
