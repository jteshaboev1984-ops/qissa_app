import type { StoryCandidate } from './contracts.ts'

export const childVisibleStorySafetyProjection = (candidate: StoryCandidate) => ({
  title: candidate.title,
  story_text: candidate.story_text,
  choices: candidate.choices.map((choice) => ({
    text: choice.text,
    effect_summary: choice.effect_summary,
    resolution_text: choice.resolution_text,
  })),
  vocabulary: candidate.vocabulary.map((item) => ({
    word: item.word,
    translation: item.translation,
    example: item.example,
  })),
  nextEpisodePreview: candidate.nextEpisodePreview,
})

export const childVisibleStorySafetyText = (candidate: StoryCandidate): string => [
  candidate.title,
  candidate.story_text,
  candidate.nextEpisodePreview,
  ...candidate.choices.flatMap((choice) => [
    choice.text,
    choice.effect_summary,
    choice.resolution_text,
  ]),
  ...candidate.vocabulary.flatMap((item) => [
    item.word,
    item.translation,
    item.example,
  ]),
].filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join('\n')
