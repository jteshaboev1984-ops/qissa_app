import assert from 'node:assert/strict'
import { randomBytes, randomUUID, createCipheriv, publicEncrypt, constants } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { collectStoryLiveEvidence } from './story-live-evidence.mjs'

// Disposable one-E1 owner-review harness. No raw stories, session identifiers,
// credentials or child data may enter logs, code, or public artifacts.
const REPOSITORY = 'jteshaboev1984-ops/qissa_app'
const BRANCH = 'audit/v100-single-e1-owner-review-20260918'
const DEPLOYED_SOURCE = '91b469a6ed7a1ca50cecb6a89fef2f2ef437895c'
const live = process.env.QISSA_LIVE === '1'
const mode = live ? 'LIVE' : 'DRY'
const publicKey = readFileSync('audit/TEMP-v100-public.pem', 'utf8')
assert.equal(process.env.GITHUB_REF, `refs/heads/${BRANCH}`, 'Wrong audit branch')
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'No rerun is authorized')
assert.match(process.env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/u)
assert.equal(readFileSync('audit/TEMP-v100-trigger.txt', 'utf8').trim(), `${mode}-V100-E1-ONCE-20260918`, 'Unexpected trigger')
assert.ok(readFileSync('supabase/functions/story-generate/test-spend-budget.ts', 'utf8').includes('MAX_NANODOLLARS = 50_000_000'), 'Five-cent guard absent')

function encryptEvidence(evidence) {
  const plain = Buffer.from(JSON.stringify(evidence), 'utf8')
  assert.ok(plain.length > 10 && plain.length < 250000, 'Unexpected evidence size')
  const key = randomBytes(32)
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
  const wrappedKey = publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key)
  const packet = {
    scheme: 'RSA-OAEP-SHA256+AES-256-GCM',
    key: wrappedKey.toString('base64'),
    nonce: nonce.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: encrypted.toString('base64'),
  }
  writeFileSync('audit/TEMP-v100-result.enc.json', JSON.stringify(packet), { mode: 0o600 })
}

if (!live) {
  encryptEvidence({ mode: 'dry', marker: 'QISSA_V100_ENCRYPTED_ARTIFACT_ROUNDTRIP', fictional: true })
  console.log('V100_E1_DRY_PASS: encrypted fixture created; zero Story/OpenAI requests; correct five-cent guard source.')
  process.exit(0)
}

const token = process.env.GITHUB_TOKEN?.trim()
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && key, 'Missing GitHub or publishable credentials: no paid POST')
const githubSha = async branch => {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/git/ref/heads/${branch}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(15000), redirect: 'error',
  })
  assert.equal(response.status, 200, 'Failed to verify GitHub branch; no paid POST')
  return (await response.json()).object.sha
}
assert.equal(await githubSha('main'), DEPLOYED_SOURCE, 'Main moved: no paid POST')
assert.equal(await githubSha(BRANCH), process.env.GITHUB_SHA, 'Audit branch moved: no paid POST')

const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const headers = { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io' }
const selections = { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' }
const input = {
  installationId: randomUUID(), selections,
  seriesState: { id: `qissa-synthetic-v100-${randomUUID()}`, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
  privacyConsent: { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true },
}
// Intentionally invalid consent probes current runtime state without claiming any provider work.
const probe = await fetch(endpoint, {
  method: 'POST', headers, body: JSON.stringify({ ...input, privacyConsent: null }),
  signal: AbortSignal.timeout(20000), redirect: 'error',
})
assert.equal(probe.status, 403, 'Free pre-admission consent probe failed: no paid POST')
assert.equal(probe.headers.get('x-qissa-runtime-ai'), 'enabled', 'Runtime not enabled: no paid POST')
const probeBody = await probe.json()
assert.equal(probeBody?.error, 'privacy_consent_required', 'Unexpected free consent probe: no paid POST')
console.log('V100_E1_PRE_ADMISSION_PASS: source-pinned runner, valid operator runtime, invalid-consent free probe.')

// Exactly ONE provider-eligible E1 POST, without automatic retry, E2, TTS or Sol.
const response = await fetch(endpoint, {
  method: 'POST', headers, body: JSON.stringify(input),
  signal: AbortSignal.timeout(140000), redirect: 'error',
})
const diagnostics = collectStoryLiveEvidence(response.headers)
const meta = diagnostics.metadata
const safeMetadata = {
  http: response.status,
  source: meta['x-qissa-generation-source'],
  runtime: meta['x-qissa-runtime-ai'],
  fallback: meta['x-qissa-fallback-reason'],
  attempts: meta['x-qissa-openai-request-attempts'],
  initialWords: meta['x-qissa-initial-story-words'],
  finalWords: meta['x-qissa-final-story-words'],
  repair: meta['x-qissa-generation-repair'],
  failureClass: meta['x-qissa-generation-failure-class'],
  failureTrace: meta['x-qissa-generation-failure-trace'],
  escalation: meta['x-qissa-escalation-used'],
}
console.log('V100_E1_SAFE_METADATA', JSON.stringify(safeMetadata))
assert.equal(response.status, 200, 'Unexpected E1 HTTP status; no retry')
const envelope = await response.json()
const episode = envelope?.episode
assert.ok(episode && typeof episode === 'object', 'No episode: no retry')
assert.equal(episode.generationSource, safeMetadata.source, 'Generation-source mismatch')
encryptEvidence({ mode: 'live', fictional: true, context: selections, envelope, metadata: safeMetadata })
console.log('V100_E1_ENCRYPTED_EVIDENCE_CREATED: full output preserved without publishing text. Exactly one E1 POST, no E2.')
if (safeMetadata.source !== 'openai-structured') {
  console.error('V100_E1_FALLBACK_STOP: do not spend on E2 or retry. Owner review not available for a model-authored E1.')
  process.exitCode = 1
} else {
  assert.equal(safeMetadata.escalation, 'false', 'Unapproved model escalation')
  assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'Incorrect hero restoration')
  const count = value => String(value ?? '').trim().split(/\s+/u).filter(Boolean).length
  const storyWords = count(episode.story_text)
  assert.ok(storyWords >= 320 && storyWords <= 470, 'E1 word hard range')
  assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2, 'E1 must have two choices')
  assert.equal(new Set(episode.choices.map(choice => choice.choice_id)).size, 2, 'E1 choice IDs must be distinct')
  assert.equal(episode.safety_self_check?.approved, true, 'E1 safety must approve')
  assert.equal(episode.safety_self_check?.required_action, 'publish', 'E1 safety publish contract')
  console.log('V100_E1_TECH_PASS', JSON.stringify({ storyWords, resolutionWords: episode.choices.map(choice => count(choice.resolution_text)), choiceCount: episode.choices.length }))
  console.log('Editorial approval and both real E2 branches remain separate requirements. Family beta NO-GO.')
}
