import assert from 'node:assert/strict'
import { randomBytes, randomUUID, createCipheriv, publicEncrypt, constants } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

// Disposable OWNER-APPROVED synthetic one-shot. All real prose goes to an RSA+AES
// encrypted one-day artifact or service-role-only short-lived diagnostic capture.
// No private key, child identifiers, plaintext story, credentials or UUIDs in repo/logs.
const repo = 'jteshaboev1984-ops/qissa_app'
const branch = 'audit/v104-one-e1-stage-review-20260919'
const expectedMain = '83b2e60125d0621d1b408f023627b0a9e22a4d63'
const deployedV104 = '6d18f07136085dc26dea7b2c5bf122546269a511'
const live = process.env.QISSA_LIVE === '1'
const mode = live ? 'LIVE' : 'DRY'
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'Re-run is forbidden')
assert.equal(readFileSync('audit/TEMP-v104-trigger.txt', 'utf8').trim(), `${mode}-V104-DIAGNOSTIC-ONCE-20260919`)
assert.ok(readFileSync('supabase/functions/story-generate/test-spend-budget.ts','utf8').includes('MAX_NANODOLLARS = 50_000_000'), 'Estimated five-cent reservation required')
assert.ok(readFileSync('supabase/functions/story-generate/synthetic-diagnostics.ts','utf8').includes(".is('claimed_at', null)"), 'Single-use atomic diagnostic claim required')
assert.ok(readFileSync('supabase/functions/story-generate/split-index.ts','utf8').includes("recordSyntheticStage(diagnostic, 'architect_raw'"), 'Architect raw capture required')
assert.ok(readFileSync('supabase/functions/story-generate/split-index.ts','utf8').includes("recordSyntheticStage(diagnostic, 'narrator_initial'"), 'Narrator raw capture required')
assert.ok(readFileSync('supabase/functions/story-generate/usage.ts','utf8').includes('180'), 'Unexpected runtime lease code')
const publicKey = readFileSync('audit/TEMP-v104-public.pem', 'utf8')
function encrypt(value) {
  const plaintext = Buffer.from(JSON.stringify(value),'utf8')
  assert.ok(plaintext.length > 10 && plaintext.length < 300_000, 'Invalid evidence size')
  const key = randomBytes(32), nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm',key,nonce)
  const ciphertext = Buffer.concat([cipher.update(plaintext),cipher.final()])
  const wrapped = publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key)
  writeFileSync('audit/TEMP-v104-result.enc.json',JSON.stringify({scheme:'RSA-OAEP-SHA256+AES-256-GCM',key:wrapped.toString('base64'),nonce:nonce.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')}),{mode:0o600})
}
if (!live) {
  encrypt({synthetic:true,mode:'dry',marker:'V104_ENCRYPTION_DRY'})
  console.log('V104_DRY_PASS: guarded encrypted fixture, no external HTTP, no provider or DB work.')
  process.exit(0)
}
const token=process.env.GITHUB_TOKEN?.trim(), apiKey=process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && apiKey,'Credentials missing: no paid request')
async function refSha(ref) {
  const response=await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${ref}`,{headers:{authorization:`Bearer ${token}`,accept:'application/vnd.github+json'},signal:AbortSignal.timeout(16000),redirect:'error'})
  assert.equal(response.status,200,'GitHub ref unavailable: no paid request')
  return (await response.json()).object.sha
}
assert.equal(await refSha('main'),expectedMain,'Main moved: no paid request')
assert.equal(await refSha(branch),process.env.GITHUB_SHA,'Audit branch moved: no paid request')
assert.equal(deployedV104,'6d18f07136085dc26dea7b2c5bf122546269a511')
const runId=process.env.GITHUB_RUN_ID
assert.ok(/^\d{8,14}$/u.test(runId??''),'GitHub run ID missing')
const suffix=BigInt(runId).toString(16).padStart(12,'0')
assert.equal(suffix.length,12,'Unexpected run ID width')
// Installation and capture UUIDs are derived from the one-off GitHub run ID.
// They are synthetic identifiers, not real user data or authentication secrets.
const captureId=`00000000-0000-4000-8000-${suffix}`
const installationId=`00000000-0000-4000-9000-${suffix}`
const endpoint='https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const headers={'content-type':'application/json',apikey:apiKey,authorization:`Bearer ${apiKey}`,origin:'https://jteshaboev1984-ops.github.io'}
const selections={ageGroup:'5-7',language:'uz',heroType:'custom',customHeroName:'Malika',stylePackId:'cozy_forest',storyMode:'series',storyMood:'bedtime'}
const payload={installationId,selections,seriesState:{id:`qissa-synthetic-diagnostic-${randomUUID()}`,mainCharacter:'Malika',recurringCharacters:[],lastEpisodeSummary:'',activeArc:'',relationshipState:{},choiceHistory:[],canonState:{},episodeCount:0},privacyConsent:{version:'2026-06-25-v1',acceptedAt:new Date().toISOString(),parentOrGuardianConfirmed:true,aiProcessingAccepted:true}}
const probeHeaders={...headers}
const cutoff=Date.now()+90_000
let probeReady=false
while(Date.now()<cutoff) {
  const probe=await fetch(endpoint,{method:'POST',headers:probeHeaders,body:JSON.stringify({...payload,privacyConsent:null}),signal:AbortSignal.timeout(15000),redirect:'error'})
  if(probe.status===403 && probe.headers.get('x-qissa-runtime-ai')==='enabled') {
    assert.equal(probe.headers.get('x-qissa-architect-model'),'gpt-5.6-luna','Architect must be Luna')
    assert.equal(probe.headers.get('x-qissa-narrator-model'),'gpt-5.6-luna','Narrator must be Luna')
    assert.equal(probe.headers.get('x-qissa-safety-model'),'gpt-5.6-luna','Safety must be Luna')
    assert.equal(probe.headers.get('x-qissa-escalation-model'),'disabled','Sol escalation forbidden')
    assert.equal(probe.headers.get('x-qissa-story-pipeline'),'split-v1','Pipeline mismatch')
    assert.equal((await probe.json())?.error,'privacy_consent_required','Unexpected free preflight')
    probeReady=true
    break
  }
  // OFF during operator setup is normal; never submit a paid-eligible request while OFF.
  if(probe.status!==200 || probe.headers.get('x-qissa-generation-source')!=='safe-fallback') throw new Error('Unexpected no-cost preflight result; no paid request')
  await new Promise(resolve=>setTimeout(resolve,2000))
}
assert.ok(probeReady,'Operator did not authorize a fresh AI lease in time; no paid request')
console.log('V104_PREFLIGHT_PASS: pinned immutable main and branch, active Luna-only lease, free invalid-consent guard.')
// ONE and only ONE provider-eligible client POST. No E2, TTS, Sol, keywords, client retries or family input.
const response=await fetch(endpoint,{method:'POST',headers:{...headers,'x-qissa-synthetic-diagnostic-id':captureId},body:JSON.stringify(payload),signal:AbortSignal.timeout(145000),redirect:'error'})
const metadata={
  http:response.status,
  source:response.headers.get('x-qissa-generation-source'),
  runtime:response.headers.get('x-qissa-runtime-ai'),
  capture:response.headers.get('x-qissa-synthetic-diagnostic'),
  providerAttempts:response.headers.get('x-qissa-openai-request-attempts'),
  initialWords:response.headers.get('x-qissa-initial-story-words'),
  finalWords:response.headers.get('x-qissa-final-story-words'),
  repair:response.headers.get('x-qissa-generation-repair'),
  retry:response.headers.get('x-qissa-repair-retry-used'),
  fallback:response.headers.get('x-qissa-fallback-reason'),
  failureClass:response.headers.get('x-qissa-generation-failure-class'),
  failureTrace:response.headers.get('x-qissa-generation-failure-trace'),
  escalation:response.headers.get('x-qissa-escalation-used'),
  providerIncomplete:response.headers.get('x-qissa-provider-incomplete-reason'),
}
const responseText=await response.text()
let envelope=null
try {envelope=JSON.parse(responseText)} catch { /* no raw output on error */ }
encrypt({mode:'live',fictional:true,metadata,envelope})
console.log('V104_SAFE_METADATA',JSON.stringify(metadata))
console.log('V104_RESPONSE_ENCRYPTED: response present only in short-lived encrypted artifact; diagnostic separately in service-role-only DB.')
assert.equal(response.status,200,'Unexpected HTTP; no retry')
assert.equal(metadata.capture,'stored','Private intermediate diagnostic not saved; no retry')
assert.equal(metadata.source,'openai-structured','Fallback occurred; no retry')
assert.equal(metadata.escalation,'false','Unexpected model escalation; no retry')
const episode=envelope?.episode
assert.ok(episode && typeof episode==='object','Episode missing; no retry')
assert.equal(episode.generationSource,metadata.source)
assert.ok(episode.story_text?.includes('Malika') && !episode.story_text.includes('{{HERO}}'),'Hero token mismatch')
assert.ok(Array.isArray(episode.choices) && episode.choices.length===2,'Expected two choice cards')
assert.equal(episode.safety_self_check?.approved,true,'Safety outcome not approved')
const wordCount=value=>String(value??'').trim().split(/\s+/u).filter(Boolean).length
console.log('V104_E1_TECH_RESULT',JSON.stringify({storyWords:wordCount(episode.story_text),resolutionWords:episode.choices.map(choice=>wordCount(choice.resolution_text)),choiceCount:2}))
console.log('Owner must read actual Uzbek prose. No claim of literary acceptance, no E2 or family beta.')
