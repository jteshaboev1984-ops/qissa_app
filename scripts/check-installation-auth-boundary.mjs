import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const migration = read('docs/qissa/backend/migrations/20260908_000013_add_installation_credentials.sql')
const identity = read('src/lib/installationIdentity.ts')
const stateClient = read('src/lib/storyStateService.ts')
const audioClient = read('src/lib/audioRemoteClient.ts')
const stateIndex = read('supabase/functions/story-state/index.ts')
const stateAuth = read('supabase/functions/story-state/installationAuth.ts')
const audioIndex = read('supabase/functions/audio-request/index.ts')
const audioContext = read('supabase/functions/audio-request/context.ts')
const privacySmoke = read('scripts/smoke-privacy-live.mjs')
const audioSmoke = read('scripts/smoke-audio-live.mjs')
const betaE2eAuth = read('scripts/smoke-closed-beta-e2e-live-auth.mjs')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

requireCondition(
  migration.includes('create table if not exists public.installation_credentials') &&
    migration.includes('alter table public.installation_credentials enable row level security') &&
    migration.includes('revoke all on table public.installation_credentials from anon, authenticated') &&
    migration.includes("auth_hash ~ '^[0-9a-f]{64}$'"),
  'Installation credential storage must be fail-closed, server-only, and hash-only.',
)

requireCondition(
  identity.includes("new Uint8Array(32)") &&
    identity.includes('getInstallationAuth') &&
    identity.includes('persistAuth(createInstallationAuth())'),
  'Client installation identity must create, persist, and rotate an independent 256-bit credential.',
)

requireCondition(
  stateClient.includes('installationAuth: getInstallationAuth()') &&
    audioClient.includes('installationAuth: getInstallationAuth()'),
  'State and audio clients must send the device-bound credential with remote requests.',
)

const stateAuthPosition = stateIndex.indexOf('await authorizeInstallation(')
const stateDispatchPosition = stateIndex.indexOf("if (input.action === 'sync_generated')")
requireCondition(
  stateAuthPosition >= 0 && stateDispatchPosition > stateAuthPosition,
  'story-state must authorize the installation before dispatching any persisted-state action.',
)
requireCondition(
  stateIndex.includes('deleteInstallationCredential(input.installationId)'),
  'Full profile deletion must also delete the installation credential.',
)
requireCondition(
  stateAuth.includes("type InstallationAuthMode = 'required' | 'create' | 'allow-empty'") &&
    stateAuth.includes("'installation_auth_invalid'") &&
    stateAuth.includes("'installation_auth_required'") &&
    stateAuth.includes(".from('installation_credentials')"),
  'story-state must distinguish first bind, empty installation, missing credential, and invalid credential cases.',
)

const audioAuthPosition = audioIndex.indexOf('await authorizeInstallation(')
const audioDispatchPosition = audioIndex.indexOf("if (input.action === 'request_audio')")
requireCondition(
  audioIndex.includes('isInstallationAuth(input.installationAuth)') &&
    audioAuthPosition >= 0 && audioDispatchPosition > audioAuthPosition &&
    audioContext.includes(".from('installation_credentials')"),
  'Audio Agent must validate the same installation credential before reading episode or playback state.',
)

requireCondition(
  privacySmoke.includes('wrong installation credential unexpectedly loaded family state') &&
    audioSmoke.includes('wrong installation credential must be rejected by Audio Agent') &&
    betaE2eAuth.includes("randomBytes(32).toString('hex')") &&
    betaE2eAuth.includes("url.includes('/story-state')"),
  'Live privacy, audio, and 12-scenario closed-beta E2E must exercise the installation-auth boundary.',
)

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('installation auth boundary check passed.')
