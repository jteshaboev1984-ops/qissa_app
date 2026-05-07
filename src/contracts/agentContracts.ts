// NOTE: Agent contract shapes are kept stable so local mock agents and future Edge Function responses remain compatible.
import type { Episode, EpisodeChoice, OnboardingSelections, SafetyResult, SeriesState, StoryMood, StoryMode } from './storyContracts'

// Core generation input used by local mock today and by future edge function adapter.
export interface StoryGenerationInput {
  selections: OnboardingSelections
  seriesState?: SeriesState
}

export interface StoryGenerationOutput {
  episode: Episode
}

// Prompt-facing normalized payload to support future model prompt building.
export interface StoryPromptInput {
  language: OnboardingSelections['language']
  ageGroup: OnboardingSelections['ageGroup']
  heroType: OnboardingSelections['heroType']
  customHeroName?: string
  stylePackId: OnboardingSelections['stylePackId']
  storyMood: StoryMood
  storyMode: StoryMode
  episodeIndex: number
  priorChoiceHistory: SeriesState['choiceHistory']
  canonState: SeriesState['canonState']
  relationshipState: SeriesState['relationshipState']
  activeArc: SeriesState['activeArc']
}

// Structured output expected from future Story Agent prompt execution.
export interface StoryPromptOutput {
  episode: Episode
}

export interface MemoryApplyChoiceInput {
  seriesState: SeriesState
  episode: Episode
  choice: EpisodeChoice
}

export interface SafetyCheckInput {
  episode: Episode
}

export interface SafetyCheckOutput {
  safety: SafetyResult
}

export interface SafetyAgentDecision {
  approved: SafetyResult['approved']
  risk_level: SafetyResult['risk_level']
  flags: SafetyResult['flags']
  required_action: SafetyResult['required_action']
}
