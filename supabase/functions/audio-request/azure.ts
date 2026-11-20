/**
 * Azure Neural TTS adapter for candidate Uzbek narrator voices (QA-gated in DB).
 * Only trusted Edge Functions call this module; the browser never sees the key.
 */
export const AZURE_TTS_MODEL = 'azure-neural-v1'
const AZURE_OUTPUT_FORMAT = 'audio-16khz-128kbitrate-mono-mp3'
const ALLOWED_UZ_AZURE_VOICES = new Set([
  'uz-UZ-MadinaNeural',
  'uz-UZ-SardorNeural',
])

export const isSupportedAzureVoice = (language: string, voice: string): boolean =>
  language === 'uz' && APPROVED_UZ_AZURE_VOICES.has(voice)

export const azureTtsConfigured = (): boolean =>
  Boolean(Deno.env.get('AZURE_SPEECH_KEY')?.trim() && /^[a-z0-9-]+$/.test(Deno.env.get('AZURE_SPEECH_REGION')?.trim() ?? ''))

export const escapeSsmlText = (text: string): string =>
  text.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export const buildAzureSsml = (text: string, voice: string): string => {
  if (!isSupportedAzureVoice('uz', voice)) throw new Error('azure_voice_not_allowed')
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="uz-UZ"><voice name="${voice}">${escapeSsmlText(text)}</voice></speak>`
}

export const synthesizeAzureMp3 = async (text: string, voice: string): Promise<Uint8Array> => {
  const region = Deno.env.get('AZURE_SPEECH_REGION')?.trim() ?? ''
  const key = Deno.env.get('AZURE_SPEECH_KEY')?.trim() ?? ''
  if (!azureTtsConfigured()) throw new Error('azure_not_configured')
  if (!isSupportedAzureVoice('uz', voice)) throw new Error('azure_voice_not_allowed')

  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': AZURE_OUTPUT_FORMAT,
      'User-Agent': 'QISSA-AudioAgent',
    },
    body: buildAzureSsml(text, voice),
    signal: AbortSignal.timeout(30000),
  })

  // Do not log raw story text, provider response bodies, or credentials.
  if (!response.ok) throw new Error(`azure_http_${response.status}`)
  const mime = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (mime && !mime.includes('audio/') && !mime.includes('octet-stream')) {
    throw new Error('azure_unexpected_content_type')
  }
  const audio = new Uint8Array(await response.arrayBuffer())
  if (audio.byteLength === 0) throw new Error('azure_empty_audio')
  if (audio.byteLength > 26214400) throw new Error('azure_audio_too_large')
  return audio
}
