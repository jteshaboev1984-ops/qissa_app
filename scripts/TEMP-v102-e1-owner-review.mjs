import assert from 'node:assert/strict'
import { randomBytes, randomUUID, createCipheriv, publicEncrypt, constants } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { collectStoryLiveEvidence } from './story-live-evidence.mjs'

// One-use, synthetic, one request only. No prose, identifiers or credentials in logs or public code.
const repo = 'jteshaboev1984-ops/qissa_app'
const branch = 'audit/v102-one-e1-owner-review-20260918'
const deployed = '004221f6e690cb2fdf58cccdf28ba9f50ecb2b04'
const live = process.env.QISSA_LIVE === '1'
const mode = live ? 'LIVE' : 'DRY'
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'Reruns forbidden')
assert.equal(readFileSync('audit/TEMP-v102-trigger.txt', 'utf8').trim(), `${mode}-V102-E1-ONCE-20260918`)
assert.ok(readFileSync('supabase/functions/story-generate/test-spend-budget.ts','utf8').includes('MAX_NANODOLLARS = 50_000_000'), 'Five-cent guard required')
assert.ok(readFileSync('supabase/functions/story-generate/split-openai.ts','utf8').includes('2400,'), 'Architect cap must match reviewed v102')
assert.ok(readFileSync('supabase/functions/story-generate/split-index.ts','utf8').includes('X-QISSA-Provider-Incomplete-Reason'), 'Incompleteness reason guard required')
const publicKey = readFileSync('audit/TEMP-v102-public.pem','utf8')
function encryptEvidence(value) {
  const plain = Buffer.from(JSON.stringify(value),'utf8')
  assert.ok(plain.length > 10 && plain.length < 250_000, 'Unexpected evidence size')
  const key = randomBytes(32), nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()])
  const wrapped = publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key)
  writeFileSync('audit/TEMP-v102-result.enc.json',JSON.stringify({scheme:'RSA-OAEP-SHA256+AES-256-GCM',key:wrapped.toString('base64'),nonce:nonce.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')}),{mode:0o600})
}
if (!live) {
  encryptEvidence({mode:'dry',synthetic:true,marker:'V102_ENCRYPTION_DRY'})
  console.log('V102_DRY_PASS: encrypted fictional fixture, five-cent guard, fixed-reason contract; zero provider HTTP.')
  process.exit(0)
}
const token = process.env.GITHUB_TOKEN?.trim(), key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && key,'Missing credentials: NO PAID POST')
async function refSha(ref) {
  const r = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${ref}`,{headers:{authorization:`Bearer ${token}`,accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000),redirect:'error'})
  assert.equal(r.status,200,'Could not verify exact GitHub ref: NO PAID POST')
  return (await r.json()).object.sha
}
assert.equal(await refSha('main'),deployed,'Main moved: NO PAID POST')
assert.equal(await refSha(branch),process.env.GITHUB_SHA,'Audit runner moved: NO PAID POST')
const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const headers = {'content-type':'application/json',apikey:key,authorization:`Bearer ${key}`,origin:'https://jteshaboev1984-ops.github.io'}
const selections={ageGroup:'5-7',language:'uz',heroType:'custom',customHeroName:'Malika',stylePackId:'cozy_forest',storyMode:'series',storyMood:'bedtime'}
const input={installationId:randomUUID(),selections,seriesState:{id:`qissa-synthetic-v102-${randomUUID()}`,mainCharacter:'Malika',recurringCharacters:[],lastEpisodeSummary:'',activeArc:'',relationshipState:{},choiceHistory:[],canonState:{},episodeCount:0},privacyConsent:{version:'2026-06-25-v1',acceptedAt:new Date().toISOString(),parentOrGuardianConfirmed:true,aiProcessingAccepted:true}}
const probe=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({...input,privacyConsent:null}),signal:AbortSignal.timeout(20000),redirect:'error'})
assert.equal(probe.status,403,'Free invalid-consent preflight failed: NO PAID POST')
assert.equal(probe.headers.get('x-qissa-runtime-ai'),'enabled','AI not enabled: NO PAID POST')
assert.equal((await probe.json())?.error,'privacy_consent_required','Unexpected privacy preflight: NO PAID POST')
console.log('V102_PRE_ADMISSION_PASS: exact source and free consent probe.')
// Exactly one provider-eligible E1. No retries, E2, TTS or Sol; operator must switch runtime OFF after admission.
const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(input),signal:AbortSignal.timeout(140000),redirect:'error'})
const diagnostics=collectStoryLiveEvidence(response.headers),meta=diagnostics.metadata
const safe={http:response.status,source:meta['x-qissa-generation-source'],runtime:meta['x-qissa-runtime-ai'],fallback:meta['x-qissa-fallback-reason'],attempts:meta['x-qissa-openai-request-attempts'],incompleteReason:response.headers.get('x-qissa-provider-incomplete-reason'),initialWords:meta['x-qissa-initial-story-words'],finalWords:meta['x-qissa-final-story-words'],repair:meta['x-qissa-generation-repair'],failureClass:meta['x-qissa-generation-failure-class'],failureTrace:meta['x-qissa-generation-failure-trace'],escalation:meta['x-qissa-escalation-used']}
console.log('V102_SAFE_METADATA',JSON.stringify(safe))
assert.equal(response.status,200,'Unexpected HTTP status: no retry')
const envelope=await response.json(), episode=envelope?.episode
assert.ok(episode && typeof episode==='object','Missing episode: no retry')
assert.equal(episode.generationSource,safe.source,'Source mismatch')
encryptEvidence({mode:'live',fictional:true,context:selections,envelope,metadata:safe})
console.log('V102_ENCRYPTED_E1_PRESERVED: exactly one provider-eligible E1; no raw content in logs.')
if(safe.source!=='openai-structured'){
  console.error('V102_FALLBACK_STOP: no E2 or retry; literary quality unverified; family beta NO-GO.')
  process.exitCode=1
}else{
  assert.equal(safe.escalation,'false','Unapproved escalation')
  const count=v=>String(v??'').trim().split(/\s+/u).filter(Boolean).length
  assert.ok(typeof episode.story_text==='string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'),'Hero restoration')
  const words=count(episode.story_text)
  assert.ok(words>=320 && words<=470,'Story length bounds')
  assert.ok(Array.isArray(episode.choices) && episode.choices.length===2 && new Set(episode.choices.map(c=>c.choice_id)).size===2,'Distinct choice IDs')
  assert.equal(episode.safety_self_check?.approved,true,'Safety approval')
  assert.equal(episode.safety_self_check?.required_action,'publish','Safety publish')
  console.log('V102_E1_TECH_PASS',JSON.stringify({storyWords:words,resolutionWords:episode.choices.map(c=>count(c.resolution_text)),choiceCount:2}))
  console.log('Owner must review actual story inline; E2 not requested; family beta NO-GO.')
}
