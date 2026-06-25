import type { StoryGenerationInput, StoryGenerationOutput } from '../contracts/agentContracts'
import type { ReaderPreferences } from '../types/qissa'
import { createStoryEpisode } from './storyAgent'
import { localPersistence } from './localPersistence'
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
  if (!input.seriesState) return

  const episodeCount = output.episode.episode_id.startsWith('ep-2') ? 2 : 1
  const nextSeriesState = { ...input.seriesState, episodeCount }

  await storyStateService.syncGenerated({
    selections: input.selections,
    seriesState: nextSeriesState,
    episode: output.episode,
    readerPreferences: localPersistence.loadReaderPreferences() ?? defaultReaderPreferences,
  })
}

const generateEpisode = async (input: StoryGenerationInput): Promise<StoryGenerationOutput> => {
  const config = getStoryProviderConfig()
  if (config.mode === 'local') return generateWithLocalAgent(input)

  try {
    await localPersistence.waitForPendingRemoteReset()
    await localPersistence.waitForPendingChoiceSync()

    const output = await generateWithRemoteProvider(input, config)
    await persistRemoteEpisode(input, output)
    return output
  } catch (error) {
    if (!config.fallbackToLocal) throw error
    return generateWithLocalAgent(input)
  }
}

export const storyService = {
  generateEpisode,
}
