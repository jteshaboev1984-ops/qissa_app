import type { ReaderPreferences } from '../types/qissa'

const KEY = 'qissa:v1:sevenRoadsReaderPreferences'

export const defaultSevenRoadsReaderPreferences: ReaderPreferences = {
  textSize: 'medium',
  fontMode: 'standard',
  lineSpacing: 'relaxed',
  theme: 'warm',
  showTextWithAudio: true,
  audioOnlyNightMode: true,
  voicePresetId: 'neutral_storyteller',
  defaultPlaybackMode: 'read',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isPreferences = (value: unknown): value is ReaderPreferences => {
  if (!isRecord(value)) return false

  return (
    (value.textSize === 'small' ||
      value.textSize === 'medium' ||
      value.textSize === 'large' ||
      value.textSize === 'extra_large') &&
    (value.fontMode === 'standard' ||
      value.fontMode === 'soft' ||
      value.fontMode === 'dyslexia_friendly') &&
    (value.lineSpacing === 'normal' ||
      value.lineSpacing === 'relaxed' ||
      value.lineSpacing === 'wide') &&
    (value.theme === 'light' || value.theme === 'warm' || value.theme === 'night') &&
    typeof value.showTextWithAudio === 'boolean' &&
    typeof value.audioOnlyNightMode === 'boolean' &&
    (value.voicePresetId === 'soft_female' ||
      value.voicePresetId === 'calm_male' ||
      value.voicePresetId === 'neutral_storyteller' ||
      value.voicePresetId === 'cheerful_daytime') &&
    (value.defaultPlaybackMode === 'read' || value.defaultPlaybackMode === 'listen')
  )
}

const load = (): ReaderPreferences => {
  if (typeof window === 'undefined') return defaultSevenRoadsReaderPreferences

  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return defaultSevenRoadsReaderPreferences
    const parsed: unknown = JSON.parse(raw)
    return isPreferences(parsed) ? parsed : defaultSevenRoadsReaderPreferences
  } catch {
    return defaultSevenRoadsReaderPreferences
  }
}

const save = (value: ReaderPreferences) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // Reading remains available even if preference persistence is unavailable.
  }
}

const clear = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Ignore cleanup failures.
  }
}

export const sevenRoadsReaderPreferences = {
  key: KEY,
  load,
  save,
  clear,
}
