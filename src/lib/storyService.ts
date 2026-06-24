import type { StoryGenerationInput, StoryGenerationOutput } from '../contracts/agentContracts'
import { createStoryEpisode } from './storyAgent'
import { generateWithRemoteProvider, getStoryProviderConfig } from './storyRemoteClient'

const generateWithLocalAgent = async (input: StoryGenerationInput): Promise<StoryGenerationOutput> => ({
  episode: createStoryEpisode(input),
})

const generateEpisode = async (input: StoryGenerationInput): Promise<StoryGenerationOutput> => {
  const config = getStoryProviderConfig()
  if (config.mode === 'local') return generateWithLocalAgent(input)

  try {
    return await generateWithRemoteProvider(input, config)
  } catch (error) {
    if (!config.fallbackToLocal) throw error
    return generateWithLocalAgent(input)
  }
}

export const storyService = {
  generateEpisode,
}
