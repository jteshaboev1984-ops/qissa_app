import { randomBytes, randomUUID } from 'node:crypto'

const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
if (!key) throw new Error('QISSA_SUPABASE_ANON_KEY is required')

const storyEndpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const stateEndpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-state'
const installationId = randomUUID()
const installationAuth = randomBytes(32).toString('hex')
const seriesId = `v79-live-cont-${randomUUID()}`
const heroName = 'Malika'
const consentVersion = '2026-06-25-v1'
const headers = {
  'content-type': 'application/json',
  apikey: key,
  authorization: `Bearer ${key}`,
  origin: 'https://jteshaboev1984-ops.github.io',
}

const assert = (condition, message) => { if (!condition) throw new Error(message) }
const words = (text) => String(text || '').trim().split(/\s+/u).filter(Boolean).length
const normalize = (text) => String(text || '').toLocaleLowerCase('uz').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const invoke = async (endpoint, payload, label) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 150_000)
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal,
    })
    const text = await response.text()
    let body = null
    try { body = text ? JSON.parse(text) : null } catch {}
    const qissaHeaders = Object.fromEntries(
      [...response.headers.entries()].filter(([name]) => name.toLowerCase().startsWith('x-qissa-')),
    )
    if (!response.ok) throw new Error(`${label} returned ${response.status}: ${text.slice(0, 800)}`)
    return { body, qissaHeaders }
  } finally {
    clearTimeout(timeoutId)
  }
}

const consent = {
  version: consentVersion,
  acceptedAt: new Date().toISOString(),
  parentOrGuardianConfirmed: true,
  aiProcessingAccepted: true,
}
const selections = {
  ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: heroName,
  stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
}
const readerPreferences = {
  textSize: 'medium', fontMode: 'standard', lineSpacing: 'relaxed', theme: 'warm',
  showTextWithAudio: true, audioOnlyNightMode: true,
  voicePresetId: 'neutral_storyteller', defaultPlaybackMode: 'read',
}

// Exact selected branch from live E1 run 35061371574. This avoids paying for a duplicate E1
// while exercising the real production continuation boundary with the exact child-visible bridge.
const chosen = {
  choice_id: 'a',
  text: 'Rangli barglardan kulgili bayroqchalar yasashni taklif qilish',
  effect_summary: 'Malika Quvnoq va Chittakni birga kuldirib, barglardan kulgili bayroqchalar yasashga yordam beradi.',
  resolution_text: 'Malika barglarni turli tomonga egib, kulgili yuzchalarga o‘xshatishni taklif qildi. Quvnoq uzun quloq yasadi, Chittak esa dumaloq ko‘z topdi. Ular birga kulib, eman yonida kulgili bayroqchalar tayyorlashdi.',
  tomorrow_seed: 'O‘rmon do‘stlari yangi bayroqchalar bilan yana bir quvonchli bezak o‘ylab topadi.',
  choice_icon: '🍂',
  state_patch: {
    last_event: 'Malika Quvnoq va Chittak bilan barglardan kulgili bayroqchalar tayyorladi.',
    new_friend: 'Chittak',
    hero_trait: 'boshqalarni birga kuldirib, kelishtira oladi',
    open_arc: 'O‘rmon do‘stlari bilan kichik kechki bayramga tayyorgarlik',
    relationship_updates: {
      quyon_quvnoq: 'Malika bilan birga bezak tayyorladi',
      chittak: 'Malika bilan do‘stona ishladi',
    },
    canon_updates: {
      'forest_event.decorations_started': 'Barglardan kulgili bayroqchalar tayyorlandi',
    },
  },
  value_alignment: ['friendship', 'mutual_help', 'calm_conflict_resolution'],
}

const afterChoice = {
  id: seriesId,
  childProfileId: installationId,
  stylePackId: 'cozy_forest',
  mainCharacter: heroName,
  recurringCharacters: ['Chittak'],
  lastEpisodeSummary: chosen.effect_summary,
  activeArc: chosen.state_patch.open_arc,
  relationshipState: chosen.state_patch.relationship_updates,
  canonState: chosen.state_patch.canon_updates,
  choiceHistory: [{
    episode_id: 'ep-1-cozy_forest',
    choice_id: chosen.choice_id,
    choice_text: chosen.text,
    effect_summary: chosen.effect_summary,
    resolution_text: chosen.resolution_text,
    tomorrow_seed: chosen.tomorrow_seed,
    state_patch: chosen.state_patch,
    selected_at: new Date().toISOString(),
  }],
  episodeCount: 1,
}

