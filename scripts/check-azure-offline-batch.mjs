import assert from 'node:assert/strict'
import { planOfflineAzureUzBatch, AZURE_UZ_DRAFT_MODEL } from './lib/azure-uz-offline-batch-plan.mjs'

const segment = (partId, segmentId, text, choiceId=null) => ({
  partId, segmentId,
  phase:choiceId?'choice_resolution':'before_choice',
  choiceId,text,
})
const oneSource = (storyId, segments) => ({
  storyId, storyVersion:'interactive-v3',
  sourceLiteraryVersion:'approved-literary-v1',
  language:'uz', isApproved:false, isPublished:false, segments,
})
const opts = {
  mode:'review_only',
  voicePresets:['soft_female','calm_male'],
  maxCharacterUnits:2000,
  maxUniqueAssets:8,
}
const src = [
  oneSource('story_1', [
    segment('p1','p1:before_choice:shared:chunk-1','A small shared text.'),
    segment('p1','p1:choice_resolution:a:chunk-1','Selected ending A.','a'),
  ]),
  oneSource('story_2', [
    segment('p2','p2:before_choice:shared:chunk-1','A small shared text.'),
    segment('p2','p2:choice_resolution:b:chunk-1','Selected ending B.','b'),
  ]),
]
const plan = planOfflineAzureUzBatch(src,opts)
assert.equal(plan.mode,'review_only')
assert.equal(plan.canExecute,false)
assert.equal(plan.providerCallsMade,0)
assert.equal(plan.sourceSegmentCount,4)
assert.equal(plan.uniqueMp3Candidates,6,'Three unique texts × two voices, no duplicate generation')
assert.equal(plan.selectedVoices[0].providerVoiceId,'uz-UZ-MadinaNeural')
assert.equal(plan.selectedVoices[1].providerVoiceId,'uz-UZ-SardorNeural')
assert.equal(plan.jobs.filter(x=>x.references.length===2).length,2)
assert.ok(plan.jobs.every(x=>x.providerModel===AZURE_UZ_DRAFT_MODEL))
assert.ok(plan.jobs.every(x=>x.sourceTextSha256.length===64))
assert.ok(plan.jobs.every(x=>typeof x.characterUnits==='number'&&x.characterUnits>0))
assert.ok(plan.jobs.every(x=>!('text' in x)&&!('spokenText' in x)))
assert.ok(!JSON.stringify(plan).includes('Selected ending'), 'Review output must not contain source text')
assert.deepEqual(
  planOfflineAzureUzBatch(src,opts),
  planOfflineAzureUzBatch(structuredClone(src),structuredClone(opts)),
  'Batch must be deterministic for retries',
)
assert.throws(()=>planOfflineAzureUzBatch(src,{...opts,maxCharacterUnits:1}),/OFFLINE CAP STOP/)
assert.throws(()=>planOfflineAzureUzBatch(src,{...opts,maxUniqueAssets:1}),/OFFLINE CAP STOP/)
assert.throws(()=>planOfflineAzureUzBatch(src,{...opts,maxCharacterUnits:undefined}),/caps are mandatory/)
assert.throws(()=>planOfflineAzureUzBatch(src,{...opts,mode:'execute'}),/review-only/)
assert.throws(()=>planOfflineAzureUzBatch(src,{...opts,voicePresets:['unsupported']}),/candidate/)
assert.throws(()=>planOfflineAzureUzBatch(src,{...opts,voicePresets:['soft_female','soft_female']}),/caps are mandatory/)
assert.throws(()=>planOfflineAzureUzBatch([src[0],src[0]],opts),/Duplicate source package/)
assert.throws(()=>planOfflineAzureUzBatch([{...src[0],isApproved:true}],opts),/unapproved Uzbek/)
assert.throws(()=>planOfflineAzureUzBatch([{...src[0],isPublished:true}],opts),/unapproved Uzbek/)
assert.throws(()=>planOfflineAzureUzBatch([{...src[0],language:'ru'}],opts),/unapproved Uzbek/)
assert.throws(()=>planOfflineAzureUzBatch([{...src[0],segments:[
  src[0].segments[0],
  {...src[0].segments[0],text:'Colliding editorial source for same part.'},
]}],opts),/multiple texts/)
assert.throws(()=>planOfflineAzureUzBatch([{...src[0],segments:[
  {...src[0].segments[0],text:'\nleading space'},
]}],opts),/Invalid narration/)
assert.throws(()=>planOfflineAzureUzBatch([{...src[0],segments:[
  {...src[0].segments[0],text:'x'.repeat(2501)},
]}],opts),/Invalid narration/)
assert.throws(()=>planOfflineAzureUzBatch([{...src[0],segments:[
  {...src[0].segments[0],choiceId:'evil',phase:'before_choice'},
]}],opts),/Invalid narration/)
console.log('[azure-batch-review] PASS: offline-only, 2 voices, shared-text dedup, immutable source identity, mandatory spend preflight caps and negative gates')
