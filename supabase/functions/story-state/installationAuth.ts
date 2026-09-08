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

export type InstallationAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

export const authorizeInstallation = async (
  installationId: unknown,
  installationAuth: unknown,
  allowCreate: boolean,
): Promise<InstallationAuthResult> => {
  if (!isUuid(installationId)) return { ok: false, status: 422, error: 'invalid_installation_id' }
  if (!isInstallationAuth(installationAuth)) return { ok: false, status: 401, error: 'installation_auth_required' }

  const authHash = await sha256(installationAuth.toLowerCase())
  const { data, error } = await admin
    .from('installation_credentials')
    .select('auth_hash')
    .eq('installation_id', installationId)
    .maybeSingle()

  if (error) {
    console.error('installation credential lookup failed', error)
    return { ok: false, status: 500, error: 'installation_auth_lookup_failed' }
  }

  if (data) {
    return data.auth_hash === authHash
      ? { ok: true }
      : { ok: false, status: 403, error: 'installation_auth_invalid' }
  }

  if (!allowCreate) return { ok: false, status: 401, error: 'installation_auth_required' }

  const { error: insertError } = await admin.from('installation_credentials').insert({
    installation_id: installationId,
    auth_hash: authHash,
  })

  if (!insertError) return { ok: true }

  // A concurrent first request may have claimed the same installation UUID.
  // Re-read once and only accept the credential that actually won the race.
  const { data: afterRace, error: raceError } = await admin
    .from('installation_credentials')
    .select('auth_hash')
    .eq('installation_id', installationId)
    .maybeSingle()

  if (raceError) {
    console.error('installation credential race lookup failed', raceError)
    return { ok: false, status: 500, error: 'installation_auth_lookup_failed' }
  }

  return afterRace?.auth_hash === authHash
    ? { ok: true }
    : { ok: false, status: 403, error: 'installation_auth_invalid' }
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
