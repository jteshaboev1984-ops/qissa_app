import type { StoryGenerationInput, StoryGenerationOutput } from '../contracts/agentContracts'
import type { ReaderPreferences } from '../types/qissa'
import { createStoryEpisode } from './storyAgent'
import { localPersistence } from './localPersistence'
import { privacyConsent } from './privacyConsent'
import { generateWithRemoteProvider, getStoryProviderConfig } from './storyRemoteClient'
import { storyStateService } from './storyStateService'

const defaultReaderPreferences: ReaderPreferences = {
  textSize: 'medium',
  fontMode: 'standard',
  lineSpacing: 'relaxed',
  theme: 'warm',
  showTextWithAudio: true,
  audioOnlyNightMode: true,
  voicePresetId: 'neutral_storyteller',
  defaultPlaybackMode: 'read',
}

const generateWithLocalAgent = async (input: StoryGenerationInput): Promise<StoryGenerationOutput> => ({
  episode: createStoryEpisode(input),
})

const persistRemoteEpisode = async (
  input: StoryGenerationInput,
  output: StoryGenerationOutput,
): Promise<void> => {
  const seriesState = input.seriesState ?? localPersistence.loadSeriesStateOrRepair(input.selections)
  if (!seriesState || !input.privacyConsent) return

  const episodeCount = output.episode.episode_id.startsWith('ep-2') ? 2 : 1
  const nextSeriesState = { ...seriesState, episodeCount }

  await storyStateService.syncGenerated({
    selections: input.selections,
    seriesState: nextSeriesState,
    episode: output.episode,
    readerPreferences: localPersistence.loadReaderPreferences() ?? defaultReaderPreferences,
    privacyConsent: input.privacyConsent,
  })
}

const generateEpisode = async (input: StoryGenerationInput): Promise<StoryGenerationOutput> => {
  const config = getStoryProviderConfig()
  if (config.mode === 'local') return generateWithLocalAgent(input)

  const consent = input.privacyConsent ?? privacyConsent.load()
  if (!consent) throw new Error('Parent privacy consent is required before remote story generation.')
  const remoteInput: StoryGenerationInput = { ...input, privacyConsent: consent }

  try {
    await localPersistence.waitForPendingRemoteReset()
    await localPersistence.waitForPendingChoiceSync()

    const output = await generateWithRemoteProvider(remoteInput, config)
    await persistRemoteEpisode(remoteInput, output)
    return output
  } catch (error) {
    if (!config.fallbackToLocal) throw error
    return generateWithLocalAgent(input)
  }
}

export const storyService = {
  generateEpisode,
}
