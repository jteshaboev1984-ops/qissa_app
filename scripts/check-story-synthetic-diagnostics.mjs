import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import {
  SYNTHETIC_DIAGNOSTIC_HEADER,
  isDiagnosticUuid,
  isSyntheticDiagnosticContext,
  newSyntheticCapture,
  recordSyntheticStage,
} from '../supabase/functions/story-generate/synthetic-diagnostic-contract.ts'

const index = readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
const diagnostics = readFileSync('supabase/functions/story-generate/synthetic-diagnostics.ts', 'utf8')
const sql = readFileSync('docs/qissa/backend/migrations/20260917_000019_synthetic_story_diagnostic_capture.sql', 'utf8')
const payload = {
  installationId: 'c175693f-28ba-44c6-8268-72bb1985ad62',
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'qissa-synthetic-diagnostic-e331a728-1532-4cba-a726-531490790cbc', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
}
const context = normalizeStoryRequest(payload)
assert.ok(context)
assert.equal(isSyntheticDiagnosticContext(context, payload), true)
assert.equal(isDiagnosticUuid('46db22bb-9bef-45d5-85bb-191a4ca87430'), true)
assert.equal(isDiagnosticUuid('public-test-id'), false)
const realSeries = { ...payload, seriesState: { ...payload.seriesState, id: 'family-actual-story' } }
assert.equal(isSyntheticDiagnosticContext(normalizeStoryRequest(realSeries), realSeries), false, 'family series must never be captured')
for (const changes of [
  { seriesState: { ...payload.seriesState, mainCharacter: 'Actual Child' } },
  { seriesState: { ...payload.seriesState, lastEpisodeSummary: 'Personal memory' } },
  { seriesState: { ...payload.seriesState, episodeCount: 1 } },
  { seriesState: { ...payload.seriesState, recurringCharacters: ['friend'] } },
  { selections: { ...payload.selections, customHeroName: 'Other' } },
]) {
  const rejected = { ...payload, ...changes }
  assert.equal(isSyntheticDiagnosticContext(normalizeStoryRequest(rejected), rejected), false, 'identity or memory change must deny capture')
}
const capture = newSyntheticCapture()
const fakeRejectedStory = { story_text: '{{HERO}} met a shy owl.', choices: [{ text: 'Help the owl' }] }
recordSyntheticStage(capture, 'narrator_initial', fakeRejectedStory)
assert.equal(capture.stages.length, 0, 'unarmed requests must never capture a story')
capture.captureId = '46db22bb-9bef-45d5-85bb-191a4ca87430'
capture.installationId = payload.installationId
recordSyntheticStage(capture, 'narrator_initial', fakeRejectedStory)
fakeRejectedStory.story_text = 'A corrected story.'
recordSyntheticStage(capture, 'repair_first', fakeRejectedStory)
assert.equal(capture.stages[0].data.story_text, '{{HERO}} met a shy owl.')
assert.equal(capture.stages[1].data.story_text, 'A corrected story.')
for (let i = 0; i < 30; i++) recordSyntheticStage(capture, 'repair_retry', { marker: i })
assert.equal(capture.stages.length, 12, 'one request must have bounded snapshots')

for (const required of [
  'const handleStoryRequest = async',
  'newSyntheticCapture()',
  'request.headers.has(SYNTHETIC_DIAGNOSTIC_HEADER)',
  'claimSyntheticDiagnostic(request, context, input, installationId, diagnostic)',
  'synthetic_diagnostic_not_authorized',
  "recordSyntheticStage(diagnostic, 'architect_raw'",
  "recordSyntheticStage(diagnostic, 'architect_validation'",
  "recordSyntheticStage(diagnostic, 'narrator_initial'",
  "recordSyntheticStage(diagnostic, 'repair_first'",
  "recordSyntheticStage(diagnostic, 'repair_retry'",
  "recordSyntheticStage(diagnostic, 'semantic_verdict'",
  'persistSyntheticCapture(diagnostic, response)',
  "headers.set('X-QISSA-Synthetic-Diagnostic', stored ? 'stored' : 'unavailable')",
]) assert.ok(index.includes(required), `Missing production capture path: ${required}`)
assert.ok(index.indexOf('claimSyntheticDiagnostic(request, context, input, installationId, diagnostic)') < index.indexOf('claimStoryGeneration(installationId)'), 'diagnostic guard must precede cost accounting')
assert.ok(index.indexOf('persistSyntheticCapture(diagnostic, response)') > index.lastIndexOf('return json('), 'persist only after response determination')
for (const required of [
  "Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')",
  "if (!captureId || !isDiagnosticUuid(captureId) || !isSyntheticDiagnosticContext(context, input)) return false",
  ".eq('installation_id', installationId)",
  ".is('claimed_at', null)",
  ".is('captured_at', null)",
  ".gt('expires_at', new Date().toISOString())",
  "if (!capture.captureId || !capture.installationId) return false",
  'MAX_PAYLOAD_BYTES = 170_000',
]) assert.ok(diagnostics.includes(required), `Missing backend authorization or bounded persistence: ${required}`)
assert.ok(!/console\.(?:log|warn|error)\s*\(/u.test(diagnostics), 'diagnostic module must not log raw story data')
assert.ok(!index.includes("'X-QISSA-Diagnostic-Story'"), 'child-facing headers must never carry transcript')
for (const expression of [
  /enable row level security/iu,
  /revoke all on table public\.qissa_synthetic_story_diagnostics from public/iu,
  /revoke all on table public\.qissa_synthetic_story_diagnostics from anon/iu,
  /revoke all on table public\.qissa_synthetic_story_diagnostics from authenticated/iu,
  /grant select, insert, update, delete on table public\.qissa_synthetic_story_diagnostics to service_role/iu,
  /expires_at <= created_at \+ interval '2 hours'/iu,
  /payload is null or octet_length\(payload::text\) <= 180000/iu,
]) assert.match(sql, expression)
assert.ok(!/create policy/iu.test(sql), 'no browser-facing read policy may be created')
console.log('Synthetic diagnostic contract PASS: synthetic-only, claimed before provider, immutable snapshots, private short-lived SQL, no raw HTTP/log output; provider calls 0.')
