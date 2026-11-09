// Validate proposed editorial fixes IN MEMORY ONLY. Approved story files are
// source-hash-locked by existing CI; never bypass those approval boundaries.
// Literature/sign-off for proposed text is a separate human editorial gate.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { auditStoryPackage, auditLanguagePair } from './check-story-canon-literary.mjs'
import { localizeAuthoredStoryPackage } from '../src/features/authoredStory/localizePackage.ts'

const proposal=JSON.parse(fs.readFileSync(
  'docs/qissa/ai/reviews/drafts/2026-11-09_literary_patch_proposals.json','utf8',
))
assert.equal(proposal.status,'PROPOSED_NOT_APPROVED_NOT_PUBLISHED')
assert.equal(proposal.source_files.length,6)
const hash=(s)=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex')
const get=(object,pointer)=>pointer.split('/').slice(1).reduce((item,key)=>item[key],object)
const set=(object,pointer,value)=>{
  const keys=pointer.split('/').slice(1),last=keys.pop()
  const parent=keys.reduce((item,key)=>item[key],object)
  parent[last]=value
}
// After owner approval the proposed text is in the versioned authored package.
 // Historical draft blobs/preconditions remain archived in the proposal document.
 // New approved source blobs are locked in a separate signed-provenance manifest.
