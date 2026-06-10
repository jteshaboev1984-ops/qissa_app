import type { StoryGenerationInput, StoryGenerationOutput } from '../contracts/agentContracts'
import { createStoryEpisode } from './storyAgent'

// Boundary between UI/application state and the story generation provider.
// Today it uses the local deterministic storyAgent.
// Later this file can call a backend/Edge Function without changing App screens.
const generateWithLocalAgent = async (input: StoryGenerationInput): Promise<StoryGenerationOutput> => ({
  episode: createStoryEpisode(input),
})

export const storyService = {
  generateEpisode: generateWithLocalAgent,
}
