import assert from 'node:assert/strict'
import { randomBytes, randomUUID, createCipheriv, publicEncrypt, constants } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { collectStoryLiveEvidence } from './story-live-evidence.mjs'

// One-use synthetic owner-review only. No private key, story, personal identifiers, credentials in source or logs.
const repo = 'jteshaboev1984-ops/qissa_app'
const branch = 'audit/v103-one-e1-owner-review-20260918'
const deployed = '01acbfb7c7217ea3ff7127ccc8083a4db239f3f5'
const live = process.env.QISSA_LIVE === '1'
const mode = live ? 'LIVE' : 'DRY'
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'Reruns forbidden')
assert.equal(readFileSync('audit/TEMP-v103-trigger.txt', 'utf8').trim(), `${mode}-V103-E1-ONCE-20260918`)
assert.ok(readFileSync('supabase/functions/story-generate/test-spend-budget.ts','utf8').includes('MAX_NANODOLLARS = 50_000_000'), 'Five-cent guard required')
assert.ok(readFileSync('supabase/functions/story-generate/split-openai.ts','utf8').includes('2400,'), 'Architect cap must match reviewed code')
assert.ok(readFileSync('supabase/functions/story-generate/split-index.ts','utf8').includes('X-QISSA-Provider-Incomplete-Reason'), 'Fixed-category diagnostic required')
assert.ok(readFileSync('supabase/functions/story-generate/editorial-guidance.ts','utf8').includes('FIRST-ENCOUNTER NAME POLICY'), 'V103 guidance required')
assert.ok(readFileSync('supabase/functions/story-generate/repair-routing.ts','utf8').includes('storyWords < 300'), 'V103 severe repair required')
const publicKey = readFileSync('audit/TEMP-v103-public.pem','utf8')
function encryptEvidence(value) {
  const plain = Buffer.from(JSON.stringify(value),'utf8')
  assert.ok(plain.length > 10 && plain.length < 250_000, 'Unexpected evidence size')
  const key = randomBytes(32), nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()])
  const wrapped = publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key)
  writeFileSync('audit/TEMP-v103-result.enc.json',JSON.stringify({scheme:'RSA-OAEP-SHA256+AES-256-GCM',key:wrapped.toString('base64'),nonce:nonce.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')}),{mode:0o600})
}
if (!live) {
  encryptEvidence({mode:'dry',synthetic:true,marker:'V103_ENCRYPTION_DRY'})
  console.log('V103_DRY_PASS: encryption fixture, five-cent test guard, guidance; zero provider HTTP.')
  process.exit(0)
}
const token = process.env.GITHUB_TOKEN?.trim(), apiKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && apiKey,'Missing credentials: NO PAID POST')
async function refSha(ref) {
  const r = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${ref}`,{headers:{authorization:`Bearer ${token}`,accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000),redirect:'error'})
  assert.equal(r.status,200,'Could not verify GitHub ref: NO PAID POST')
  return (await r.json()).object.sha
}
assert.equal(await refSha('main'),deployed,'Main changed: NO PAID POST')
assert.equal(await refSha(branch),process.env.GITHUB_SHA,'Audit branch moved: NO PAID POST')
const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const headers = {'content-type':'application/json',apikey:apiKey,authorization:`Bearer ${apiKey}`,origin:'https://jteshaboev1984-ops.github.io'}
const selections={ageGroup:'5-7',language:'uz',heroType:'custom',customHeroName:'Malika',stylePackId:'cozy_forest',storyMode:'series',storyMood:'bedtime'}
// No unapproved premise keywords. Compare only v103 vs previous first-story baseline.
const input={installationId:randomUUID(),selections,seriesState:{id:`qissa-synthetic-v103-${randomUUID()}`,mainCharacter:'Malika',recurringCharacters:[],lastEpisodeSummary:'',activeArc:'',relationshipState:{},choiceHistory:[],canonState:{},episodeCount:0},privacyConsent:{version:'2026-06-25-v1',acceptedAt:new Date().toISOString(),parentOrGuardianConfirmed:true,aiProcessingAccepted:true}}
const probe=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({...input,privacyConsent:null}),signal:AbortSignal.timeout(20000),redirect:'error'})
assert.equal(probe.status,403,'Free invalid-consent preflight failed: NO PAID POST')
assert.equal(probe.headers.get('x-qissa-runtime-ai'),'enabled','AI not enabled: NO PAID POST')
assert.equal((await probe.json())?.error,'privacy_consent_required','Unexpected consent preflight: NO PAID POST')
console.log('V103_PRE_ADMISSION_PASS: exact immutable main/audit refs; free consent probe.')
// ONE paid-eligible request, no client retry or E2. Server five-cent request-local reservation independently controls provider subcalls.
const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(input),signal:AbortSignal.timeout(140000),redirect:'error'})
const diagnostics=collectStoryLiveEvidence(response.headers),meta=diagnostics.metadata
const safe={http:response.status,source:meta['x-qissa-generation-source'],runtime:meta['x-qissa-runtime-ai'],fallback:meta['x-qissa-fallback-reason'],attempts:meta['x-qissa-openai-request-attempts'],incompleteReason:response.headers.get('x-qissa-provider-incomplete-reason'),initialWords:meta['x-qissa-initial-story-words'],finalWords:meta['x-qissa-final-story-words'],repair:meta['x-qissa-generation-repair'],failureClass:meta['x-qissa-generation-failure-class'],failureTrace:meta['x-qissa-generation-failure-trace'],escalation:meta['x-qissa-escalation-used']}
console.log('V103_SAFE_METADATA',JSON.stringify(safe))
assert.equal(response.status,200,'Unexpected HTTP: no retry')
const envelope=await response.json(), episode=envelope?.episode
assert.ok(episode && typeof episode==='object','Missing episode: no retry')
assert.equal(episode.generationSource,safe.source,'Source mismatch')
encryptEvidence({mode:'live',fictional:true,context:selections,envelope,metadata:safe})
console.log('V103_E1_ENCRYPTED: full response retained privately; no raw story in logs or source.')
if(safe.source!=='openai-structured'){
  console.error('V103_FALLBACK_STOP: no repeat or E2; literary outcome unknown; beta NO-GO.')
  process.exitCode=1
}else{
  assert.equal(safe.escalation,'false','Unapproved model escalation')
  const count=v=>String(v??'').trim().split(/\s+/u).filter(Boolean).length
  assert.ok(typeof episode.story_text==='string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'),'Hero restoration')
  const words=count(episode.story_text)
  assert.ok(words>=320 && words<=470,'Story length bounds')
  assert.ok(Array.isArray(episode.choices) && episode.choices.length===2 && new Set(episode.choices.map(c=>c.choice_id)).size===2,'Distinct choice IDs')
  assert.equal(episode.safety_self_check?.approved,true,'Safety approval')
  assert.equal(episode.safety_self_check?.required_action,'publish','Safety publish')
  console.log('V103_E1_TECH_PASS',JSON.stringify({storyWords:words,resolutionWords:episode.choices.map(c=>count(c.resolution_text)),choiceCount:2}))
  console.log('Owner must review FULL prose inline. No E2 or beta GO.')
}
