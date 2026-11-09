// Owner-reviewed R01–R04 bilingual excerpts, verified IN MEMORY ONLY.
// Locked masters, source Git blob SHAs, runtime paths and progress remain untouched.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { auditStoryPackage, auditLanguagePair } from './check-story-canon-literary.mjs'
import { localizeAuthoredStoryPackage } from '../src/features/authoredStory/localizePackage.ts'

const doc = JSON.parse(fs.readFileSync(
  'docs/qissa/ai/reviews/drafts/2026-11-09_owner_followup_excerpt_proposals.json', 'utf8',
))
assert.equal(doc.schema_version, 'qissa_owner_followups_excerpt_v1')
assert.match(doc.status, /DRAFT_NOT_PUBLISHED/)
assert.equal(doc.operations.length, 8)
const gitBlobSha = s => createHash('sha1')
  .update('blob ' + Buffer.byteLength(s) + '\0' + s).digest('hex')
const get = (object, pointer) => pointer.split('/').slice(1).reduce((v, key) => v[key], object)
const set = (object, pointer, value) => {
  const keys = pointer.split('/').slice(1)
  const tail = keys.pop()
  keys.reduce((v, key) => v[key], object)[tail] = value
}
const replaceExactlyOnce = (s, before, after) => {
  assert(s.includes(before), 'missing excerpt: ' + before.slice(0, 60))
  assert.equal(s.indexOf(before), s.lastIndexOf(before), 'ambiguous excerpt')
  return s.replace(before, after)
}
// The historical change records are immutable; the approved packages must
// contain every exact new excerpt, not the original old excerpt.
const approved=JSON.parse(fs.readFileSync(
  'docs/qissa/ai/reviews/2026-11-09_owner_approved_literary_manifest.json','utf8',
))
assert.equal(approved.schema_version,'qissa_approved_literary_manifest_v1')
assert.match(approved.status,/OWNER_APPROVED/)
const edited=new Map()
const counted=new Map()
for(const op of doc.operations){
  if(!edited.has(op.path)){
    const entry=approved.source_files.find(x=>x.path===op.path)
    assert(entry,'missing approved source '+op.path)
    assert.equal(entry.previous_git_blob_sha,op.source_git_blob_sha,
      'historical excerpt source provenance changed: '+op.path)
    const raw=fs.readFileSync(op.path,'utf8')
    assert.equal(gitBlobSha(raw),entry.approved_git_blob_sha,
      'new approved version drifted: '+op.path)
    edited.set(op.path,JSON.parse(raw))
  }
  assert.equal(op.language,op.path.endsWith('.ru.json')?'ru':'uz')
  const current=get(edited.get(op.path),op.pointer)
  assert.equal(typeof current,'string')
  assert(current.includes(op.after_text),'owner-approved literary excerpt missing: '+op.path+' '+op.case_id)
  assert(!current.includes(op.before_text),'unapproved old literary excerpt remains: '+op.path+' '+op.case_id)
  counted.set(op.case_id,(counted.get(op.case_id)||0)+1)
}
for (const id of ['R01', 'R02', 'R03', 'R04']) {
  assert.equal(counted.get(id), 2, id + ' must have one RU and one UZ operation')
}
const pair = (prefix) => {
  const ru = edited.get('src/data/authored/' + prefix + '.ru.json')
  const uzOverlay = edited.get('src/data/authored/' + prefix + '.uz.json')
  assert(ru && uzOverlay, 'missing RU/UZ pair: ' + prefix)
  const uz = localizeAuthoredStoryPackage(ru, uzOverlay)
  assert.deepEqual(auditStoryPackage(ru).errors, [])
  assert.deepEqual(auditStoryPackage(uz).errors, [])
  assert.deepEqual(auditLanguagePair(ru, uz), [])
  return { ru, uz }
}
const story1 = pair('prazdnikMuzhestvaV3')
const story2 = pair('taynaVostochnogoKaravanaV4')
const story6 = pair('staging/season2Story6TwoReinforcements')
const story7 = pair('staging/season2Story7BackToOrdan')
for (const lang of ['ru', 'uz']) {
  const p1 = story1[lang].parts[5]
  const p2 = story2[lang].parts[6]
  const p6 = story6[lang].parts[1]
  const p7 = story7[lang].parts[0]
  assert(p1.story_text.includes(lang === 'ru'
    ? 'Некоторое время она всматривалась в дорогу'
    : 'U bir muddat yo‘lni kuzatib'), 'R01 wait missing ' + lang)
  assert(!p1.story_text.includes(lang === 'ru' ? 'Пока ничего.' : 'Hali hech narsa eshitilmasdi.'),
    'R01 stale fragment ' + lang)
  assert(p2.decision.choices[0].resolution_text.includes(lang === 'ru'
    ? 'У порога южной башни ровно лежала пыль'
    : 'Janubiy minoraning ostonasida chang bir tekis yotardi'),
  'R03 branch 3a missing ' + lang)
  assert(!p2.decision.choices[1].resolution_text.includes(lang === 'ru'
    ? 'У порога южной башни' : 'Janubiy minoraning ostonasida'),
    'R03 unchosen Azim branch leaked ' + lang)
  assert(p7.post_choice_text.includes(lang === 'ru'
    ? 'Капитан ещё в Арасе сомневался'
    : 'Arasda sardor ham'), 'R02 plot memory missing ' + lang)
  assert(p6.post_choice_text.includes(lang === 'ru'
    ? 'Я велел вам оставаться у стены'
    : 'Sizlarga devor yonida qolishni aytgandim'), 'R04 adult risk warning missing ' + lang)
  assert.equal(p6.decision.choices.length, 2, 'R04 choice loss')
  for (const part of [p1, p2, p6, p7]) {
    for (const slot of part.image_slots || []) {
      const phase = slot.phase
      if (phase !== 'story_text' && phase !== 'post_choice_text') continue
      assert(part[phase].includes(slot.after_text), 'lost illustration anchor: '+slot.slot_id+' '+lang)
    }
  }
  const anchor = p2.decision.choices[0].illustration?.after_text
  assert(p2.decision.choices[0].resolution_text.includes(anchor),
    'R03 3a image choice anchor changed '+lang)
}
console.log('[owner-followups] PASS 8 R01–R04 owner-approved excerpts in locked RU/UZ sources; route topology, image anchors and previous SHA provenance')
