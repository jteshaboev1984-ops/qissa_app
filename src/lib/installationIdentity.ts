const INSTALLATION_ID_KEY = 'qissa:v1:installationId'

let cachedId: string | null = null

const isUuid = (value: string | null): value is string =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))

const createUuid = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const getInstallationId = (): string => {
  if (cachedId) return cachedId

  try {
    const stored = window.localStorage.getItem(INSTALLATION_ID_KEY)
    if (isUuid(stored)) {
      cachedId = stored
      return stored
    }

    const created = createUuid()
    window.localStorage.setItem(INSTALLATION_ID_KEY, created)
    cachedId = created
    return created
  } catch {
    const created = createUuid()
    cachedId = created
    return created
  }
}
