export const PUBLISHED_STORIES_CONSENT_VERSION = '2026-09-25-v1' as const

export interface PublishedStoriesConsent {
  version: typeof PUBLISHED_STORIES_CONSENT_VERSION
  acceptedAt: string
  parentOrGuardianConfirmed: true
  progressStorageAccepted: true
}

const KEY = 'qissa:v1:publishedStoriesConsent'

const isConsent = (value: unknown): value is PublishedStoriesConsent => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PublishedStoriesConsent>
  return candidate.version === PUBLISHED_STORIES_CONSENT_VERSION &&
    typeof candidate.acceptedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.acceptedAt)) &&
    candidate.parentOrGuardianConfirmed === true &&
    candidate.progressStorageAccepted === true
}

const load = (): PublishedStoriesConsent | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isConsent(parsed) ? parsed : null
  } catch {
    return null
  }
}

const accept = (): PublishedStoriesConsent => {
  const value: PublishedStoriesConsent = {
    version: PUBLISHED_STORIES_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    parentOrGuardianConfirmed: true,
    progressStorageAccepted: true,
  }

  try {
    window.localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // The app can continue in the current session even when persistence is unavailable.
  }

  return value
}

const clear = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Ignore cleanup failures.
  }
}

export const publishedStoriesConsent = {
  key: KEY,
  version: PUBLISHED_STORIES_CONSENT_VERSION,
  load,
  accept,
  clear,
}
