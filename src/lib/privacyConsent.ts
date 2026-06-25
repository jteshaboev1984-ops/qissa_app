import { PRIVACY_CONSENT_VERSION, type PrivacyConsent } from '../types/qissa'

const PRIVACY_CONSENT_KEY = 'qissa:v1:privacyConsent'
let cachedConsent: PrivacyConsent | null = null

const isPrivacyConsent = (value: unknown): value is PrivacyConsent => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PrivacyConsent>
  return candidate.version === PRIVACY_CONSENT_VERSION &&
    typeof candidate.acceptedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.acceptedAt)) &&
    candidate.parentOrGuardianConfirmed === true &&
    candidate.aiProcessingAccepted === true
}

const load = (): PrivacyConsent | null => {
  if (cachedConsent) return cachedConsent

  try {
    const raw = window.localStorage.getItem(PRIVACY_CONSENT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isPrivacyConsent(parsed)) return null
    cachedConsent = parsed
    return parsed
  } catch {
    return null
  }
}

const accept = (): PrivacyConsent => {
  const consent: PrivacyConsent = {
    version: PRIVACY_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    parentOrGuardianConfirmed: true,
    aiProcessingAccepted: true,
  }

  cachedConsent = consent
  try {
    window.localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent))
  } catch {
    // Consent still applies for the current session when storage is unavailable.
  }
  return consent
}

const clear = () => {
  cachedConsent = null
  try {
    window.localStorage.removeItem(PRIVACY_CONSENT_KEY)
  } catch {
    // Ignore local storage failures during deletion.
  }
}

export const privacyConsent = {
  key: PRIVACY_CONSENT_KEY,
  version: PRIVACY_CONSENT_VERSION,
  isValid: isPrivacyConsent,
  load,
  accept,
  clear,
}
