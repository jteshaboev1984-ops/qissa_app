import { createClient } from 'npm:@supabase/supabase-js@2'
import type { NormalizedStoryContext } from './contracts.ts'
import {
  SYNTHETIC_DIAGNOSTIC_HEADER,
  isDiagnosticUuid,
  isSyntheticDiagnosticContext,
  type SyntheticCapture,
} from './synthetic-diagnostic-contract.ts'

export {
  SYNTHETIC_DIAGNOSTIC_HEADER,
  newSyntheticCapture,
  recordSyntheticStage,
  type SyntheticCapture,
} from './synthetic-diagnostic-contract.ts'

// Diagnostic capture never changes a safety verdict or child-facing response.
// Operator must manually DELETE by capture_id after inspecting the one synthetic
// story. Expiration blocks new access but cannot erase database backups.
const MAX_PAYLOAD_BYTES = 170_000

const adminClient = () => {
  const url = Deno.env.get('SUPABASE_URL')?.trim()
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// After runtime, consent and installation checks but BEFORE cost accounting.
// A random header ID is insufficient: the operator must pre-arm the same ID and
// installation UUID in the private database, and the request must be synthetic.
export const claimSyntheticDiagnostic = async (
  request: Request,
  context: NormalizedStoryContext,
  input: unknown,
  installationId: string,
  capture: SyntheticCapture,
): Promise<boolean> => {
  const captureId = request.headers.get(SYNTHETIC_DIAGNOSTIC_HEADER)
  if (!captureId || !isDiagnosticUuid(captureId) || !isSyntheticDiagnosticContext(context, input)) return false
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
