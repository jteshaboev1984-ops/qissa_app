import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { applyChoiceToSeriesState, applyEpisodeToSeriesState, createInitialSeriesState } from '../src/lib/memoryAgent.ts'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { collectStoryLiveEvidence, requireUsableStoryResponse, selectActualStoryChoices } from './story-live-evidence.mjs'

// TEMPORARY: ONE original-E1 E2(A) probe, no database profile creation, no retries, no TTS.
// This is a DIAGNOSTIC, not an uninterrupted UI/end-to-end editorial acceptance.
const ORIGINAL_JOB_ID = 104751515156
const DEPLOYED_STORY_SHA = '1f59ef09128122ec0ccd430566a8a516be925fbf'
const DRY_RUN = process.env.QISSA_DIAGNOSTIC_PREFLIGHT === 'true'
assert.equal(process.env.QISSA_AUDIT_STORY_SHA, DEPLOYED_STORY_SHA, 'Deployed story SHA mismatch')
const githubToken = process.env.GH_READ_TOKEN?.trim()
assert.ok(githubToken, 'Missing read-only log token')
const choicesSelections = {
  ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika',
  stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
}
const logsUrl = `https://api.github.com/repos/jteshaboev1984-ops/qissa_app/actions/jobs/${ORIGINAL_JOB_ID}/logs`
const originalResponse = await fetch(logsUrl, {
  headers: { authorization: `Bearer ${githubToken}`, accept: 'application/vnd.github+json' },
  signal: AbortSignal.timeout(30_000),
})
assert.ok(originalResponse.ok, `Unable to retrieve authentic E1 evidence: HTTP ${originalResponse.status}`)
const originalLog = await originalResponse.text()
const originalRecord = (marker) => {
  const row = originalLog.split(/\r?\n/u).find((line) => line.includes(marker))
  assert.ok(row, `Original E1 log missing ${marker}`)
  return JSON.parse(row.slice(row.indexOf(marker) + marker.length).trim())
}
const originalMeta = originalRecord('RESULT E1 branch=a: ')
assert.equal(originalMeta['x-qissa-generation-source'], 'openai-structured')
assert.equal(originalMeta['x-qissa-escalation-used'], 'false')
const record = originalRecord('STORY E1 branch=a: ')
assert.equal(record.title, 'Tikan uchun quvnoq qo‘shiq')
assert.equal(record.story_text.trim().split(/\s+/u).length, 357)
assert.ok(record.story_text.includes('Malika') && !record.story_text.includes('{{HERO}}'))
const choices = selectActualStoryChoices(record)
assert.deepEqual(choices.map((c) => c.choice_id), ['choice_song_circle', 'choice_song_echo'])
assert.ok(record.state_patch && typeof record.state_patch === 'object')
const base = createInitialSeriesState(choicesSelections)
const e1 = {
  episode_id: 'ep-1-cozy_forest', series_id: base.id,
  title: record.title, story_text: record.story_text,
  choices, state_patch: record.state_patch,
  generationSource: 'openai-structured', safety_self_check: { approved: true },
}
const afterE1 = applyEpisodeToSeriesState(base, e1)
const afterChoice = applyChoiceToSeriesState(afterE1, e1, choices[0])
const context = normalizeStoryRequest({ selections: choicesSelections, seriesState: afterChoice })
assert.ok(context, 'E2 request cannot normalize')
assert.equal(context.episodeIndex, 2)
assert.equal(context.choiceHistory.length, 1)
assert.equal(context.choiceHistory[0].choice_id, 'choice_song_circle')
assert.equal(context.choiceHistory[0].resolution_text.includes('{{HERO}}'), true, 'Model memory must tokenize synthetic hero')
console.log(`PREFLIGHT PASS: original E1 job=${ORIGINAL_JOB_ID}; 357 words; E2 choice=${choices[0].choice_id}; no profile created`)
if (DRY_RUN) {
  console.log('PREFLIGHT ONLY: zero story-generate requests, zero provider calls')
  process.exit(0)
}
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(key, 'Missing existing GitHub public API key secret')
const consent = {
  version: '2026-06-25-v1', acceptedAt: new Date().toISOString(),
  parentOrGuardianConfirmed: true, aiProcessingAccepted: true,
}
const installationId = randomUUID()
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 145_000)
let requestStarted = false
try {
  console.log('ADMISSION: one (1) E2(A) request only; no retry, no new E1; do not log credentials')
  requestStarted = true
  const response = await fetch('https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: key, authorization: `Bearer ${key}`,
      origin: 'https://jteshaboev1984-ops.github.io',
    },
    body: JSON.stringify({ installationId, selections: choicesSelections, seriesState: afterChoice, privacyConsent: consent }),
    signal: controller.signal,
  })
  const evidence = collectStoryLiveEvidence(response.headers)
  // CRITICAL: metadata must be logged even if the story is a fallback or HTTP failure.
  console.log(`E2_DIAGNOSTICS ${JSON.stringify({ httpStatus: response.status, ...evidence })}`)
  assert.ok(response.ok, `story-generate HTTP ${response.status}`)
  const data = await response.json()
  requireUsableStoryResponse(evidence)
  const ep = data?.episode
  assert.ok(ep?.safety_self_check?.approved === true, 'E2 safety approval missing')
  assert.equal(ep.episode_id, 'ep-2-cozy_forest')
  assert.equal(ep.series_id, afterChoice.id)
  assert.deepEqual(ep.choices, [], 'E2 must have zero choices')
  assert.ok(ep.story_text?.includes('Malika') && !ep.story_text.includes('{{HERO}}'), 'Hero identity failure')
  console.log(`SUCCESS E2_A ${JSON.stringify({ title: ep.title, story_text: ep.story_text, state_patch: ep.state_patch, words: ep.story_text.trim().split(/\s+/u).length })}`)
} finally {
  clearTimeout(timer)
  console.log(`PROBE FINISHED: story-request-started=${requestStarted}; no story-state profiles created; operator must verify runtime OFF`)
}
