import type { AuthoredStoryPackage } from '../features/authoredStory/types'

const KEY_PREFIX = 'qissa:v1:authoredReadingPosition'

export interface AuthoredReadingPosition {
  story_id: string
  story_version: string
  part_index: number
  scroll_y: number
  updated_at: string
}

const keyFor = (story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>) =>
  `${KEY_PREFIX}:${story.story_id}:${story.story_version}`

const storage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const load = (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
): AuthoredReadingPosition | null => {
  const target = storage()
  if (!target) return null

  try {
    const raw = target.getItem(keyFor(story))
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const candidate = parsed as Partial<AuthoredReadingPosition>

    if (
      candidate.story_id !== story.story_id ||
      candidate.story_version !== story.story_version ||
      typeof candidate.part_index !== 'number' ||
      !Number.isInteger(candidate.part_index) ||
      candidate.part_index < 0 ||
      typeof candidate.scroll_y !== 'number' ||
      !Number.isFinite(candidate.scroll_y) ||
      candidate.scroll_y < 0 ||
      typeof candidate.updated_at !== 'string'
    ) return null

    return candidate as AuthoredReadingPosition
  } catch {
    return null
  }
}

const save = (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
  partIndex: number,
  scrollY: number,
) => {
  const target = storage()
  if (!target) return

  const value: AuthoredReadingPosition = {
    story_id: story.story_id,
    story_version: story.story_version,
    part_index: partIndex,
    scroll_y: Math.max(0, Math.round(scrollY)),
    updated_at: new Date().toISOString(),
  }

  try {
    target.setItem(keyFor(story), JSON.stringify(value))
  } catch {
    // Reading can continue even when local storage is unavailable.
  }
}

const clear = (story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>) => {
  const target = storage()
  if (!target) return
  try {
    target.removeItem(keyFor(story))
  } catch {
    // Ignore cleanup failures.
  }
}

export const authoredReadingPosition = {
  keyPrefix: KEY_PREFIX,
  keyFor,
  load,
  save,
  clear,
}
