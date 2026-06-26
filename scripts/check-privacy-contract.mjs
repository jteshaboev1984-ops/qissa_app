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
const privacyPanel = read('src/components/PrivacyDataPanel.tsx')
const storyGenerate = read('supabase/functions/story-generate/index.ts')
const storyState = read('supabase/functions/story-state/index.ts')
const migration = read('docs/qissa/backend/migrations/20260625_000006_add_privacy_consent.sql')

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
  /privacyConsent\.accept\(\)/.test(app) &&
    /privacyConsentAccepted/.test(app) &&
    /storyStateService\.deleteProfileData\(\)/.test(app),
  'App must accept consent explicitly and call the dedicated remote deletion action.',
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

requireCondition(
  /privacy_consent_required/.test(storyGenerate) &&
    /aiEnabled\s*&&\s*openAiApiKey\s*&&\s*!hasValidPrivacyConsent/.test(storyGenerate),
  'Real AI processing must be blocked server-side without valid consent.',
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
  /async function resetCurrent[\s\S]*?update\(\{ is_archived: true \}\)/.test(storyState) &&
    /async function deleteProfileData/.test(storyState),
  'Soft reset and irreversible profile deletion must remain separate backend operations.',
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
