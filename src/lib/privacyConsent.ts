import { PRIVACY_CONSENT_VERSION, type PrivacyConsent } from '../types/qissa'

const PRIVACY_CONSENT_KEY = 'qissa:v1:privacyConsent'

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
  try {
    const raw = window.localStorage.getItem(PRIVACY_CONSENT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isPrivacyConsent(parsed) ? parsed : null
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

  try {
    window.localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent))
  } catch {
    // Consent still applies for the current session even when storage is unavailable.
  }
  return consent
}

const clear = () => {
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