const approved=JSON.parse(fs.readFileSync(
  'docs/qissa/ai/reviews/2026-11-09_owner_approved_literary_manifest.json','utf8',
))
assert.equal(approved.schema_version,'qissa_approved_literary_manifest_v1')
assert.match(approved.status,/OWNER_APPROVED/)
const modified=new Map()
for(const packagePatch of proposal.source_files){
  const approvedEntry=approved.source_files.find(x=>x.path===packagePatch.path)
  assert(approvedEntry,'approved manifest omits '+packagePatch.path)
  assert.equal(approvedEntry.previous_git_blob_sha,packagePatch.source_git_blob_sha,
    'historical source provenance mismatch: '+packagePatch.path)
  const raw=fs.readFileSync(packagePatch.path,'utf8')
  assert.equal(hash(raw),approvedEntry.approved_git_blob_sha,
    'approved source drifted; require a NEW owner-reviewed revision: '+packagePatch.path)
  const story=JSON.parse(raw)
  for(const change of packagePatch.edits){
    assert.deepEqual(get(story,change.pointer),change.new_value,
      'approved operation missing/altered: '+packagePatch.path+':'+change.pointer)
  }
  modified.set(packagePatch.path,story)
}
const load=(name,lang)=>modified.get('src/data/authored/'+name+'.'+lang+'.json')
const story1={ru:load('prazdnikMuzhestvaV3','ru'),uz:load('prazdnikMuzhestvaV3','uz')}
const story2={ru:load('taynaVostochnogoKaravanaV4','ru'),uz:load('taynaVostochnogoKaravanaV4','uz')}
const story4={ru:load('staging/season2Story4WaitedMan','ru'),uz:load('staging/season2Story4WaitedMan','uz')}
const must=(text,needle,caseId)=>assert(text.includes(needle),caseId+' missing: '+needle)
const mustNot=(text,needle,caseId)=>assert(!text.includes(needle),caseId+' stale: '+needle)
for(const lang of ['ru','uz']){
  const a=story1[lang],b=story2[lang]
  const c=lang==='ru'?story4.ru:localizeAuthoredStoryPackage(story4.ru,story4.uz)
  const ru=lang==='ru'
  const forest=a.parts[2].story_text
  const leave=a.parts[4].decision.choices[0].resolution_text
  const first=b.parts[4].post_choice_text
  const later=b.parts[6].post_choice_text
  const interrogation=b.parts[8].story_text
  const message=c.parts[1].post_choice_text
  must(forest,ru?'правый рукав':'o‘ng yengini','E04-'+lang)
  mustNot(leave,ru?'правило короля':'Qirolning qoidasi','E03-'+lang)
  must(first,ru?'срисовал знак':'belgini kichik qog‘ozga','E01-sketch-'+lang)
  must(later,ru?'рисунок знака':'chizib olgan qaroqchilar belgisini','E01-paper-display-'+lang)
  must(interrogation,ru?'вернул находку капитану':'metall qoplamani sardorga qaytardi','E01-custody-'+lang)
  must(interrogation,ru?'убрал находку в сумку':'xaltasiga solib qo‘ydi','E01-retrieval-from-bag-'+lang)
  mustNot(later,ru?'Он достал металлическую накладку':'Temur qaroqchilar belgisi tushirilgan metall qoplamani chiqardi','E01-no-recovery-'+lang)
  must(message,ru?'Свернул записку и спрятал':'Qog‘ozni buklab','E02-channel-write-'+lang)
  const retrieval=ru?'незаметно вынул из-под пробки сложенную записку':'tiqin ostidagi buklangan xatni sezdirmay oldi'
  const concealedReading=ru?'скрывшись за сложенными тюками':'taxlangan yuklar orasidagi pana joyga o‘tgach'
  const readAfterConcealment=ru?'развернул записку и прочитал сообщение':'xatni ochib o‘qidi'
  must(message,retrieval,'E02-note-retrieved-'+lang)
  must(message,concealedReading,'E02-hide-to-read-'+lang)
  must(message,readAfterConcealment,'E02-channel-read-'+lang)
  assert(message.indexOf(retrieval)<message.indexOf(concealedReading) &&
      message.indexOf(concealedReading)<message.indexOf(readAfterConcealment),
    'E02 reading must occur after taking note to hidden place: '+lang)
  must(message,ru?'Красный холм. Старая патрульная дорога':'Qizil tepalik. Eski patrul yo‘li','E02-specific-content-'+lang)
  must(message,ru?'Люди ждут тюремную повозку':'Odamlar mahbus tashilayotgan aravani kutyapti','E02-target-of-warning-'+lang)
  must(message,ru?'вернул пустую флягу на прежний крюк':'bo‘sh idishni avvalgi ilgakka qaytarib osdi','E02-flask-left-without-note-'+lang)
  mustNot(message,ru?'прочитал записку под пробкой':'tiqin ostidagi xatni o‘qidi','E02-no-open-reading-at-cart-'+lang)
  const dropClue=ru?'На северной стороне есть старое каменное корыто':'Shimoliy tomonida eski tosh oxur bor'
  const supplyClue=ru?'По большому бурдюку воды на каждой':'Har biriga bittadan katta mesh suv'
  must(c.parts[1].decision.choices[1].resolution_text,dropClue,'E02-drop-choice-fixture-'+lang)
  must(c.parts[1].decision.choices[0].resolution_text,supplyClue,'E02-supply-choice-fixture-'+lang)
  mustNot(message,dropClue,'E02-no-drop-point-choice-leak-'+lang)
  mustNot(message,supplyClue,'E02-no-supplies-choice-leak-'+lang)
  assert.throws(()=>mustNot(message+'\\n'+dropClue,dropClue,'fixture-branch-b-'+lang),/stale/u)
  assert.throws(()=>mustNot(message+'\\n'+supplyClue,supplyClue,'fixture-branch-a-'+lang),/stale/u)
  for(const choice of c.parts[1].decision.choices){
    assert(choice.state_patch?.canon_updates?.nadir_red_hill_clue,'E02 choice memory lost: '+choice.choice_id)
  }
}
for(const [ru,uz] of [[story1.ru,story1.uz],[story2.ru,story2.uz],[story4.ru,story4.uz]]){
  assert.deepEqual(auditStoryPackage(ru).errors,[])
  const runtimeUz=localizeAuthoredStoryPackage(ru,uz)
  assert.deepEqual(auditStoryPackage(runtimeUz).errors,[])
  assert.deepEqual(auditLanguagePair(ru,runtimeUz),[])
}
console.log('[editorial-approved] PASS 6 owner-approved source-hash-locked JSON packages; E01–E04 RU/UZ; old proposal blobs retained as provenance')
