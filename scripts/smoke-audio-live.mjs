const endpoint = process.env.QISSA_AUDIO_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/audio-request'
const publishableKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()

if (!publishableKey) {
  console.error('QISSA_SUPABASE_ANON_KEY is required for the live audio smoke test.')
  process.exit(1)
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const headers = {
  'content-type': 'application/json',
  apikey: publishableKey,
  authorization: `Bearer ${publishableKey}`,
  origin: 'https://jteshaboev1984-ops.github.io',
}

const invoke = async (payload) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const text = await response.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      throw new Error(`audio-request returned non-JSON content: ${text.slice(0, 240)}`)
    }
    assert(response.ok, `audio-request returned ${response.status}: ${text.slice(0, 300)}`)
    return body
  } finally {
    clearTimeout(timeoutId)
  }
}

const identity = {
  installationId: '00000000-0000-4000-8000-000000005801',
  seriesId: 'smoke-audio-series-58',
  episodeId: 'smoke-audio-episode-58',
}

const first = await invoke({
  action: 'request_audio',
  ...identity,
  voicePresetId: 'neutral_storyteller',
  speed: 1,
})

assert(first?.audioStatus === 'failed', 'inactive voice must not create provider audio')
assert(first?.fallbackUsed === true, 'inactive voice must use device fallback')
assert(first?.fallbackMode === 'device', 'fallback mode must be device')
assert(first?.errorCode === 'provider_voice_not_approved', 'unexpected fallback reason')
assert(first?.requiresAiVoiceDisclosure === false, 'device fallback must not show AI voice disclosure')
assert(first?.audioAssetId === null && first?.audioUrl === null, 'fallback must not expose an audio asset')

const saved = await invoke({
  action: 'save_progress',
  ...identity,
  speed: 1,
  positionSeconds: 12.5,
  completed: false,
})
assert(saved?.ok === true, 'playback progress was not saved')

const repeated = await invoke({
  action: 'request_audio',
  ...identity,
  voicePresetId: 'neutral_storyteller',
  speed: 1,
})
assert(repeated?.errorCode === 'provider_voice_not_approved', 'repeated request changed fallback behavior')
assert(repeated?.audioAssetId === null, 'repeated fallback unexpectedly created an asset')

console.log('Live Audio Agent smoke passed: safe fallback, no provider asset, progress saved.')
