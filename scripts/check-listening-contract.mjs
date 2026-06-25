import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const listeningScene = read('src/components/ListeningScene.tsx')
const listeningTranslations = read('src/i18n/listening.ts')
const narrationHook = read('src/lib/useDeviceNarration.ts')
const narrationPlan = read('src/lib/narrationPlan.ts')
const playbackProgress = read('src/lib/playbackProgress.ts')
const storyArchive = read('src/lib/storyArchive.ts')
const storyScreen = read('src/screens/StoryScreen.tsx')
const contracts = read('src/contracts/storyContracts.ts')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

requireCondition(
  /useDeviceNarration/.test(listeningScene) &&
    /speechSynthesis/.test(narrationHook) &&
    /SpeechSynthesisUtterance/.test(narrationHook),
  'Listening mode must use the device narration controller instead of a visual-only prototype.',
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
  'Playback storage must support resume and remain safe outside browser environments.',
)

requireCondition(
  /const\s+clearAll\s*=/.test(playbackProgress) &&
    /playbackProgress\.clearAll\(\)/.test(storyArchive),
  'Irreversible profile deletion must remove every stored playback position.',
)

requireCondition(
  /timeoutRef/.test(narrationHook) &&
    /clearPendingTimeout/.test(narrationHook) &&
    /window\.clearTimeout\(timeoutRef\.current\)/.test(narrationHook),
  'Pending narration transitions must be tracked and cancelled during episode or playback changes.',
)

requireCondition(
  /seekBy\(-10\)/.test(listeningScene) &&
    /seekBy\(10\)/.test(listeningScene) &&
    /seekTo\(Number\(event\.target\.value\)\)/.test(listeningScene),
  'Listening controls must support timeline seeking and plus/minus ten seconds.',
)

requireCondition(
  /\(\[0\.8, 1, 1\.2\] as const\)/.test(listeningScene) &&
    /changeSpeed/.test(narrationHook),
  'Listening mode must support the approved 0.8x, 1x, and 1.2x speeds.',
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
  /if \(storyStage === 'choice'\) return renderChoiceStage\(\)/.test(storyScreen) &&
    /<ListeningScene/.test(storyScreen) &&
    /cancel\(\)/.test(narrationHook),
  'Entering the choice stage must unmount and stop active narration without countdown pressure.',
)

requireCondition(
  /showTextWithAudio:\s*boolean/.test(contracts) &&
    /audioOnlyNightMode:\s*boolean/.test(contracts) &&
    /voicePresetId:\s*VoicePresetId/.test(contracts),
  'Reader preferences must retain the listening display and standard voice settings.',
)

requireCondition(
  /from '..\/i18n\/listening'/.test(listeningScene) &&
    /ru:\s*\{/.test(listeningTranslations) &&
    /uz:\s*\{/.test(listeningTranslations) &&
    /kz:\s*\{/.test(listeningTranslations),
  'New listening states must use the centralized RU, UZ, and KZ translation module.',
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
    !/getUserMedia|MediaRecorder|voice.?clone/i.test(`${listeningScene}\n${narrationHook}`),
  'The playback foundation must not add a network TTS call, microphone capture, or voice cloning.',
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

console.log('listening playback contract check passed.')
