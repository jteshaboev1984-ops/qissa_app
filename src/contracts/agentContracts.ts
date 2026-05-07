import type { Episode, OnboardingSelections, SafetyResult, SeriesState } from './storyContracts'

export interface StoryGenerationInput {
  selections: OnboardingSelections
  seriesState?: SeriesState
}

export interface StoryGenerationOutput {
  episode: Episode
}

export interface MemoryApplyChoiceInput {
  seriesState: SeriesState
  episode: Episode
  choice: Episode['choices'][number]
}

export interface SafetyCheckInput {
  episode: Episode
}

export interface SafetyCheckOutput {
  safety: SafetyResult
}
