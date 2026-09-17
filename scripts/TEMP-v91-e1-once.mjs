import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Historical audit artefact. Exactly one synthetic HTTP POST in live mode.
// Do NOT rerun paid workflow; remove this runner, workflow, and trigger after evidence.
const branch = 'audit/v91-e1-once-20260917'
const functionalSha = 'a20eb123322fb5fa3f711fd37b86adc4e080395f'
const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const live = process.env.QISSA_LIVE === '1'
const marker = readFileSync('audit/TEMP-v91-e1-trigger.txt', 'utf8').trim()
const wordCount = value => String(value ?? '').trim().split(/\s+/u).filter(Boolean).length
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'replaying historical workflow is forbidden')
assert.match(process.env.GITHUB_SHA ?? '', /^[0-9a-f]{40}$/u)
assert.equal(marker, live ? 'LIVE-V91-E1-ONCE-20260917' : 'DRY-V91-E1-ONCE-20260917')
assert.match(readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8'), /STORY_REQUEST_BUDGET_MS/)
const payload = {
  installationId: crypto.randomUUID(),
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: `synthetic-v91-${crypto.randomUUID()}`, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
  privacyConsent: { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true },
}
assert.equal(payload.seriesState.episodeCount, 0)
assert.deepEqual(payload.seriesState.choiceHistory, [])
if (!live) {
  console.log('V91_DRY_PREFLIGHT_PASS: 1 synthetic E1 prepared; zero production/model/TTS calls; pinned', functionalSha)
  process.exit(0)
}
const token = process.env.GITHUB_TOKEN?.trim()
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && key, 'Missing GitHub or publishable key: no production request')
const headAbort = new AbortController()
const headTimeout = setTimeout(() => headAbort.abort(), 15000)
let headResponse
try {
  headResponse = await fetch(`https://api.github.com/repos/jteshaboev1984-ops/qissa_app/branches/${encodeURIComponent(branch)}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
    signal: headAbort.signal,
  })
} finally { clearTimeout(headTimeout) }
assert.equal(headResponse.status, 200, 'Cannot verify HEAD; no POST')
assert.equal((await headResponse.json()).commit.sha, process.env.GITHUB_SHA, 'Old audit SHA: no POST')
// A single POST. Aborting this caller cannot guarantee cancellation of upstream billing.
const abort = new AbortController()
const timer = setTimeout(() => abort.abort(), 140000)
let response, raw
try {
  response = await fetch(endpoint, {
    method: 'POST', redirect: 'error',
    headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io' },
    body: JSON.stringify(payload), signal: abort.signal,
  })
  raw = await response.text()
} finally { clearTimeout(timer) }
const names = [
  'x-qissa-generation-source','x-qissa-fallback-reason','x-qissa-runtime-ai',
  'x-qissa-generation-failure-class','x-qissa-generation-failure-trace',
  'x-qissa-blueprint-safety-categories','x-qissa-blueprint-decision-repair',
  'x-qissa-provider-calls','x-qissa-generation-repair','x-qissa-repair-retry-used',
  'x-qissa-escalation-used','x-qissa-narrator-model-used','x-qissa-story-pipeline',
  'x-qissa-initial-story-words','x-qissa-final-story-words',
  'x-qissa-architect-elapsed-ms','x-qissa-architect-timeout-ms',
  'x-qissa-architect-model','x-qissa-narrator-model','x-qissa-escalation-model',
]
const diagnostic = Object.fromEntries(names.map(name => [name,response.headers.get(name)]))
console.log('V91_E1_HTTP', response.status)
console.log('V91_E1_DIAGNOSTICS', JSON.stringify(diagnostic))
console.log('V91_E1_SYNTHETIC_RESPONSE', raw)
assert.equal(response.status, 200, 'HTTP failure: no retry')
assert.equal(diagnostic['x-qissa-story-pipeline'], 'split-v1', 'Wrong pipeline')
assert.equal(diagnostic['x-qissa-generation-source'], 'openai-structured', 'Fallback: no retry')
assert.equal(diagnostic['x-qissa-escalation-used'], 'false', 'Unapproved Sol escalation')
assert.equal(diagnostic['x-qissa-narrator-model-used'], 'gpt-5.6-luna')
assert.ok(['none','template'].includes(diagnostic['x-qissa-blueprint-decision-repair']), 'Decision repair header missing')
const architectElapsed = Number(diagnostic['x-qissa-architect-elapsed-ms'])
const architectCap = Number(diagnostic['x-qissa-architect-timeout-ms'])
assert.ok(Number.isFinite(architectElapsed) && architectElapsed > 0 && Number.isFinite(architectCap) && architectCap > 18000 && architectCap <= 30000, 'Budget metrics invalid')
const episode = JSON.parse(raw)?.episode
assert.ok(episode && episode.generationSource === 'openai-structured', 'Missing AI episode')
assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'Hero identity')
assert.ok(wordCount(episode.story_text) >= 320 && wordCount(episode.story_text) <= 470, 'Story length')
assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2, 'Need two choices')
assert.equal(new Set(episode.choices.map(c => c.choice_id)).size, 2)
assert.equal(episode.safety_self_check?.approved, true)
assert.equal(episode.safety_self_check?.required_action, 'publish')
const events = [['top',episode.state_patch?.last_event],...episode.choices.map((c,i)=>[i===0?'A':'B',c.state_patch?.last_event])]
for (const [label,event] of events) {
  assert.ok(typeof event === 'string' && /[.!?。؟]$/u.test(event.trim()) && event.length <= 300, `${label} invalid completed memory`)
}
for (const choice of episode.choices) {
  assert.ok(choice.text?.trim() && wordCount(choice.resolution_text) >= 25 && wordCount(choice.resolution_text) <= 60, 'Choice resolution invalid')
}
console.log('V91_E1_TECHNICAL_PASS',JSON.stringify({ title:episode.title, storyWords:wordCount(episode.story_text), bridgeWords:episode.choices.map(c=>wordCount(c.resolution_text)), eventLengths:events.map(([,e])=>e.length), architectElapsed, architectCap, decisionRepair:diagnostic['x-qissa-blueprint-decision-repair'], providerCalls:diagnostic['x-qissa-provider-calls'] }))
console.log('EDITORIAL_REVIEW_REQUIRED; E2 and family beta not approved')
