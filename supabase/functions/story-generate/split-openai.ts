import type { NormalizedStoryContext } from './contracts.ts'
import {
  buildArchitectPrompts,
  buildNarratorPrompts,
  storyBlueprintSchema,
  storyNarrationSchema,
  type StoryBlueprint,
  type StoryNarration,
} from './story-architecture.ts'
import { storyLocalizationSystem } from './localization.ts'
import { storyArchitectEditorialGuidance, storyNarratorEditorialGuidance } from './editorial-guidance.ts'

const RESPONSES_URL = 'https://api.openai.com/v1/responses'

type ReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

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

const postJson = async (apiKey: string, body: unknown, timeoutMs: number, onRequestAttempt?: () => void): Promise<unknown> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const serializedBody = JSON.stringify(body)
    onRequestAttempt?.()
    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: serializedBody,
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
  reasoningEffort: ReasoningEffort = 'none',
  onRequestAttempt?: () => void,
): Promise<T> => {
  const payload = await postJson(apiKey, {
    model,
    store: false,
    reasoning: { effort: reasoningEffort },
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
  }, timeoutMs, onRequestAttempt)

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

export const generateStoryBlueprint = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  timeoutMs = 30_000,
  onRequestAttempt?: () => void,
): Promise<StoryBlueprint> => {
  const prompts = buildArchitectPrompts(context)
  const localizedSystem = `${prompts.system} ${storyLocalizationSystem(context)} ${storyArchitectEditorialGuidance(context)}`
  return requestStructured<StoryBlueprint>(
    apiKey,
    model,
    'qissa_story_blueprint',
    storyBlueprintSchema,
    localizedSystem,
    prompts.user,
    timeoutMs,
    1800,
    'none',
    onRequestAttempt,
  )
}

export const generateStoryNarration = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  blueprint: StoryBlueprint,
  retryReason = '',
  timeoutMs = 30_000,
  onRequestAttempt?: () => void,
): Promise<StoryNarration> => {
  const prompts = buildNarratorPrompts(context, blueprint, retryReason)
  const localizedSystem = `${prompts.system} ${storyLocalizationSystem(context)} ${storyNarratorEditorialGuidance(context)}`
  return requestStructured<StoryNarration>(
    apiKey,
    model,
    'qissa_story_narration',
    storyNarrationSchema,
    localizedSystem,
    prompts.user,
    timeoutMs,
    3200,
    'none',
    onRequestAttempt,
  )
}
