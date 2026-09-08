import { randomBytes } from 'node:crypto'

// Keep the existing 12-scenario production E2E readable while adding the
// device-bound credential to every story-state request. Each temporary
// installation gets one independent 256-bit secret for the lifetime of its
// smoke scenario; the underlying smoke still owns all cleanup assertions.
const originalFetch = globalThis.fetch
const authByInstallationId = new Map()

const authFor = (installationId) => {
  const existing = authByInstallationId.get(installationId)
  if (existing) return existing
  const created = randomBytes(32).toString('hex')
  authByInstallationId.set(installationId, created)
  return created
}

globalThis.fetch = async (input, init = {}) => {
  const url = input instanceof Request ? input.url : String(input)
  if (!url.includes('/story-state') || typeof init.body !== 'string') {
    return originalFetch(input, init)
  }

  let payload
  try {
    payload = JSON.parse(init.body)
  } catch {
    return originalFetch(input, init)
  }

  if (
    payload &&
    typeof payload === 'object' &&
    typeof payload.installationId === 'string' &&
    typeof payload.installationAuth !== 'string'
  ) {
    payload.installationAuth = authFor(payload.installationId)
  }

  return originalFetch(input, {
    ...init,
    body: JSON.stringify(payload),
  })
}

try {
  await import('./smoke-closed-beta-e2e-live.mjs')
} finally {
  globalThis.fetch = originalFetch
  authByInstallationId.clear()
}
