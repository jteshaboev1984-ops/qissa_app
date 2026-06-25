import type { NarrationSpeed } from './narrationPlan'

export type PlaybackProgressSnapshot = {
  playbackId: string
  positionSeconds: number
  durationSeconds: number
  speed: NarrationSpeed
  completed: boolean
  updatedAt: string
}

const KEY_PREFIX = 'qissa:v1:playbackProgress'
const MAX_POSITION_DRIFT_SECONDS = 2

const storageKey = (playbackId: string) => `${KEY_PREFIX}:${playbackId}`

const isNarrationSpeed = (value: unknown): value is NarrationSpeed =>
  value === 0.8 || value === 1 || value === 1.2

const isSnapshot = (value: unknown): value is PlaybackProgressSnapshot => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PlaybackProgressSnapshot>
  return typeof candidate.playbackId === 'string' &&
    typeof candidate.positionSeconds === 'number' &&
    Number.isFinite(candidate.positionSeconds) &&
    candidate.positionSeconds >= 0 &&
    typeof candidate.durationSeconds === 'number' &&
    Number.isFinite(candidate.durationSeconds) &&
    candidate.durationSeconds >= 0 &&
    isNarrationSpeed(candidate.speed) &&
    typeof candidate.completed === 'boolean' &&
    typeof candidate.updatedAt === 'string'
}

const load = (playbackId: string): PlaybackProgressSnapshot | null => {
  try {
    const raw = window.localStorage.getItem(storageKey(playbackId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isSnapshot(parsed) || parsed.playbackId !== playbackId) return null
    return parsed
  } catch {
    return null
  }
}

const save = (snapshot: PlaybackProgressSnapshot) => {
  const duration = Math.max(0, snapshot.durationSeconds)
  const position = Math.min(Math.max(0, snapshot.positionSeconds), duration || snapshot.positionSeconds)
  const normalized: PlaybackProgressSnapshot = {
    ...snapshot,
    positionSeconds: position,
    durationSeconds: duration,
    completed: snapshot.completed || (duration > 0 && duration - position <= MAX_POSITION_DRIFT_SECONDS),
    updatedAt: new Date().toISOString(),
  }

  try {
    window.localStorage.setItem(storageKey(snapshot.playbackId), JSON.stringify(normalized))
  } catch {
    // Playback can continue for the current page even when storage is unavailable.
  }
}

const clear = (playbackId: string) => {
  try {
    window.localStorage.removeItem(storageKey(playbackId))
  } catch {
    // Ignore cleanup failures.
  }
}

const clearAll = () => {
  try {
    const matchingKeys: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(`${KEY_PREFIX}:`)) matchingKeys.push(key)
    }
    matchingKeys.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Ignore local storage failures during privacy deletion.
  }
}

export const playbackProgress = {
  keyPrefix: KEY_PREFIX,
  load,
  save,
  clear,
  clearAll,
}
