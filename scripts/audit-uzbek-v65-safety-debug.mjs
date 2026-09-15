import { randomUUID } from 'node:crypto'

const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate-audit-debug'
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
if (!key) throw new Error('QISSA_SUPABASE_ANON_KEY missing')

const headers = {
  'content-type': 'application/json',
  apikey: key,
  authorization: `Bearer ${key}`,
  origin: 'https://jteshaboev1984-ops.github.io',
}
const installationId = randomUUID()
const seriesId = `audit-uz-safety-${randomUUID()}`
const selections = {
  ageGroup: '5-7', language: 'uz', heroType: 'girl_hero', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
}
const seriesState = {
  id: seriesId, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0,
}
const privacyConsent = {
  version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true,
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const invoke = async (withConsent) => {
  const response = await fetch(endpoint, {
    method: 'POST', headers,
    body: JSON.stringify({ installationId, selections, seriesState, ...(withConsent ? { privacyConsent } : {}) }),
  })
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch {}
  return { response, text, body }
}

for (let attempt = 1; attempt <= 40; attempt += 1) {
  const probe = await invoke(false)
  if (probe.response.headers.get('x-qissa-runtime-ai') === 'enabled') {
    if (probe.response.status !== 403 || probe.body?.error !== 'privacy_consent_required') throw new Error(`bad readiness: ${probe.response.status} ${probe.text.slice(0,300)}`)
    console.log(`READINESS poll=${attempt}`)
    break
  }
  if (attempt === 40) throw new Error('runtime not enabled')
  await sleep(3000)
}

const result = await invoke(true)
console.log('AUDIT_STATUS', result.response.status)
console.log('AUDIT_SOURCE', result.response.headers.get('x-qissa-generation-source'))
console.log('AUDIT_FAILURE', result.response.headers.get('x-qissa-generation-failure-class'), result.response.headers.get('x-qissa-generation-failure-trace'))
console.log('AUDIT_BODY', JSON.stringify(result.body, null, 2))
if (result.response.status !== 200) throw new Error(`debug endpoint status ${result.response.status}`)
if (result.body?.audit_debug !== true && result.body?.episode?.generationSource !== 'openai-structured') {
  throw new Error('debug endpoint did not return semantic audit or a published provider episode')
}
