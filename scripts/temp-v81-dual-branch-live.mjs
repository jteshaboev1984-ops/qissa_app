import { randomBytes, randomUUID } from 'node:crypto'
import { applyChoiceToSeriesState, applyEpisodeToSeriesState, createInitialSeriesState } from '../src/lib/memoryAgent.ts'

// ONE-TIME SYNTHETIC ACCEPTANCE. No service role, retry, TTS, escalation or lease renewal.
const PROJECT = 'phwakdpxxyncyslvnqht'
const ROOT = `https://${PROJECT}.supabase.co/functions/v1`
const KEY = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
const EXPECTED_SHA = '1f59ef09128122ec0ccd430566a8a516be925fbf'
const SELECTIONS = { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' }
const readerPreferences = { textSize: 'medium', fontMode: 'standard', lineSpacing: 'relaxed', theme: 'warm', showTextWithAudio: true, audioOnlyNightMode: true, voicePresetId: 'neutral_storyteller', defaultPlaybackMode: 'read' }
const assert = (value, message) => { if (!value) throw new Error(message) }
assert(KEY, 'Missing public client key: no story requests initiated')
assert(process.env.QISSA_AUDIT_BASE_SHA === EXPECTED_SHA, 'Unexpected reviewed source SHA; abort before provider')
const consent = { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true }
const headers = { 'content-type': 'application/json', apikey: KEY, authorization: `Bearer ${KEY}`, origin: 'https://jteshaboev1984-ops.github.io' }
const wc = (text) => typeof text === 'string' ? text.trim().split(/\s+/u).filter(Boolean).length : 0
let storyRequests = 0
const branches = ['a', 'b'].map((label) => {
  const installationId = randomUUID()
  return { label, installationId, installationAuth: randomBytes(32).toString('hex'), initial: { ...createInitialSeriesState(SELECTIONS), childProfileId: installationId }, cleanupArmed: false }
})
assert(branches[0].initial.id !== branches[1].initial.id && branches[0].initial.sessionId !== branches[1].initial.sessionId, 'Branches need separate identities')

async function post(path, body, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${ROOT}/${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal })
    const raw = await response.text()
    let payload
    try { payload = JSON.parse(raw) } catch { throw new Error(`${path}: non-JSON response`) }
    assert(response.ok, `${path}: HTTP ${response.status} ${String(payload?.error || 'unknown')}`)
    const metadata = {}
    for (const name of ['x-qissa-generation-source', 'x-qissa-fallback-reason', 'x-qissa-runtime-ai', 'x-qissa-architect-model', 'x-qissa-narrator-model-used', 'x-qissa-escalation-used', 'x-qissa-provider-calls', 'x-qissa-initial-story-words', 'x-qissa-final-story-words', 'x-qissa-generation-repair', 'x-qissa-repair-retry-used', 'x-qissa-story-pipeline']) metadata[name] = response.headers.get(name)
    return { payload, metadata }
  } finally { clearTimeout(timer) }
}

async function story(branch, seriesState, phase) {
  storyRequests += 1
  assert(storyRequests <= 3, 'HARD STOP: more than 3 generation requests')
  console.log(`REQUEST ${storyRequests}/3 start ${phase} branch=${branch.label}`)
  const result = await post('story-generate', { installationId: branch.installationId, selections: SELECTIONS, seriesState, privacyConsent: consent }, 145_000)
  console.log(`RESULT ${phase} branch=${branch.label}: ${JSON.stringify(result.metadata)}`)
  assert(result.metadata['x-qissa-generation-source'] === 'openai-structured', `${phase}: fallback or AI unavailable; do not retry`)
  assert(result.metadata['x-qissa-escalation-used'] !== 'true', `${phase}: escalation is forbidden`)
  const episode = result.payload?.episode
  assert(episode?.safety_self_check?.approved === true, `${phase}: safety not approved`)
  assert(episode.series_id === seriesState.id, `${phase}: series mismatch`)
  assert(episode.episode_id === `ep-${phase === 'E1' ? 1 : 2}-cozy_forest`, `${phase}: episode mismatch`)
  assert(episode.story_text?.includes('Malika') && !episode.story_text.includes('{{HERO}}'), `${phase}: broken hero identity`)
  assert(Array.isArray(episode.choices) && episode.choices.length === (phase === 'E1' ? 2 : 0), `${phase}: wrong choice count`)
  assert(wc(episode.story_text) >= (phase === 'E1' ? 320 : 355), `${phase}: below minimum length`)
  console.log(`STORY ${phase} branch=${branch.label}: ${JSON.stringify({ title: episode.title, story_text: episode.story_text, choices: episode.choices, state_patch: episode.state_patch, words: wc(episode.story_text) })}`)
  return episode
}

async function state(branch, action, extra = {}) {
  return post('story-state', { action, installationId: branch.installationId, installationAuth: branch.installationAuth, ...extra }, 35_000)
}

