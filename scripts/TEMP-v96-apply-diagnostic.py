from pathlib import Path
p = Path('supabase/functions/story-generate/split-index.ts')
s = p.read_text()
def once(old, new, label):
    global s
    hits = s.count(old)
    if hits != 1:
        raise SystemExit(f'{label}: expected one exact anchor, found {hits}')
    s = s.replace(old, new, 1)

once("import { claimStoryGeneration, isInstallationId, readStoryAiRuntimeState, type GenerationClaim } from './usage.ts'", "import { claimStoryGeneration, isInstallationId, readStoryAiRuntimeState, type GenerationClaim } from './usage.ts'\nimport { SYNTHETIC_DIAGNOSTIC_HEADER, claimSyntheticDiagnostic, newSyntheticCapture, persistSyntheticCapture, recordSyntheticStage, type SyntheticCapture } from './synthetic-diagnostics.ts'", 'import')
once('Deno.serve(async (request: Request) => {', 'const handleStoryRequest = async (request: Request, diagnostic: SyntheticCapture): Promise<Response> => {', 'entry')
once("  const claim = await claimStoryGeneration(installationId)", "  // A diagnostic request is operator-armed, strictly synthetic and single-use.\n  // Reject it BEFORE accounting/provider calls if authorization or schema fails.\n  if (request.headers.has(SYNTHETIC_DIAGNOSTIC_HEADER)) {\n    if (!await claimSyntheticDiagnostic(request, context, input, installationId, diagnostic)) {\n      return json({ error: 'synthetic_diagnostic_not_authorized' }, 403, origin, runtimeProviderMetadata)\n    }\n  }\n\n  const claim = await claimStoryGeneration(installationId)", 'before cost claim')
once("    blueprint = await generateStoryBlueprint(openAiApiKey, architectModel, context, architectTimeoutMs)", "    blueprint = await generateStoryBlueprint(openAiApiKey, architectModel, context, architectTimeoutMs)\n    recordSyntheticStage(diagnostic, 'architect_raw', blueprint)", 'architect')
once("  if (blueprintErrors.length > 0) {\n    lastFailureClass = 'blueprint-validation'", "  recordSyntheticStage(diagnostic, 'architect_validation', { blueprint, errors: blueprintErrors })\n  if (blueprintErrors.length > 0) {\n    lastFailureClass = 'blueprint-validation'", 'blueprint validation')
once("    candidate = narrationToCandidate(context, blueprint, narration)\n    initialStoryWords = wordCount(candidate.story_text)", "    candidate = narrationToCandidate(context, blueprint, narration)\n    recordSyntheticStage(diagnostic, 'narrator_initial', candidate)\n    initialStoryWords = wordCount(candidate.story_text)", 'first narrator')
once("  let validationErrors = validateCandidate(context, candidate)\n  if (validationErrors.length > 0) {", "  let validationErrors = validateCandidate(context, candidate)\n  recordSyntheticStage(diagnostic, 'narrator_validation', { errors: validationErrors })\n  if (validationErrors.length > 0) {", 'first validator')
once("      repairUsed = true\n      validationErrors = validateCandidate(context, candidate)", "      repairUsed = true\n      recordSyntheticStage(diagnostic, 'repair_first', candidate)\n      validationErrors = validateCandidate(context, candidate)", 'repair 1')
once("        validationErrors = validateCandidate(context, candidate)\n        if (validationErrors.length > 0) {\n          lastFailureClass = 'validation'\n          trace.push(`repair-retry-validation:", "        recordSyntheticStage(diagnostic, 'repair_retry', candidate)\n        validationErrors = validateCandidate(context, candidate)\n        if (validationErrors.length > 0) {\n          lastFailureClass = 'validation'\n          trace.push(`repair-retry-validation:", 'repair retry')
once("      candidate = narrationToCandidate(context, blueprint, narration)\n      escalationUsed = true", "      candidate = narrationToCandidate(context, blueprint, narration)\n      recordSyntheticStage(diagnostic, 'escalation', candidate)\n      escalationUsed = true", 'escalation')
once("    const humiliationEvidenceField = locateHumiliationEvidence(candidate, evaluation)\n    if (!safety.approved)", "    const humiliationEvidenceField = locateHumiliationEvidence(candidate, evaluation)\n    recordSyntheticStage(diagnostic, 'semantic_verdict', {\n      evaluation, moderation, combined: safety, rule_flags: ruleFlags,\n      humiliation_evidence_field: humiliationEvidenceField,\n    })\n    if (!safety.approved)", 'semantic')
assert s.endswith('})\n'), 'expected exact end of existing handler'
s = s[:-3] + '''}

// Single per-request wrapper: persist a synthetic transcript at MOST ONCE, after
// the normal response has been determined. Never put transcript in HTTP or logs.
Deno.serve(async (request: Request) => {
  const diagnostic = newSyntheticCapture()
  const response = await handleStoryRequest(request, diagnostic)
  if (!diagnostic.captureId) return response
  const stored = await persistSyntheticCapture(diagnostic, response)
  const headers = new Headers(response.headers)
  headers.set('X-QISSA-Synthetic-Diagnostic', stored ? 'stored' : 'unavailable')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
})
'''
p.write_text(s)
print('Anchored v96 integration patch applied. No provider calls.')
