import type { StoryGenerationInput, StoryGenerationOutput } from '../contracts/agentContracts'
import type { Episode, EpisodeChoice, SafetyResult } from '../types/qissa'

export type StoryProviderMode = 'local' | 'remote'

export interface StoryProviderConfig {
  mode: StoryProviderMode
  endpoint: string | null
  timeoutMs: number
  fallbackToLocal: boolean
}

const DEFAULT_TIMEOUT_MS = 12_000
const MIN_TIMEOUT_MS = 1_000
const MAX_TIMEOUT_MS = 60_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isSafetyResult = (value: unknown): value is SafetyResult => {
  if (!isRecord(value) || !isRecord(value.flags)) return false

  return (
    typeof value.approved === 'boolean' &&
    ['low', 'medium', 'high'].includes(String(value.risk_level)) &&
    ['publish', 'regenerate', 'fallback', 'block'].includes(String(value.required_action))
  )
}

const isEpisodeChoice = (value: unknown): value is EpisodeChoice => {
  if (!isRecord(value) || !isRecord(value.state_patch)) return false

  return (
    typeof value.choice_id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.effect_summary === 'string' &&
    (value.resolution_text === undefined || typeof value.resolution_text === 'string') &&
    (value.tomorrow_seed === undefined || typeof value.tomorrow_seed === 'string') &&
    (value.choice_icon === undefined || typeof value.choice_icon === 'string') &&
    isStringArray(value.value_alignment)
  )
}

const isEpisode = (value: unknown): value is Episode => {
  if (!isRecord(value)) return false

  return (
    typeof value.episode_id === 'string' &&
    typeof value.series_id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.story_text === 'string' &&
    ['one_time', 'series'].includes(String(value.mode)) &&
    ['bedtime', 'kind_adventure'].includes(String(value.mood)) &&
    typeof value.stylePackId === 'string' &&
    Array.isArray(value.choices) &&
    value.choices.every(isEpisodeChoice) &&
    isRecord(value.state_patch) &&
    Array.isArray(value.vocabulary) &&
    typeof value.nextEpisodePreview === 'string' &&
    isSafetyResult(value.safety_self_check)
  )
}

const isStoryGenerationOutput = (value: unknown): value is StoryGenerationOutput =>
  isRecord(value) && isEpisode(value.episode)

const parseTimeout = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS
  return Math.min(Math.max(parsed, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS)
}

export const getStoryProviderConfig = (): StoryProviderConfig => {
  const mode = import.meta.env.VITE_QISSA_STORY_PROVIDER === 'remote' ? 'remote' : 'local'
  const endpoint = import.meta.env.VITE_QISSA_STORY_ENDPOINT?.trim() || null

  return {
    mode,
    endpoint,
    timeoutMs: parseTimeout(import.meta.env.VITE_QISSA_STORY_TIMEOUT_MS),
    fallbackToLocal: import.meta.env.VITE_QISSA_STORY_FALLBACK_TO_LOCAL !== 'false',
  }
}

const readErrorBody = async (response: Response): Promise<string> => {
  try {
    return (await response.text()).trim().slice(0, 240)
  } catch {
    return ''
  }
}

export const generateWithRemoteProvider = async (
  input: StoryGenerationInput,
  config: StoryProviderConfig,
): Promise<StoryGenerationOutput> => {
  if (!config.endpoint) {
    throw new Error('Remote story provider is enabled, but VITE_QISSA_STORY_ENDPOINT is empty.')
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
      credentials: 'omit',
    })

    if (!response.ok) {
      const details = await readErrorBody(response)
      throw new Error(`Remote story provider returned ${response.status}${details ? `: ${details}` : ''}`)
    }

    const payload: unknown = await response.json()
    if (!isStoryGenerationOutput(payload)) {
      throw new Error('Remote story provider returned an invalid episode payload.')
    }

    return payload
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Remote story provider timed out after ${config.timeoutMs} ms.`)
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
