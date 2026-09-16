import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createInitialSeriesState } from '../src/lib/memoryAgent.ts'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { collectStoryLiveEvidence, requireUsableStoryResponse, selectActualStoryChoices } from './story-live-evidence.mjs'

// ONE synthetic E1 at most. Preflight never contacts story-generate or writes story-state.
const EXACT_STORY_SHA = 'f725f4fb0376b07b10fe5a8dae95bd425f32726e'
assert.equal(process.env.QISSA_EXPECTED_STORY_SHA, EXACT_STORY_SHA, 'Exact deployed source SHA mismatch')
const PREFLIGHT = process.env.QISSA_PREFLIGHT_ONLY === 'true'
assert.ok(PREFLIGHT || process.env.QISSA_RUN_ONE_E1 === 'true', 'Paid mode requires explicit one-shot opt-in')
const selections = {
  ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika',
  stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
}
const installationId = randomUUID()
const initialState = createInitialSeriesState(selections)
const privacyConsent = {
  version: '2026-06-25-v1', acceptedAt: new Date().toISOString(),
  parentOrGuardianConfirmed: true, aiProcessingAccepted: true,
}
const input = { installationId, selections, seriesState: initialState, privacyConsent }
const context = normalizeStoryRequest(input)
assert.ok(context, 'Invalid normalized initial context')
assert.equal(context.episodeIndex, 1)
assert.equal(context.heroName, 'Malika')
assert.equal(context.choiceHistory.length, 0)
assert.equal(initialState.episodeCount, 0)
assert.equal(initialState.id, context.seriesId)
console.log('PREFLIGHT CONTEXT PASS: exact v83 source, UZ 5-7 synthetic Malika, initial E1, no history')
if (PREFLIGHT) {
  const mock = collectStoryLiveEvidence(new Headers({
    'x-qissa-generation-source': 'safe-fallback',
    'x-qissa-fallback-reason': 'generation-or-safety-failed',
    'x-qissa-generation-failure-class': 'validation',
    'x-qissa-generation-failure-trace': 'synthetic-only:validation',
  }))
  assert.deepEqual(mock.diagnosticErrors, [])
  assert.throws(() => requireUsableStoryResponse(mock), /Expected openai-structured/u)
  assert.deepEqual(selectActualStoryChoices({ choices: [{ choice_id: 'a', resolution_text: 'One' }, { choice_id: 'some_dynamic_id', resolution_text: 'Two' }] }).map((c) => c.choice_id), ['a', 'some_dynamic_id'], 'Do not invent constraints on Architect-authored IDs')
  console.log('PREFLIGHT ONLY PASS: zero provider calls, no profile or credential created')
  process.exit(0)
}
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(key, 'Missing existing public client key')
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 145_000)
let attempted = 0
try {
  attempted += 1
  assert.equal(attempted, 1, 'HARD one-story-request budget')
  console.log('START one authorized E1 request; no retry, TTS or escalation')
  const response = await fetch('https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io' },
    body: JSON.stringify(input), signal: controller.signal,
  })
  const evidence = collectStoryLiveEvidence(response.headers)
  // Log allowlisted metadata even for fallback/HTTP failures, before asserting expected source.
  console.log(`E1_DIAGNOSTICS ${JSON.stringify({ httpStatus: response.status, ...evidence })}`)
  assert.ok(response.ok, `E1 HTTP ${response.status}`)
  const payload = await response.json()
  requireUsableStoryResponse(evidence)
  const episode = payload?.episode
  assert.ok(episode && episode.safety_self_check?.approved === true, 'E1 safety approval missing')
  assert.equal(episode.episode_id, 'ep-1-cozy_forest')
  assert.equal(episode.series_id, initialState.id)
  assert.ok(episode.story_text?.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'E1 hero name wrong')
  const choices = selectActualStoryChoices(episode)
  const words = episode.story_text.trim().split(/\s+/u).filter(Boolean).length
  assert.ok(words >= 320 && words <= 470, `Unexpected story word count ${words}`)
  assert.equal(episode.generationSource, 'openai-structured')
  // Fully original, synthetic child-visible response only; no secrets/installationAuth in payload.
  // Avoids reconstructing E1 envelope later. Retain exact source evidence before E2 requests.
  console.log(`E1_FULL_RESPONSE ${JSON.stringify(payload)}`)
  console.log(`E1_PROVENANCE ${JSON.stringify({ syntheticInstallationId: installationId, seriesId: initialState.id, sessionId: initialState.sessionId, title: episode.title, words, choiceIds: choices.map((c) => c.choice_id) })}`)
  console.log('E1 SUCCESS: full original provider JSON retained, no profile created')
} finally {
  clearTimeout(timeout)
  console.log(`FINAL ONE-E1 COUNT=${attempted}; zero story-state writes; operator must read back AI OFF`)
}
