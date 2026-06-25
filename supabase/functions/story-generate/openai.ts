import type { SafetyEvaluation, StoryCandidate } from './contracts.ts'
import { buildSafetyPrompts, buildStoryPrompts, safetyOutputSchema, storyOutputSchema } from './prompt.ts'
import type { NormalizedStoryContext } from './contracts.ts'

const RESPONSES_URL = 'https://api.openai.com/v1/responses'
const MODERATIONS_URL = 'https://api.openai.com/v1/moderations'

const extractOutputText = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') throw new Error('openai_invalid_response')
  const output = (payload as { output?: unknown }).output
  if (!Array.isArray(output)) throw new Error('openai_missing_output')

  for (const item of output) {
    if (!item || typeof item !== 'object' || (item as { type?: unknown }).type !== 'message') continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (
        part &&
        typeof part === 'object' &&
        (part as { type?: unknown }).type === 'output_text' &&
        typeof (part as { text?: unknown }).text === 'string'
      ) return (part as { text: string }).text
    }
  }
  throw new Error('openai_missing_output_text')
}

const postJson = async (
  url: string,
  apiKey: string,
  body: unknown,
  timeoutMs: number,
): Promise<unknown> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) {
      const details = (await response.text()).trim().slice(0, 300)
      throw new Error(`openai_http_${response.status}${details ? `:${details}` : ''}`)
    }
    return response.json()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('openai_timeout')
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const requestStructured = async <T>(
  apiKey: string,
  model: string,
  schemaName: string,
  schema: unknown,
  system: string,
  user: string,
  timeoutMs: number,
  maxOutputTokens: number,
): Promise<T> => {
  const payload = await postJson(RESPONSES_URL, apiKey, {
    model,
    store: false,
    reasoning: { effort: 'low' },
    max_output_tokens: maxOutputTokens,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        strict: true,
        schema,
      },
    },
  }, timeoutMs)

  const status = payload && typeof payload === 'object' ? (payload as { status?: unknown }).status : null
  if (status === 'failed') {
    const details = payload && typeof payload === 'object'
      ? (payload as { error?: { message?: unknown }; status_details?: { failed?: { error?: { message?: unknown } } } })
      : null
    const message = typeof details?.error?.message === 'string'
      ? details.error.message
      : typeof details?.status_details?.failed?.error?.message === 'string'
        ? details.status_details.failed.error.message
        : 'unknown_failed_status'
    throw new Error(`openai_response_failed:${message.slice(0, 240)}`)
  }
  if (status === 'incomplete') throw new Error('openai_incomplete_response')
  return JSON.parse(extractOutputText(payload)) as T
}

export const generateStoryCandidate = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  retryReason: string,
): Promise<StoryCandidate> => {
  const prompts = buildStoryPrompts(context, retryReason)
  return requestStructured<StoryCandidate>(
    apiKey,
    model,
    'qissa_story_candidate',
    storyOutputSchema,
    prompts.system,
    prompts.user,
    14_000,
    2200,
  )
}

export const evaluateStorySafety = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
): Promise<SafetyEvaluation> => {
  const candidateJson = JSON.stringify(candidate)
  const prompts = buildSafetyPrompts(context, candidateJson)
  return requestStructured<SafetyEvaluation>(
    apiKey,
    model,
    'qissa_safety_evaluation',
    safetyOutputSchema,
    prompts.system,
    prompts.user,
    9_000,
    700,
  )
}

export type ModerationResult = {
  flagged: boolean
  categories: Record<string, boolean>
}

export const moderateStoryText = async (apiKey: string, text: string): Promise<ModerationResult> => {
  const payload = await postJson(MODERATIONS_URL, apiKey, {
    model: 'omni-moderation-latest',
    input: text,
  }, 7_000)

  const results = payload && typeof payload === 'object' ? (payload as { results?: unknown }).results : null
  const first = Array.isArray(results) ? results[0] : null
  if (!first || typeof first !== 'object') throw new Error('moderation_invalid_response')
  const categoriesRaw = (first as { categories?: unknown }).categories
  const categories: Record<string, boolean> = {}
  if (categoriesRaw && typeof categoriesRaw === 'object') {
    for (const [key, value] of Object.entries(categoriesRaw)) categories[key] = value === true
  }
  return { flagged: (first as { flagged?: unknown }).flagged === true, categories }
}
