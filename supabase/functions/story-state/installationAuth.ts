import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()

if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase service configuration.')

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const isInstallationAuth = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value)

const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export type InstallationAuthMode = 'required' | 'create' | 'allow-empty' | 'allow-missing-profile'

export type InstallationAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

const credentialMatches = async (installationId: string, authHash: string): Promise<InstallationAuthResult | null> => {
  const { data, error } = await admin
    .from('installation_credentials')
    .select('auth_hash')
    .eq('installation_id', installationId)
    .maybeSingle()

  if (error) {
    console.error('installation credential lookup failed', error)
    return { ok: false, status: 500, error: 'installation_auth_lookup_failed' }
  }
  if (!data) return null
  return data.auth_hash === authHash
    ? { ok: true }
    : { ok: false, status: 403, error: 'installation_auth_invalid' }
}

const profileExists = async (installationId: string): Promise<boolean | null> => {
  const { data, error } = await admin
    .from('child_profiles')
    .select('id')
    .eq('installation_id', installationId)
    .maybeSingle()

  if (error) {
    console.error('installation profile lookup failed', error)
    return null
  }
  return Boolean(data)
}

const createCredential = async (installationId: string, authHash: string): Promise<InstallationAuthResult> => {
  const { error: insertError } = await admin.from('installation_credentials').insert({
    installation_id: installationId,
    auth_hash: authHash,
  })

  if (!insertError) return { ok: true }

  // A concurrent first request may have claimed the same installation UUID.
  // Re-read once and only accept the credential that actually won the race.
  const afterRace = await credentialMatches(installationId, authHash)
  return afterRace ?? { ok: false, status: 500, error: 'installation_auth_create_failed' }
}

export const authorizeInstallation = async (
  installationId: unknown,
  installationAuth: unknown,
  mode: InstallationAuthMode,
): Promise<InstallationAuthResult> => {
  if (!isUuid(installationId)) return { ok: false, status: 422, error: 'invalid_installation_id' }
  if (!isInstallationAuth(installationAuth)) return { ok: false, status: 401, error: 'installation_auth_required' }

  const authHash = await sha256(installationAuth.toLowerCase())
  const existing = await credentialMatches(installationId, authHash)
  if (existing) return existing

  if (mode === 'required') return { ok: false, status: 401, error: 'installation_auth_required' }

  if (mode === 'allow-missing-profile') {
    const hasProfile = await profileExists(installationId)
    if (hasProfile === null) return { ok: false, status: 500, error: 'installation_auth_lookup_failed' }
    if (!hasProfile) return { ok: true }

    // Never let an unbound credential claim an existing profile merely because
    // the caller knows its installation UUID. Existing profiles stay fail-closed.
    return { ok: false, status: 401, error: 'installation_auth_required' }
  }

  if (mode === 'allow-empty') {
    const hasProfile = await profileExists(installationId)
    if (hasProfile === null) return { ok: false, status: 500, error: 'installation_auth_lookup_failed' }
    if (!hasProfile) return { ok: true }
  }

  return createCredential(installationId, authHash)
}

export const deleteInstallationCredential = async (installationId: unknown): Promise<boolean> => {
  if (!isUuid(installationId)) return false
  const { error } = await admin
    .from('installation_credentials')
    .delete()
    .eq('installation_id', installationId)

  if (error) {
    console.error('installation credential deletion failed', error)
    return false
  }
  return true
}
