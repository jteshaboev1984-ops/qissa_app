import type { SevenRoadsLanguage } from '../features/publishedStories/sevenRoadsCopy'

const KEY = 'qissa:v1:sevenRoadsLanguage'
const DEFAULT_LANGUAGE: SevenRoadsLanguage = 'ru'

const load = (): SevenRoadsLanguage => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'uz' || value === 'ru' ? value : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

const save = (value: SevenRoadsLanguage) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, value)
  } catch {
    // Language switching still works for the current session.
  }
}

export const sevenRoadsLanguagePreference = {
  key: KEY,
  defaultLanguage: DEFAULT_LANGUAGE,
  load,
  save,
}
