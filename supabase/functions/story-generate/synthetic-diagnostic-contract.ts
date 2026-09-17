import { isRecord, type NormalizedStoryContext } from './contracts.ts'

export const SYNTHETIC_DIAGNOSTIC_HEADER = 'x-qissa-synthetic-diagnostic-id'
export const isDiagnosticUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)

export type DiagnosticStage =
  | 'architect_raw' | 'architect_validation' | 'narrator_initial'
  | 'narrator_validation' | 'repair_first' | 'repair_retry'
  | 'escalation' | 'semantic_verdict'

export type SyntheticCapture = {
  captureId: string | null
  installationId: string | null
  stages: Array<{ stage: DiagnosticStage; data: unknown }>
}

export const newSyntheticCapture = (): SyntheticCapture => ({
  captureId: null,
  installationId: null,
  stages: [],
})

export const isSyntheticDiagnosticContext = (context: NormalizedStoryContext, input: unknown): boolean => {
  if (!isRecord(input) || !isRecord(input.selections) || !isRecord(input.seriesState)) return false
  const selections = input.selections
  const series = input.seriesState
  return context.ageGroup === '5-7' && context.language === 'uz' &&
    context.heroName === 'Malika' && context.stylePackId === 'cozy_forest' &&
    context.storyMode === 'series' && context.storyMood === 'bedtime' &&
    context.episodeIndex === 1 && context.sessionIndex === 1 &&
    context.isContinuation === false && context.hasSeriesMemory === false &&
    context.choiceHistory.length === 0 && context.recurringCharacters.length === 0 &&
    context.lastEpisodeSummary === '' && context.activeArc === '' &&
    Object.keys(context.relationshipState).length === 0 &&
    Object.keys(context.canonState).length === 0 &&
    selections.language === 'uz' && selections.customHeroName === 'Malika' &&
    typeof series.id === 'string' && /^qissa-synthetic-diagnostic-[0-9a-f-]{36}$/iu.test(series.id) &&
    series.mainCharacter === 'Malika' && series.episodeCount === 0
}

export const recordSyntheticStage = (capture: SyntheticCapture, stage: DiagnosticStage, data: unknown): void => {
  if (!capture.captureId || capture.stages.length >= 12) return
  try {
    // Snapshot immediately: a later text repair must not mutate original evidence.
    capture.stages.push({ stage, data: JSON.parse(JSON.stringify(data)) })
  } catch {
    // Diagnostic failure must not alter story generation or safety decisions.
  }
}
