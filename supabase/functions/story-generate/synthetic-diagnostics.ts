import { createClient } from 'npm:@supabase/supabase-js@2'
import { isRecord, type NormalizedStoryContext } from './contracts.ts'

// Diagnostic capture never changes a safety verdict or the child-facing response.
// It is available only for a pre-armed, synthetic E1 request. No raw text in logs,
// response headers, GitHub, or provider metadata. Expired records must be deleted
// by the operator; expiration alone does not guarantee physical erasure.
export const SYNTHETIC_DIAGNOSTIC_HEADER = 'x-qissa-synthetic-diagnostic-id'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const MAX_STAGES = 12
const MAX_PAYLOAD_BYTES = 170_000

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

const adminClient = () => {
  const url = Deno.env.get('SUPABASE_URL')?.trim()
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

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

// Called after runtime/consent/installation checks but BEFORE cost accounting or AI.
// Unauthorized or malformed diagnostic requests fail closed without a provider call.
export const claimSyntheticDiagnostic = async (
  request: Request,
  context: NormalizedStoryContext,
  input: unknown,
  installationId: string,
  capture: SyntheticCapture,
): Promise<boolean> => {
  const captureId = request.headers.get(SYNTHETIC_DIAGNOSTIC_HEADER)
  if (!captureId || !uuid.test(captureId) || !isSyntheticDiagnosticContext(context, input)) return false
  const admin = adminClient()
  if (!admin) return false
  const { data, error } = await admin.from('qissa_synthetic_story_diagnostics')
    .update({ claimed_at: new Date().toISOString() })
    .eq('capture_id', captureId)
    .eq('installation_id', installationId)
    .is('claimed_at', null)
    .is('captured_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('capture_id')
    .maybeSingle()
  if (error || !data || data.capture_id !== captureId) return false
  capture.captureId = captureId
  capture.installationId = installationId
  return true
}

export const recordSyntheticStage = (capture: SyntheticCapture, stage: DiagnosticStage, data: unknown): void => {
  if (!capture.captureId || capture.stages.length >= MAX_STAGES) return
  try {
    // Snapshot NOW: mutable candidate objects can be changed by a later Repair.
    capture.stages.push({ stage, data: JSON.parse(JSON.stringify(data)) })
  } catch {
    // A malformed stage must not alter generation, safety, or expose content.
  }
}

export const persistSyntheticCapture = async (capture: SyntheticCapture, response: Response): Promise<boolean> => {
  if (!capture.captureId || !capture.installationId) return false
  const admin = adminClient()
  if (!admin) return false
  const payload = {
    schema: 1,
    stages: capture.stages,
    outcome: {
      source: response.headers.get('x-qissa-generation-source') ?? 'none',
      failure_class: response.headers.get('x-qissa-generation-failure-class') ?? 'none',
      failure_trace: response.headers.get('x-qissa-generation-failure-trace') ?? '',
      repair: response.headers.get('x-qissa-generation-repair') ?? 'none',
    },
  }
  if (new TextEncoder().encode(JSON.stringify(payload)).length > MAX_PAYLOAD_BYTES) return false
  const { data, error } = await admin.from('qissa_synthetic_story_diagnostics')
    .update({ payload, captured_at: new Date().toISOString() })
    .eq('capture_id', capture.captureId)
    .eq('installation_id', capture.installationId)
    .not('claimed_at', 'is', null)
    .is('captured_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('capture_id')
    .maybeSingle()
  return !error && data?.capture_id === capture.captureId
}
