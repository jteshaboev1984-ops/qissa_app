import assert from 'node:assert/strict'
import { randomBytes, randomUUID, createCipheriv, publicEncrypt, constants } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { collectStoryLiveEvidence } from './story-live-evidence.mjs'

// Disposable, owner-approved one-E1 synthetic runner. NEVER log raw prose, IDs or credentials.
const repo = 'jteshaboev1984-ops/qissa_app'
const branch = 'audit/v101-one-e1-owner-review-20260918'
const deployed = 'f6a6dee550d5f4cdd751bd7a880c0a84f5a90b2a'
const live = process.env.QISSA_LIVE === '1'
const mode = live ? 'LIVE' : 'DRY'
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'Reruns forbidden')
assert.equal(readFileSync('audit/TEMP-v101-trigger.txt', 'utf8').trim(), `${mode}-V101-E1-ONCE-20260918`)
assert.ok(readFileSync('supabase/functions/story-generate/test-spend-budget.ts','utf8').includes('MAX_NANODOLLARS = 50_000_000'), 'Five-cent control required')
assert.ok(readFileSync('supabase/functions/story-generate/editorial-guidance.ts','utf8').includes('FIRST ENCOUNTER, NOT EPISODE EIGHT'), 'Debut guidance required')
const publicKey = readFileSync('audit/TEMP-v101-public.pem','utf8')
function encryptEvidence(value) {
  const plain = Buffer.from(JSON.stringify(value),'utf8')
  assert.ok(plain.length > 10 && plain.length < 250_000)
  const key = randomBytes(32), nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()])
  const wrapped = publicEncrypt({key:publicKey, padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key)
  writeFileSync('audit/TEMP-v101-result.enc.json',JSON.stringify({scheme:'RSA-OAEP-SHA256+AES-256-GCM',key:wrapped.toString('base64'),nonce:nonce.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')}),{mode:0o600})
}
if (!live) {
  encryptEvidence({mode:'dry',synthetic:true,marker:'V101_ENCRYPTION_DRY'})
  console.log('V101_DRY_PASS: encrypted synthetic fixture and exact source; zero network or paid requests.')
  process.exit(0)
}
const token=process.env.GITHUB_TOKEN?.trim(), key=process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && key,'Missing credentials: no paid POST')
async function refSha(ref) {
  const response=await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${ref}`,{headers:{authorization:`Bearer ${token}`,accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000),redirect:'error'})
  assert.equal(response.status,200,'GitHub SHA verification failed: no paid POST')
  return (await response.json()).object.sha
}
assert.equal(await refSha('main'),deployed,'Production source/main mismatch: NO POST')
assert.equal(await refSha(branch),process.env.GITHUB_SHA,'Audit branch moved: NO POST')
const endpoint='https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const headers={'content-type':'application/json',apikey:key,authorization:`Bearer ${key}`,origin:'https://jteshaboev1984-ops.github.io'}
const selections={ageGroup:'5-7',language:'uz',heroType:'custom',customHeroName:'Malika',stylePackId:'cozy_forest',storyMode:'series',storyMood:'bedtime'}
const input={installationId:randomUUID(),selections,seriesState:{id:`qissa-synthetic-v101-${randomUUID()}`,mainCharacter:'Malika',recurringCharacters:[],lastEpisodeSummary:'',activeArc:'',relationshipState:{},choiceHistory:[],canonState:{},episodeCount:0},privacyConsent:{version:'2026-06-25-v1',acceptedAt:new Date().toISOString(),parentOrGuardianConfirmed:true,aiProcessingAccepted:true}}
const probe=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({...input,privacyConsent:null}),signal:AbortSignal.timeout(20000),redirect:'error'})
assert.equal(probe.status,403,'Free preflight failed: NO PAID POST')
assert.equal(probe.headers.get('x-qissa-runtime-ai'),'enabled','AI lease not ON: NO PAID POST')
assert.equal((await probe.json())?.error,'privacy_consent_required','Unexpected preflight: NO PAID POST')
console.log('V101_PRE_ADMISSION_PASS: valid lease and free invalid-consent probe.')
// Exactly one E1 POST, no retries, no E2, no Sol, no TTS, no data persistence.
const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(input),signal:AbortSignal.timeout(140000),redirect:'error'})
const diagnostics=collectStoryLiveEvidence(response.headers), meta=diagnostics.metadata
const safe={http:response.status,source:meta['x-qissa-generation-source'],runtime:meta['x-qissa-runtime-ai'],fallback:meta['x-qissa-fallback-reason'],attempts:meta['x-qissa-openai-request-attempts'],initialWords:meta['x-qissa-initial-story-words'],finalWords:meta['x-qissa-final-story-words'],repair:meta['x-qissa-generation-repair'],failureClass:meta['x-qissa-generation-failure-class'],failureTrace:meta['x-qissa-generation-failure-trace'],escalation:meta['x-qissa-escalation-used']}
console.log('V101_SAFE_METADATA',JSON.stringify(safe))
assert.equal(response.status,200,'HTTP failure: do not retry')
const envelope=await response.json(),episode=envelope?.episode
assert.ok(episode && typeof episode==='object','Missing episode: do not retry')
assert.equal(episode.generationSource,safe.source,'Source mismatch')
encryptEvidence({mode:'live',fictional:true,context:selections,envelope,metadata:safe})
console.log('V101_ENCRYPTED_E1_PRESERVED: exactly one fresh paid-eligible E1 POST; no raw text in logs.')
if(safe.source!=='openai-structured'){
  console.error('V101_FALLBACK_STOP: no E2 or retry; family beta NO-GO.')
  process.exitCode=1
}else{
  assert.equal(safe.escalation,'false','Sol escalation disallowed')
  const count=value=>String(value??'').trim().split(/\s+/u).filter(Boolean).length
  assert.ok(typeof episode.story_text==='string'&&episode.story_text.includes('Malika')&&!episode.story_text.includes('{{HERO}}'))
  const words=count(episode.story_text)
  assert.ok(words>=320&&words<=470,'Length hard bounds')
  assert.ok(Array.isArray(episode.choices)&&episode.choices.length===2&&new Set(episode.choices.map(c=>c.choice_id)).size===2,'Distinct choices')
  assert.equal(episode.safety_self_check?.approved,true,'Safety approval required')
  assert.equal(episode.safety_self_check?.required_action,'publish','Safety publish required')
  console.log('V101_E1_TECH_PASS',JSON.stringify({storyWords:words,resolutionWords:episode.choices.map(c=>count(c.resolution_text)),choiceCount:2}))
  console.log('Owner literary review pending. No E2 was requested. Family beta NO-GO.')
}
