import type { AuthoredStoryPackage, AuthoredStoryProgress } from '../features/authoredStory/types'

const KEY_PREFIX = 'qissa:v1:authoredStoryProgress'

const storageKey = (story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>) =>
  `${KEY_PREFIX}:${story.story_id}:${story.story_version}`

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isProgress = (
  value: unknown,
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
): value is AuthoredStoryProgress => {
  if (!isRecord(value)) return false

  return value.story_id === story.story_id &&
    value.story_version === story.story_version &&
    typeof value.current_part_index === 'number' &&
    Number.isInteger(value.current_part_index) &&
    value.current_part_index >= 0 &&
    isRecord(value.selected_choices) &&
    Array.isArray(value.shown_resolution_decisions) &&
    Array.isArray(value.choice_history) &&
    isRecord(value.memory) &&
    typeof value.completed === 'boolean' &&
    typeof value.updated_at === 'string'
}

const load = (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
): AuthoredStoryProgress | null => {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(storageKey(story))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isProgress(parsed, story) ? parsed : null
  } catch {
    return null
  }
}

const save = (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
  progress: AuthoredStoryProgress,
) => {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(storageKey(story), JSON.stringify(progress))
  } catch {
    // The current page can continue even if local persistence is unavailable.
  }
}

const clear = (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
) => {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.removeItem(storageKey(story))
  } catch {
    // Ignore cleanup failures.
  }
}

const clearAll = () => {
  const storage = getStorage()
  if (!storage) return

  try {
    const keys: string[] = []
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (key?.startsWith(`${KEY_PREFIX}:`)) keys.push(key)
    }
    keys.forEach((key) => storage.removeItem(key))
  } catch {
    // Ignore cleanup failures during privacy deletion.
  }
}

export const authoredStoryPersistence = {
  keyPrefix: KEY_PREFIX,
  keyFor: storageKey,
  load,
  save,
  clear,
  clearAll,
}