async function prepareBranch(branch, originalE1) {
  const e1 = { ...originalE1, series_id: branch.initial.id }
  assert(e1.story_text === originalE1.story_text && JSON.stringify(e1.choices) === JSON.stringify(originalE1.choices), 'E1 differs across branches')
  const afterE1 = applyEpisodeToSeriesState(branch.initial, e1)
  branch.cleanupArmed = true
  assert((await state(branch, 'sync_generated', { selections: SELECTIONS, seriesState: afterE1, episode: e1, readerPreferences, privacyConsent: consent })).payload.ok === true, `E1 sync failed ${branch.label}`)
  const choice = e1.choices.find((c) => c.choice_id === branch.label)
  assert(choice && typeof choice.resolution_text === 'string' && choice.resolution_text.trim(), `Missing bridge ${branch.label}`)
  const afterChoice = applyChoiceToSeriesState(afterE1, e1, choice)
  assert(afterChoice.choiceHistory.length === 1 && afterChoice.choiceHistory[0].choice_id === branch.label, `Choice history contamination ${branch.label}`)
  assert((await state(branch, 'confirm_choice', { seriesState: afterChoice, episodeId: e1.episode_id, choiceId: choice.choice_id })).payload.ok === true, `Choice sync failed ${branch.label}`)
  const restored = (await state(branch, 'load_current')).payload.snapshot
  assert(restored?.seriesState?.choiceHistory?.length === 1 && restored.seriesState.choiceHistory[0].choice_id === branch.label, `Wrong restored choice ${branch.label}`)
  assert(restored.seriesState.mainCharacter === 'Malika' && restored.seriesState.choiceHistory[0].resolution_text === choice.resolution_text, `Wrong restored hero/bridge ${branch.label}`)
  branch.afterChoice = afterChoice
  console.log(`PERSIST E1+CHOICE ${branch.label} PASS`)
}

async function finishBranch(branch) {
  const e2 = await story(branch, branch.afterChoice, 'E2')
  const afterE2 = applyEpisodeToSeriesState(branch.afterChoice, e2)
  assert(afterE2.choiceHistory.length === 1 && afterE2.choiceHistory[0].choice_id === branch.label, `E2 cross-branch history ${branch.label}`)
  assert((await state(branch, 'sync_generated', { selections: SELECTIONS, seriesState: afterE2, episode: e2, readerPreferences, privacyConsent: consent })).payload.ok === true, `E2 sync failed ${branch.label}`)
  const loaded = (await state(branch, 'load_current')).payload.snapshot
  assert(loaded?.episode?.story_text === e2.story_text, `E2 reload mismatch ${branch.label}`)
  assert(loaded.seriesState?.choiceHistory?.length === 1 && loaded.seriesState.choiceHistory[0].choice_id === branch.label && loaded.seriesState.mainCharacter === 'Malika', `E2 memory mismatch ${branch.label}`)
  branch.e2 = e2
  console.log(`PASS E2 ${branch.label}: persistence and reload`)
}

let failed = false
try {
  console.log(`START reviewed SHA ${EXPECTED_SHA}; synthetic installations ${branches.map(b => `${b.label}:${b.installationId}`).join(' ')}`)
  const e1 = await story(branches[0], branches[0].initial, 'E1')
  assert(e1.choices.map(c => c.choice_id).sort().join(',') === 'a,b', 'E1 must have choices A and B')
  assert(e1.choices.every(c => typeof c.resolution_text === 'string' && c.resolution_text.trim()), 'E1 missing a visible bridge')
  for (const branch of branches) await prepareBranch(branch, e1)
  const outcomes = await Promise.allSettled(branches.map(finishBranch))
  for (let i = 0; i < outcomes.length; i++) if (outcomes[i].status === 'rejected') {
    failed = true
    console.error(`E2 ${branches[i].label} FAIL: ${outcomes[i].reason?.message || 'unknown'}`)
  }
  if (!failed) {
    assert(branches[0].e2.story_text !== branches[1].e2.story_text, 'Identical continuations')
    console.log(`TECHNICAL PASS: ${storyRequests}/3 story requests; single E1 and distinct A/B E2`)
  }
} catch (error) {
  failed = true
  console.error(`ACCEPTANCE FAIL: ${error?.message || 'unknown'}`)
} finally {
  for (const branch of branches) {
    if (!branch.cleanupArmed) continue
    try {
      const deletion = (await state(branch, 'delete_profile_data')).payload
      assert(deletion?.ok === true, `Delete failed ${branch.label}`)
      const after = (await state(branch, 'load_current')).payload
      assert(after.snapshot === null, `Profile still loads after deletion ${branch.label}`)
      console.log(`CLEANUP PASS ${branch.label}: deletion acknowledged, load_current=null`)
    } catch (error) {
      failed = true
      console.error(`CLEANUP FAIL ${branch.label}: ${error?.message || 'unknown'}`)
    }
  }
  console.log(`FINAL requests=${storyRequests}/3 status=${failed ? 'FAIL' : 'TECHNICAL_PASS'}; operator must verify runtime AI OFF`)
  if (failed) process.exitCode = 1
}
