import { randomBytes, randomUUID } from 'node:crypto'
import { applyChoiceToSeriesState, applyEpisodeToSeriesState, createInitialSeriesState } from '../src/lib/memoryAgent.ts'

// Resume ONE existing E1. NEVER regenerate E1, retry E2 or use service-role credentials.
const EXPECTED_SHA = '1f59ef09128122ec0ccd430566a8a516be925fbf'
const ORIGINAL_JOB_ID = 104751515156
const ROOT = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1'
const preflightOnly = process.env.QISSA_PREFLIGHT_ONLY === 'true'
const KEY = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
const LOG_TOKEN = process.env.GH_READ_TOKEN?.trim()
const assert = (condition, message) => { if (!condition) throw new Error(message) }
assert(process.env.QISSA_AUDIT_BASE_SHA === EXPECTED_SHA, 'Unexpected deployment SHA')
assert(LOG_TOKEN, 'Missing read-only GitHub log token')
assert(preflightOnly || KEY, 'Missing public Supabase key')
const wc = text => typeof text === 'string' ? text.trim().split(/\s+/u).filter(Boolean).length : 0
const selections = { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' }
const prefs = { textSize: 'medium', fontMode: 'standard', lineSpacing: 'relaxed', theme: 'warm', showTextWithAudio: true, audioOnlyNightMode: true, voicePresetId: 'neutral_storyteller', defaultPlaybackMode: 'read' }
const consent = { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true }

async function loadRealE1() {
  const url = `https://api.github.com/repos/jteshaboev1984-ops/qissa_app/actions/jobs/${ORIGINAL_JOB_ID}/logs`
  const response = await fetch(url, { headers: { authorization: `Bearer ${LOG_TOKEN}`, accept: 'application/vnd.github+json' } })
  assert(response.ok, `Cannot retrieve genuine E1 evidence: ${response.status}`)
  const log = await response.text()
  const findRecord = marker => {
    const line = log.split(/\r?\n/u).find(row => row.includes(marker))
    assert(line, `Missing original E1 evidence ${marker}`)
    return JSON.parse(line.slice(line.indexOf(marker) + marker.length).trim())
  }
  const meta = findRecord('RESULT E1 branch=a: ')
  assert(meta['x-qissa-generation-source'] === 'openai-structured' && meta['x-qissa-escalation-used'] === 'false', 'Original E1 source mismatch')
  const record = findRecord('STORY E1 branch=a: ')
  assert(record.title === 'Tikan uchun quvnoq qo‘shiq' && wc(record.story_text) === 357, 'Original E1 signature mismatch')
  assert(record.story_text.includes('Malika') && !record.story_text.includes('{{HERO}}'), 'E1 hero marker mismatch')
  assert(record.choices?.length === 2 && record.choices[0].choice_id === 'choice_song_circle' && record.choices[1].choice_id === 'choice_song_echo', 'Original choice IDs changed')
  assert(record.choices.every(choice => choice.resolution_text?.trim()), 'E1 choice bridge missing')
  assert(record.state_patch && typeof record.state_patch === 'object', 'E1 patch missing')
  console.log(`VERIFIED prior E1 job ${ORIGINAL_JOB_ID}: 357 words, two genuine choices, original source`)
  // Only the persistence envelope is reconstructed: prior run verified safety approved
  // but logged only child-visible title, text, choices and exact state_patch.
  return { episode_id: 'ep-1-cozy_forest', title: record.title, story_text: record.story_text,
    choices: record.choices, state_patch: record.state_patch, generationSource: 'openai-structured',
    safety_self_check: { approved: true } }
}
const e1 = await loadRealE1()
if (preflightOnly) { console.log('PROVIDER-FREE E1 LOG RESTORATION PASS; ZERO STORY REQUESTS'); process.exit(0) }
const headers = { 'content-type': 'application/json', apikey: KEY, authorization: `Bearer ${KEY}`, origin: 'https://jteshaboev1984-ops.github.io' }
let storyRequests = 0
const branches = ['a','b'].map((label,i) => {
  const installationId = randomUUID()
  return { label, i, installationId, installationAuth: randomBytes(32).toString('hex'), initial: { ...createInitialSeriesState(selections), childProfileId: installationId }, cleanupArmed: false }
})
assert(branches[0].initial.id !== branches[1].initial.id && branches[0].initial.sessionId !== branches[1].initial.sessionId, 'Branch ID collision')

async function post(slug, data, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${ROOT}/${slug}`, { method: 'POST', headers, body: JSON.stringify(data), signal: controller.signal })
    const raw = await response.text()
    let body
    try { body = JSON.parse(raw) } catch { throw new Error(`${slug}: non-JSON response`) }
    assert(response.ok, `${slug}: HTTP ${response.status} ${String(body?.error || 'unknown')}`)
    const metadata = {}
    for (const name of ['x-qissa-generation-source','x-qissa-fallback-reason','x-qissa-runtime-ai','x-qissa-architect-model','x-qissa-narrator-model-used','x-qissa-escalation-used','x-qissa-provider-calls','x-qissa-initial-story-words','x-qissa-final-story-words','x-qissa-generation-repair','x-qissa-story-pipeline']) metadata[name] = response.headers.get(name)
    return { body, metadata }
  } finally { clearTimeout(timer) }
}
const state = (branch, action, extra = {}) => post('story-state', { action, installationId: branch.installationId, installationAuth: branch.installationAuth, ...extra }, 35_000)

async function prepare(branch) {
  const episode = { ...e1, series_id: branch.initial.id }
  assert(episode.story_text === e1.story_text && JSON.stringify(episode.choices) === JSON.stringify(e1.choices), 'Shared E1 copy mutated')
  const afterE1 = applyEpisodeToSeriesState(branch.initial, episode)
  branch.cleanupArmed = true
  assert((await state(branch,'sync_generated',{ selections, seriesState: afterE1, episode, readerPreferences: prefs, privacyConsent: consent })).body.ok === true, `E1 sync failed ${branch.label}`)
  const choice = episode.choices[branch.i]
  const afterChoice = applyChoiceToSeriesState(afterE1, episode, choice)
  assert(afterChoice.choiceHistory.length === 1 && afterChoice.choiceHistory[0].choice_id === choice.choice_id, 'Selected-only memory violated')
  assert((await state(branch,'confirm_choice',{ seriesState: afterChoice, episodeId: episode.episode_id, choiceId: choice.choice_id })).body.ok === true, `Choice sync failed ${branch.label}`)
  const loaded = (await state(branch,'load_current')).body.snapshot
  assert(loaded?.seriesState?.choiceHistory?.length === 1 && loaded.seriesState.choiceHistory[0].choice_id === choice.choice_id, `Choice reload failed ${branch.label}`)
  assert(loaded.seriesState.mainCharacter === 'Malika' && loaded.seriesState.choiceHistory[0].resolution_text === choice.resolution_text, `Canon/bridge mismatch ${branch.label}`)
  branch.afterChoice = afterChoice
  branch.choice = choice
  console.log(`PREPARED ${branch.label}: real choice_id=${choice.choice_id}; independent persistence PASS`)
}

async function finish(branch) {
  storyRequests++
  assert(storyRequests <= 2, 'HARD STOP: only two E2 requests permitted')
  console.log(`REQUEST E2 ${storyRequests}/2 start branch ${branch.label}`)
  const result = await post('story-generate', { installationId: branch.installationId, selections, seriesState: branch.afterChoice, privacyConsent: consent }, 145_000)
  console.log(`E2 ${branch.label} metadata ${JSON.stringify(result.metadata)}`)
  assert(result.metadata['x-qissa-generation-source'] === 'openai-structured', `E2 ${branch.label} fallback; no retry`)
  assert(result.metadata['x-qissa-escalation-used'] !== 'true', `E2 ${branch.label} escalation unexpected`)
  const ep = result.body?.episode
  assert(ep?.safety_self_check?.approved === true && ep.episode_id === 'ep-2-cozy_forest', `Invalid E2 ${branch.label}`)
  assert(ep.series_id === branch.afterChoice.id && Array.isArray(ep.choices) && ep.choices.length === 0, `Wrong branch or choices ${branch.label}`)
  assert(ep.story_text?.includes('Malika') && !ep.story_text.includes('{{HERO}}') && wc(ep.story_text) >= 355, `Identity or length failed ${branch.label}`)
  console.log(`STORY E2 ${branch.label}: ${JSON.stringify({ title: ep.title, story_text: ep.story_text, state_patch: ep.state_patch, words: wc(ep.story_text) })}`)
  const afterE2 = applyEpisodeToSeriesState(branch.afterChoice, ep)
  assert(afterE2.choiceHistory.length === 1 && afterE2.choiceHistory[0].choice_id === branch.choice.choice_id, `E2 history contamination ${branch.label}`)
  assert((await state(branch,'sync_generated',{ selections, seriesState: afterE2, episode: ep, readerPreferences: prefs, privacyConsent: consent })).body.ok === true, `E2 persistence failed ${branch.label}`)
  const loaded = (await state(branch,'load_current')).body.snapshot
  assert(loaded?.episode?.story_text === ep.story_text && loaded.seriesState?.choiceHistory?.length === 1 && loaded.seriesState.choiceHistory[0].choice_id === branch.choice.choice_id, `E2 reload failed ${branch.label}`)
  branch.e2 = ep
  console.log(`PASS branch ${branch.label}: E2 persisted and reloaded`)
}

let failed = false
try {
  console.log(`CONTINUATION ONLY SHA=${EXPECTED_SHA}; synthetic installs ${branches.map(b => `${b.label}:${b.installationId}`).join(' ')}`)
  for (const branch of branches) await prepare(branch)
  const results = await Promise.allSettled(branches.map(finish))
  for (let i=0; i<results.length; i++) if (results[i].status === 'rejected') {
    failed = true
    console.error(`FAIL E2 ${branches[i].label}: ${results[i].reason?.message || 'unknown'}`)
  }
  if (!failed) {
    assert(branches[0].e2.story_text !== branches[1].e2.story_text, 'Branch continuations identical')
    console.log(`TECHNICAL PASS: original single E1 reused, exactly ${storyRequests}/2 E2 requests`)
  }
} catch (err) { failed = true; console.error(`ACCEPTANCE FAIL: ${err?.message || 'unknown'}`) }
finally {
  for (const branch of branches) if (branch.cleanupArmed) {
    try {
      const deletion = (await state(branch,'delete_profile_data')).body
      assert(deletion?.ok === true && deletion.deleted === true, `Deletion failed ${branch.label}`)
      assert((await state(branch,'load_current')).body.snapshot === null, `Residual snapshot ${branch.label}`)
      console.log(`CLEANUP PASS ${branch.label}: profile + credential deleted; snapshot null`)
    } catch (err) { failed = true; console.error(`CLEANUP FAIL ${branch.label}: ${err?.message || 'unknown'}`) }
  }
  console.log(`FINAL remaining E2 calls=${storyRequests}/2 ${failed ? 'FAIL' : 'TECHNICAL_PASS'}; operator must verify AI OFF`)
  if (failed) process.exitCode = 1
}
