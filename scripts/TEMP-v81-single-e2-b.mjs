import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { applyChoiceToSeriesState, applyEpisodeToSeriesState, createInitialSeriesState } from '../src/lib/memoryAgent.ts'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { collectStoryLiveEvidence, requireUsableStoryResponse, selectActualStoryChoices } from './story-live-evidence.mjs'

// TEMP one-time B-only probe: the SAME genuine E1 as A; no E1 regeneration or retries.
const EXPECTED_SHA = '1f59ef09128122ec0ccd430566a8a516be925fbf'
assert.equal(process.env.QISSA_AUDIT_STORY_SHA, EXPECTED_SHA, 'Deployment SHA mismatch')
const DRY_RUN = process.env.QISSA_DIAGNOSTIC_PREFLIGHT === 'true'
const gh = process.env.GH_READ_TOKEN?.trim()
assert.ok(gh, 'Missing GitHub log token')
const selections = { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' }
const response = await fetch('https://api.github.com/repos/jteshaboev1984-ops/qissa_app/actions/jobs/104751515156/logs', {
  headers: { authorization: `Bearer ${gh}`, accept: 'application/vnd.github+json' },
  signal: AbortSignal.timeout(30_000),
})
assert.ok(response.ok, `Genuine E1 evidence missing HTTP ${response.status}`)
const log = await response.text()
const find = (marker) => {
  const row = log.split(/\r?\n/u).find((line) => line.includes(marker))
  assert.ok(row, `Missing original E1 marker ${marker}`)
  return JSON.parse(row.slice(row.indexOf(marker) + marker.length).trim())
}
const source = find('RESULT E1 branch=a: ')
assert.equal(source['x-qissa-generation-source'], 'openai-structured')
assert.equal(source['x-qissa-escalation-used'], 'false')
const record = find('STORY E1 branch=a: ')
assert.equal(record.title, 'Tikan uchun quvnoq qo‘shiq')
assert.equal(record.story_text.trim().split(/\s+/u).length, 357)
const choices = selectActualStoryChoices(record)
assert.deepEqual(choices.map((choice) => choice.choice_id), ['choice_song_circle', 'choice_song_echo'])
assert.ok(record.state_patch && typeof record.state_patch === 'object')
const base = createInitialSeriesState(selections)
const e1 = { episode_id: 'ep-1-cozy_forest', series_id: base.id, title: record.title, story_text: record.story_text,
  choices, state_patch: record.state_patch, generationSource: 'openai-structured', safety_self_check: { approved: true } }
const afterE1 = applyEpisodeToSeriesState(base, e1)
const selected = choices[1]
const afterChoice = applyChoiceToSeriesState(afterE1, e1, selected)
const context = normalizeStoryRequest({ selections, seriesState: afterChoice })
assert.ok(context && context.episodeIndex === 2 && context.choiceHistory.length === 1)
assert.equal(context.choiceHistory[0].choice_id, 'choice_song_echo')
assert.ok(context.choiceHistory[0].resolution_text.includes('{{HERO}}'))
assert.equal(afterChoice.choiceHistory[0].resolution_text, selected.resolution_text)
console.log('PREFLIGHT B PASS: original E1 357 words, selected choice_song_echo, selected-only state, no profile')
if (DRY_RUN) {
  console.log('PREFLIGHT B ONLY: zero provider calls')
  process.exit(0)
}
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(key, 'Missing existing public key')
const consent = { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true }
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 145_000)
try {
  console.log('ADMISSION B: exactly ONE E2(B) request, no retries, no E1, no TTS')
  const res = await fetch('https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate', {
    method: 'POST', headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io' },
    body: JSON.stringify({ installationId: randomUUID(), selections, seriesState: afterChoice, privacyConsent: consent }),
    signal: controller.signal,
  })
  const evidence = collectStoryLiveEvidence(res.headers)
  console.log(`E2_B_DIAGNOSTICS ${JSON.stringify({ httpStatus: res.status, ...evidence })}`)
  assert.ok(res.ok, `E2 B HTTP ${res.status}`)
  const payload = await res.json()
  requireUsableStoryResponse(evidence)
  const ep = payload?.episode
  assert.ok(ep?.safety_self_check?.approved === true)
  assert.equal(ep.episode_id, 'ep-2-cozy_forest')
  assert.equal(ep.series_id, afterChoice.id)
  assert.deepEqual(ep.choices, [])
  assert.ok(ep.story_text?.includes('Malika') && !ep.story_text.includes('{{HERO}}'))
  console.log(`SUCCESS E2_B ${JSON.stringify({ title: ep.title, story_text: ep.story_text, state_patch: ep.state_patch, words: ep.story_text.trim().split(/\s+/u).length })}`)
} finally {
  clearTimeout(timer)
  console.log('B PROBE FINISHED: no profiles created; operator must verify AI OFF')
}
