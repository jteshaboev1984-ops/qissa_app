import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const listeningScene = read('src/components/ListeningScene.tsx')
const listeningTranslations = read('src/i18n/listening.ts')
const hybridNarration = read('src/lib/useHybridNarration.ts')
const audioRemoteClient = read('src/lib/audioRemoteClient.ts')
const narrationHook = read('src/lib/useDeviceNarration.ts')
const narrationPlan = read('src/lib/narrationPlan.ts')
const playbackProgress = read('src/lib/playbackProgress.ts')
const storyArchive = read('src/lib/storyArchive.ts')
const storyScreen = read('src/screens/StoryScreen.tsx')
const contracts = read('src/contracts/storyContracts.ts')
const viteEnv = read('src/vite-env.d.ts')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

requireCondition(
  /useHybridNarration/.test(listeningScene) &&
    /useDeviceNarration/.test(hybridNarration) &&
    /speechSynthesis/.test(narrationHook) &&
    /SpeechSynthesisUtterance/.test(narrationHook),
  'Listening mode must prefer the hybrid Audio Agent path while retaining device narration fallback.',
)

requireCondition(
  /requestAudio/.test(hybridNarration) &&
    /loadPlaybackProgress/.test(hybridNarration) &&
    /savePlaybackProgress/.test(hybridNarration) &&
    /action:\s*'request_audio'/.test(audioRemoteClient) &&
    /action:\s*'load_progress'/.test(audioRemoteClient) &&
    /action:\s*'save_progress'/.test(audioRemoteClient),
  'Listening mode must request backend audio and round-trip playback progress through the Audio Agent.',
)

requireCondition(
  /VITE_QISSA_AUDIO_ENDPOINT/.test(audioRemoteClient) && /VITE_QISSA_AUDIO_ENDPOINT/.test(viteEnv),
  'The Audio Agent endpoint must be an explicit typed production configuration option.',
)

requireCondition(
  /fallbackMode/.test(audioRemoteClient) &&
    /device-fallback/.test(hybridNarration) &&
    /device\.play\(\)/.test(hybridNarration),
  'Backend/provider audio failures must fall back to device narration rather than break listening.',
)

requireCondition(
  /playbackId\s*=\s*`\$\{episode\.series_id\}:\$\{episode\.episode_id\}`/.test(listeningScene) &&
    /playbackId:\s*string/.test(playbackProgress),
  'Playback progress must be unique per series and episode.',
)

requireCondition(
  /qissa:v1:playbackProgress/.test(playbackProgress) &&
    /const\s+getStorage\s*=/.test(playbackProgress) &&
    /typeof window === 'undefined'/.test(playbackProgress) &&
    /storage\.getItem/.test(playbackProgress) &&
    /storage\.setItem/.test(playbackProgress),
  'Local playback storage must remain as an offline resume safety net.',
)

requireCondition(
  /const\s+clearAll\s*=/.test(playbackProgress) &&
    /playbackProgress\.clearAll\(\)/.test(storyArchive),
  'Irreversible profile deletion must remove every locally stored playback position.',
)

requireCondition(
  /disposeRemoteAudio/.test(hybridNarration) &&
    /audio\.pause\(\)/.test(hybridNarration) &&
    /removeAttribute\('src'\)/.test(hybridNarration) &&
    /useEffect\(\(\) => \(\) => \{\s*cancel\(\)/s.test(narrationHook),
  'Unmounting or changing stories must stop both server audio and device narration.',
)

requireCondition(
  /seekBy\(-10\)/.test(listeningScene) &&
    /seekBy\(10\)/.test(listeningScene) &&
    /seekTo\(Number\(event\.target\.value\)\)/.test(listeningScene),
  'Listening controls must support timeline seeking and plus/minus ten seconds.',
)

requireCondition(
  /\(\[0\.8, 1, 1\.2\] as const\)/.test(listeningScene) &&
    /changeSpeed/.test(hybridNarration) &&
    /changeSpeed/.test(narrationHook),
  'Listening mode must support the approved 0.8x, 1x, and 1.2x speeds in both delivery modes.',
)

requireCondition(
  /showTextWithAudio/.test(listeningScene) &&
    /audioOnlyNightMode/.test(listeningScene) &&
    /currentSegmentIndex/.test(listeningScene),
  'Listening mode must support text visibility, night mode, and current-segment highlighting.',
)

requireCondition(
  /VoiceSelector/.test(listeningScene) && /showVoiceSelector/.test(listeningScene),
  'Narrator voice selection must remain optional and outside onboarding.',
)

requireCondition(
  /onPointerDownCapture=\{\(\) => setViewMode\('read'\)\}/.test(storyScreen) &&
    /<ListeningScene/.test(storyScreen) &&
    /disposeRemoteAudio/.test(hybridNarration),
  'Engaging the inline choice must unmount and stop active listening without adding a separate choice screen.',
)

requireCondition(
  /showTextWithAudio:\s*boolean/.test(contracts) &&
    /audioOnlyNightMode:\s*boolean/.test(contracts) &&
    /voicePresetId:\s*VoicePresetId/.test(contracts),
  'Reader preferences must retain the listening display and standard voice settings.',
)

requireCondition(
  /from '..\/i18n\/listening'/.test(listeningScene) &&
    /preparing:/.test(listeningTranslations) &&
    /deviceFallback:/.test(listeningTranslations) &&
    /aiVoiceDisclosure:/.test(listeningTranslations) &&
    /ru:\s*\{/.test(listeningTranslations) &&
    /uz:\s*\{/.test(listeningTranslations) &&
    /kz:\s*\{/.test(listeningTranslations),
  'Backend audio, fallback, and AI-voice disclosure states must be localized in RU, UZ, and KZ.',
)

requireCondition(
  /requiresAiVoiceDisclosure/.test(listeningScene) &&
    /aiVoiceDisclosure/.test(listeningScene),
  'Provider-generated voice must display the required AI voice disclosure.',
)

requireCondition(
  /RUSSIAN_ABBREVIATIONS/.test(narrationPlan) &&
    /protectAbbreviations/.test(narrationPlan) &&
    /splitNarrationText/.test(narrationPlan) &&
    /buildNarrationTimeline/.test(narrationPlan) &&
    /segmentIndexAtPosition/.test(narrationPlan),
  'Narration must preserve common abbreviations and use a deterministic segment timeline.',
)

requireCondition(
  !/fetch\s*\(/.test(narrationHook) &&
    /fetch\s*\(/.test(audioRemoteClient) &&
    !/getUserMedia|MediaRecorder|voice.?clone/i.test(`${listeningScene}\n${hybridNarration}\n${narrationHook}`),
  'Network audio must stay isolated in the Audio Agent client and the MVP must not capture or clone voices.',
)

requireCondition(
  !/prototype_note/.test(listeningScene),
  'The listening screen must no longer present itself as a prototype.',
)

if (failures.length > 0) {
  console.error('listening contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('backend-first listening playback contract check passed.')
