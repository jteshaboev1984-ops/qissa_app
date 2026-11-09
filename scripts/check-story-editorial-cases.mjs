// Source-specific literary continuity regression for fixes identified in the
// 2026-11-09 branch audit. This does not certify literary quality or replace
// owner-approved source documents / native Uzbek aloud acceptance.
import assert from 'node:assert/strict'
import fs from 'node:fs'

const load=(name,lang)=>JSON.parse(fs.readFileSync('src/data/authored/'+name+'.'+lang+'.json','utf8'))
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
  // The clue transmission must be present in common continuation, so all
  // choice variants inherit it independently of their extra investigation.
  for(const choice of c.parts[1].decision.choices){
    assert(choice.state_patch?.canon_updates?.nadir_red_hill_clue,'E02 choice memory lost: '+choice.choice_id)
  }
}
console.log('[editorial-cases] PASS E01-E04 in RU and UZ packages; still requires literary approval')
