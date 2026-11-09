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
const modified=new Map()
for(const packagePatch of proposal.source_files){
  const raw=fs.readFileSync(packagePatch.path,'utf8')
  assert.equal(hash(raw),packagePatch.source_git_blob_sha,
    'locked source drifted; proposal must be rebased, not silently applied: '+packagePatch.path)
  const story=JSON.parse(raw)
  for(const change of packagePatch.edits){
    assert.deepEqual(get(story,change.pointer),change.old_value,
      'proposal precondition failed: '+packagePatch.path+':'+change.pointer)
    set(story,change.pointer,change.new_value)
  }
  const proposedText=JSON.stringify(story,null,2)+'\n'
  assert.equal(hash(proposedText),packagePatch.draft_git_blob_sha,
    'proposal reconstruction drifted: '+packagePatch.path)
  modified.set(packagePatch.path,story)
}
const load=(name,lang)=>modified.get('src/data/authored/'+name+'.'+lang+'.json')
const story1={ru:load('prazdnikMuzhestvaV3','ru'),uz:load('prazdnikMuzhestvaV3','uz')}
const story2={ru:load('taynaVostochnogoKaravanaV4','ru'),uz:load('taynaVostochnogoKaravanaV4','uz')}
const story4={ru:load('staging/season2Story4WaitedMan','ru'),uz:load('staging/season2Story4WaitedMan','uz')}
const must=(text,needle,caseId)=>assert(text.includes(needle),caseId+' missing: '+needle)
const mustNot=(text,needle,caseId)=>assert(!text.includes(needle),caseId+' stale: '+needle)
for(const lang of ['ru','uz']){
  const a=story1[lang],b=story2[lang],c=story4[lang]
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
  must(interrogation,ru?'вернул находку капитану':'metall qoplamani sardorga qaytargan','E01-custody-'+lang)
  mustNot(later,ru?'Он достал металлическую накладку':'Temur qaroqchilar belgisi tushirilgan metall qoplamani chiqardi','E01-no-recovery-'+lang)
  must(message,ru?'Свернул записку и спрятал':'Qog‘ozni buklab','E02-channel-write-'+lang)
  must(message,ru?'прочитал записку под пробкой':'tiqin ostidagi xatni o‘qidi','E02-channel-read-'+lang)
  must(message,ru?'Красный холм. Старая патрульная дорога':'Qizil tepalik. Eski patrul yo‘li','E02-specific-content-'+lang)
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
console.log('[editorial-proposals] PASS 6 exact source-hash-locked JSON proposal transformations; E01–E04 RU/UZ; source files UNCHANGED')
