import { randomUUID } from 'node:crypto'

const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate-audit-debug'
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
if (!key) throw new Error('QISSA_SUPABASE_ANON_KEY missing')
const installationId = randomUUID()
const seriesId = `audit-uz-e2-safety-${randomUUID()}`
const headers = { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io' }
const selections = { ageGroup: '5-7', language: 'uz', heroType: 'girl_hero', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' }
const selectedChoice = {
  episode_id: 'ep-1-cozy_forest',
  choice_id: 'sekin_izlash',
  choice_text: 'Yaproqlarni sekin ko‘tarib, rangli ipni birga izlash.',
  effect_summary: 'Qizaloq va Momiq shoshilmay izlaydi; ular ipning mayda tugunini topib, bezakni tartibli qilishga yaqinlashadi.',
  resolution_text: 'Malika va Momiq yaproqlarni sekin ko‘tardilar. Ular rangli ipning mayda tugunini topib, uni tartib bilan bog‘ladilar. Momiqning uycha bezagi chiroyli chiqdi, quyoncha esa tugunni ertaga do‘stlariga ko‘rsatishni xohladi.',
  tomorrow_seed: 'Momiq ipdagi chiroyli tugunni keyingi kuni do‘stlariga ko‘rsatishni xohlaydi.',
  state_patch: {
    last_event: 'Qizaloq Momiq bilan yaproqlar orasidan rangli ipni sekin izlay boshladi.',
    new_friend: 'Momiq', hero_trait: 'ehtiyotkor yordamchi',
    open_arc: 'Momiqning rangli ipi bilan o‘rmon do‘stlari uchun kichik bezaklar yasash',
    relationship_updates: { momik: 'Qizaloq bilan birga rangli ipni izlayapti.' },
    canon_updates: { 'momik.thread_goal': 'Momiq uychasini rangli ip bilan bezamoqchi.' },
  },
  selected_at: new Date().toISOString(),
}
const seriesState = {
  id: seriesId, mainCharacter: 'Malika', recurringCharacters: ['Momiq'],
  lastEpisodeSummary: selectedChoice.effect_summary,
  activeArc: selectedChoice.state_patch.open_arc,
  relationshipState: { momik: 'Qizaloq bilan birga rangli ipni izlayapti.' },
  canonState: { 'momik.thread_goal': 'Momiq uychasini rangli ip bilan bezamoqchi.' },
  choiceHistory: [selectedChoice], episodeCount: 1,
}
const privacyConsent = { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const invoke = async (withConsent) => {
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ installationId, selections, seriesState, ...(withConsent ? { privacyConsent } : {}) }) })
  const text = await response.text(); let body = null; try { body = text ? JSON.parse(text) : null } catch {}
  return { response, text, body }
}
for (let attempt = 1; attempt <= 40; attempt += 1) {
  const probe = await invoke(false)
  if (probe.response.headers.get('x-qissa-runtime-ai') === 'enabled') {
    if (probe.response.status !== 403 || probe.body?.error !== 'privacy_consent_required') throw new Error(`bad readiness ${probe.response.status}`)
    console.log(`READINESS poll=${attempt}`); break
  }
  if (attempt === 40) throw new Error('runtime not enabled')
  await sleep(3000)
}
const result = await invoke(true)
console.log('E2_AUDIT_STATUS', result.response.status)
console.log('E2_AUDIT_SOURCE', result.response.headers.get('x-qissa-generation-source'))
console.log('E2_AUDIT_FAILURE', result.response.headers.get('x-qissa-generation-failure-class'), result.response.headers.get('x-qissa-generation-failure-trace'))
console.log('E2_AUDIT_BODY', JSON.stringify(result.body, null, 2))
if (result.response.status !== 200) throw new Error(`debug endpoint status ${result.response.status}`)
if (result.body?.audit_debug !== true && result.body?.episode?.generationSource !== 'openai-structured') throw new Error('no semantic audit/provider episode')
