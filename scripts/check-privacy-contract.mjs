import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const app = read('src/App.tsx')
const contracts = read('src/contracts/storyContracts.ts')
const consentModule = read('src/lib/privacyConsent.ts')
const installationIdentity = read('src/lib/installationIdentity.ts')
const localPersistence = read('src/lib/localPersistence.ts')
const storyArchive = read('src/lib/storyArchive.ts')
const storyService = read('src/lib/storyService.ts')
const stateService = read('src/lib/storyStateService.ts')
const welcome = read('src/screens/WelcomeScreen.tsx')
const parentScreen = read('src/screens/ParentScreen.tsx')
const privacyPanel = read('src/components/PrivacyDataPanel.tsx')
const storyGenerate = read('supabase/functions/story-generate/index.ts')
const storyState = read('supabase/functions/story-state/index.ts')
const migration = read('docs/qissa/backend/migrations/20260625_000006_add_privacy_consent.sql')
const deletionTelemetryMigration = read('docs/qissa/backend/migrations/20260908_000012_delete_installation_events_with_profile.sql')

const failures = []
const consentVersion = '2026-06-25-v1'

const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

requireCondition(
  contracts.includes(`PRIVACY_CONSENT_VERSION = '${consentVersion}'`) &&
    storyGenerate.includes(`PRIVACY_CONSENT_VERSION = '${consentVersion}'`) &&
    storyState.includes(`PRIVACY_CONSENT_VERSION = '${consentVersion}'`),
  'Client and both Edge Functions must share the same privacy consent version.',
)

requireCondition(
  /parentOrGuardianConfirmed:\s*true/.test(contracts) && /aiProcessingAccepted:\s*true/.test(contracts),
  'PrivacyConsent must require explicit parent/guardian and AI-processing confirmation.',
)

requireCondition(
  /let\s+cachedConsent:\s*PrivacyConsent\s*\|\s*null/.test(consentModule) &&
    /if\s*\(cachedConsent\)\s*return\s+cachedConsent/.test(consentModule) &&
    /cachedConsent\s*=\s*null/.test(consentModule),
  'Privacy consent must remain stable for the page session and clear on deletion.',
)

requireCondition(
  /consentAlreadyAccepted/.test(welcome) &&
    /parent|ota-ona|ата-ана/i.test(welcome) &&
    /type="checkbox"/.test(welcome),
  'Welcome must show an explicit parent consent checkbox before onboarding.',
)

requireCondition(
  /позицию прослушивания/.test(welcome) &&
    /tinglash joyini/.test(welcome) &&
    /тыңдау орнын/.test(welcome) &&
    /технические события/.test(welcome) &&
    /texnik hodisalar/.test(welcome) &&
    /техникалық оқиғалар/.test(welcome),
  'Consent details must disclose playback progress and minimal first-party technical events in RU, UZ, and KZ.',
)

requireCondition(
  /privacyConsent\.accept\(\)/.test(app) &&
    /privacyConsentAccepted/.test(app) &&
    /storyStateService\.deleteProfileData\(\)/.test(app),
  'App must accept consent explicitly and call the dedicated remote deletion action.',
)

const appDeleteStart = app.indexOf('const handleDeleteProfileData')
const appWaitResetPosition = app.indexOf('await localPersistence.waitForPendingRemoteReset()', appDeleteStart)
const appWaitChoicePosition = app.indexOf('await localPersistence.waitForPendingChoiceSync()', appDeleteStart)
const appRemoteDeletePosition = app.indexOf('await storyStateService.deleteProfileData()', appDeleteStart)
const appLocalClearPosition = app.indexOf('localPersistence.clearAllLocalData()', appDeleteStart)
requireCondition(
  appDeleteStart >= 0 &&
    appWaitResetPosition > appDeleteStart &&
    appWaitChoicePosition > appWaitResetPosition &&
    appRemoteDeletePosition > appWaitChoicePosition &&
    appLocalClearPosition > appRemoteDeletePosition,
  'Profile deletion must wait for pending state writes, complete remote deletion first, and only then clear local data.',
)

requireCondition(
  /localPersistence\.clearAllLocalData\(\)/.test(app) &&
    /storyArchive\.clear\(\)/.test(app) &&
    /privacyConsent\.clear\(\)/.test(app) &&
    /rotateInstallationId\(\)/.test(app),
  'Complete deletion must clear local profile data, archive, consent, and rotate installation identity.',
)

requireCondition(
  /export\s+const\s+rotateInstallationId/.test(installationIdentity),
  'Installation identity must expose an explicit rotation operation after deletion.',
)

const clearAllLocalDataStart = localPersistence.indexOf('const clearAllLocalData')
const clearAllQissaStorageStart = localPersistence.indexOf('const clearAllQissaStorage')
const clearAllLocalDataBody =
  clearAllLocalDataStart >= 0 && clearAllQissaStorageStart > clearAllLocalDataStart
    ? localPersistence.slice(clearAllLocalDataStart, clearAllQissaStorageStart)
    : ''

requireCondition(
  clearAllLocalDataBody.length > 0 &&
    /Object\.values\(STORAGE_KEYS\)/.test(clearAllLocalDataBody) &&
    !/queueRemoteReset\(\)/.test(clearAllLocalDataBody),
  'Local privacy deletion must not be implemented as the soft story reset.',
)