let profilePersisted = false
let mainError = null
try {
  const second = await invoke(storyEndpoint, {
    installationId,
    selections,
    seriesState: afterChoice,
    privacyConsent: consent,
  }, 'episode-2')
  const e2 = second.body?.episode
  assert(e2 && typeof e2 === 'object', 'episode-2 missing episode')
  assert(second.qissaHeaders['x-qissa-generation-source'] === 'openai-structured', `episode-2 source=${second.qissaHeaders['x-qissa-generation-source'] || 'missing'}`)
  assert(e2.series_id === seriesId, 'episode-2 series mismatch')
  assert(typeof e2.story_text === 'string' && e2.story_text.includes(heroName), 'episode-2 lost Malika')
  assert(!e2.story_text.includes('{{HERO}}'), 'episode-2 leaked HERO token')
  assert(!/\bqizaloq\b/iu.test(e2.story_text), 'episode-2 duplicated Malika as qizaloq')
  assert(Array.isArray(e2.choices) && e2.choices.length === 0, 'episode-2 must have zero choices')
  assert(e2.safety_self_check?.approved === true, 'episode-2 not safety-approved')
  const resolution = normalize(chosen.resolution_text)
  const e2Text = normalize(e2.story_text)
  assert(!e2Text.includes(resolution), 'episode-2 replays selected resolution verbatim')

  console.log('=== V79 LIVE SELECTED E1 CHOICE ===')
  console.log(JSON.stringify(chosen, null, 2))
  console.log('=== V79 LIVE E2 HEADERS ===')
  console.log(JSON.stringify(second.qissaHeaders, null, 2))
  console.log('=== V79 LIVE E2 META ===')
  console.log(JSON.stringify({ episode_id: e2.episode_id, series_id: e2.series_id, title: e2.title, words: words(e2.story_text), state_patch: e2.state_patch }, null, 2))
  console.log('=== V79 LIVE STORY E2 ===')
  console.log(e2.story_text)

  const syncTwo = await invoke(stateEndpoint, {
    action: 'sync_generated', installationId, installationAuth, selections,
    seriesState: { ...afterChoice, episodeCount: 2 },
    episode: e2, readerPreferences, privacyConsent: consent,
  }, 'sync-e2')
  assert(syncTwo.body?.ok === true, 'episode-2 persistence failed')
  profilePersisted = true

  const loaded = await invoke(stateEndpoint, {
    action: 'load_current', installationId, installationAuth,
  }, 'load-current')
  assert(loaded.body?.snapshot?.seriesState?.id === seriesId, 'load_current series mismatch')
  assert(loaded.body?.snapshot?.seriesState?.mainCharacter === heroName, 'persisted hero is not Malika')
  assert(!JSON.stringify(loaded.body.snapshot.seriesState).includes('{{HERO}}'), 'persisted state leaked HERO token')
  assert(loaded.body?.snapshot?.episode?.episode_id === e2.episode_id, 'reload did not restore episode-2')
  assert(loaded.body?.snapshot?.seriesState?.choiceHistory?.[0]?.resolution_text === chosen.resolution_text, 'selected E1 resolution was not preserved')

  console.log('=== V79 LIVE PERSISTENCE ===')
  console.log(JSON.stringify({
    loaded_episode_id: loaded.body.snapshot.episode.episode_id,
    mainCharacter: loaded.body.snapshot.seriesState.mainCharacter,
    recurringCharacters: loaded.body.snapshot.seriesState.recurringCharacters,
    episodeCount: loaded.body.snapshot.seriesState.episodeCount,
    stored_choice_id: loaded.body.snapshot.seriesState.choiceHistory?.[0]?.choice_id,
  }, null, 2))
  console.log(`PASS v79 Uzbek continuation acceptance · E2 ${words(e2.story_text)} words`)
} catch (error) {
  mainError = error
  throw error
} finally {
  try {
    if (profilePersisted) {
      const deleted = await invoke(stateEndpoint, {
        action: 'delete_profile_data', installationId, installationAuth,
      }, 'cleanup-delete')
      assert(deleted.body?.ok === true && deleted.body?.deleted === true, 'cleanup deletion failed')
      const afterDeletion = await invoke(stateEndpoint, {
        action: 'load_current', installationId, installationAuth,
      }, 'cleanup-load')
      assert(afterDeletion.body?.snapshot === null, 'test data still loads after cleanup')
      console.log('CLEANUP PASS: temporary v79 live profile and credential deleted')
    }
  } catch (cleanupError) {
    console.error(`CLEANUP FAILURE: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`)
    if (!mainError) throw cleanupError
  }
}