requireCondition(
  /const\s+clear\s*=/.test(storyArchive) && /removeItem\(STORY_ARCHIVE_KEY\)/.test(storyArchive),
  'The local story archive must support complete deletion.',
)

requireCondition(
  /Parent privacy consent is required/.test(storyService) &&
    /privacyConsent:\s*input\.privacyConsent/.test(storyService),
  'Remote generation and persistence must require and carry privacy consent.',
)

requireCondition(
  /delete_profile_data/.test(stateService) && /deleteProfileData/.test(stateService),
  'The client state service must expose the dedicated full-deletion action.',
)

const clientDeleteStart = stateService.indexOf('const deleteProfileData')
const stateDeletePosition = stateService.indexOf("await requestState({ action: 'delete_profile_data' })", clientDeleteStart)
requireCondition(
  clientDeleteStart >= 0 &&
    stateDeletePosition > clientDeleteStart &&
    !/audio-cleanup|requestAudioCleanup|delete_profile_audio/.test(stateService),
  'Client deletion must use one fail-closed backend action.',
)

const aiDisabledGuardPosition = storyGenerate.indexOf('if (!aiEnabled || !openAiApiKey)')
const aiConsentGuardPosition = storyGenerate.indexOf('if (!hasValidPrivacyConsent(input))')
const usageClaimPosition = storyGenerate.indexOf('claimStoryGeneration(installationId)')
requireCondition(
  /privacy_consent_required/.test(storyGenerate) &&
    aiDisabledGuardPosition >= 0 &&
    aiConsentGuardPosition > aiDisabledGuardPosition &&
    usageClaimPosition > aiConsentGuardPosition,
  'Real AI processing must require valid consent before usage is claimed or any provider work can begin.',
)

requireCondition(
  /privacy_consent_required/.test(storyState) &&
    /privacy_consent_version:\s*privacyConsent\.version/.test(storyState) &&
    /parent_or_guardian_confirmed:\s*true/.test(storyState) &&
    /ai_processing_consent:\s*true/.test(storyState),
  'Story persistence must validate and store the consent evidence.',
)

const deleteFunctionStart = storyState.indexOf('async function deleteProfileData')
const audioDeletePosition = storyState.indexOf('await deleteProfileAudioObjects(profile.id)', deleteFunctionStart)
const eventDeletePosition = storyState.indexOf("from('app_events')", deleteFunctionStart)
const profileDeletePosition = storyState.indexOf("from('child_profiles')", deleteFunctionStart)
requireCondition(
  deleteFunctionStart >= 0 &&
    /storage\s*\.from\(AUDIO_BUCKET\)\s*\.remove\(/.test(storyState) &&
    /audio_storage_cleanup_failed/.test(storyState) &&
    audioDeletePosition > deleteFunctionStart &&
    eventDeletePosition > audioDeletePosition &&
    profileDeletePosition > eventDeletePosition,
  'Full deletion must remove private audio, telemetry, and then the child profile.',
)

requireCondition(
  /qissa_delete_profile_app_events/.test(deletionTelemetryMigration) &&
    /before delete on public\.child_profiles/.test(deletionTelemetryMigration) &&
    /child_profile_id = old\.id/.test(deletionTelemetryMigration) &&
    /installation_id = old\.installation_id/.test(deletionTelemetryMigration) &&
    /security definer/.test(deletionTelemetryMigration) &&
    /revoke all on function[\s\S]*from anon/.test(deletionTelemetryMigration) &&
    /grant execute on function[\s\S]*to service_role/.test(deletionTelemetryMigration),
  'Deleting a child profile must also remove pseudonymous installation-scoped telemetry that predates profile persistence.',
)

requireCondition(
  /async function resetCurrent[\s\S]*?update\(\{ is_archived: true \}\)/.test(storyState) &&
    /async function deleteProfileData/.test(storyState),
  'Soft reset and irreversible profile deletion must remain separate backend operations.',
)

requireCondition(
  /confirmingReset/.test(parentScreen) &&
    /Начать историю заново\?/.test(parentScreen) &&
    /Hikoyani boshidan boshlaysizmi\?/.test(parentScreen) &&
    /Оқиғаны басынан бастайсыз ба\?/.test(parentScreen) &&
    /onClick=\{confirmReset\}/.test(parentScreen),
  'Soft reset must require a separate localized confirmation instead of firing on the first tap.',
)

requireCondition(
  /останется в библиотеке как архив/.test(parentScreen) &&
    /kutubxonada arxiv sifatida qoladi/.test(parentScreen) &&
    /кітапханада мұрағат ретінде қалады/.test(parentScreen),
  'Soft-reset copy must explain that the current story is archived rather than deleted.',
)

requireCondition(
  ['privacy_consent_version', 'privacy_consent_at', 'parent_or_guardian_confirmed', 'ai_processing_consent']
    .every((field) => migration.includes(field)) &&
    /child_profiles_privacy_consent_consistent/.test(migration),
  'The migration must persist versioned consent evidence with a consistency constraint.',
)

requireCondition(
  /Подтвердите полное удаление/.test(privacyPanel) &&
    /To‘liq o‘chirishni tasdiqlang/.test(privacyPanel) &&
    /Толық жоюды растаңыз/.test(privacyPanel),
  'The irreversible deletion confirmation must be localized in RU, UZ, and KZ.',
)

if (failures.length > 0) {
  console.error('privacy contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('privacy consent and deletion contract check passed.')
