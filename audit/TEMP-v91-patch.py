from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'V91 patch anchor {label}: expected 1, found {count}')
    return text.replace(old, new)


architect_path = Path('supabase/functions/story-generate/split-openai.ts')
s = architect_path.read_text()
s = replace_once(s,
    '  context: NormalizedStoryContext,\n): Promise<StoryBlueprint> => {',
    '  context: NormalizedStoryContext,\n  timeoutMs = 30_000,\n): Promise<StoryBlueprint> => {', 'architect timeout parameter')
s = replace_once(s,
    "    'qissa_story_blueprint',\n    storyBlueprintSchema,\n    localizedSystem,\n    prompts.user,\n    18_000,",
    "    'qissa_story_blueprint',\n    storyBlueprintSchema,\n    localizedSystem,\n    prompts.user,\n    timeoutMs,", 'architect timeout forwarding')
s = replace_once(s,
    "  blueprint: StoryBlueprint,\n  retryReason = '',\n): Promise<StoryNarration> => {",
    "  blueprint: StoryBlueprint,\n  retryReason = '',\n  timeoutMs = 30_000,\n): Promise<StoryNarration> => {", 'narrator timeout parameter')
s = replace_once(s,
    "    'qissa_story_narration',\n    storyNarrationSchema,\n    localizedSystem,\n    prompts.user,\n    30_000,",
    "    'qissa_story_narration',\n    storyNarrationSchema,\n    localizedSystem,\n    prompts.user,\n    timeoutMs,", 'narrator timeout forwarding')
architect_path.write_text(s)

repair_path = Path('supabase/functions/story-generate/openai.ts')
s = repair_path.read_text()
s = replace_once(s,
    "  validationErrors: string[],\n  retryFeedback = '',\n): Promise<StoryCandidate> => {",
    "  validationErrors: string[],\n  retryFeedback = '',\n  timeoutMs = 30_000,\n): Promise<StoryCandidate> => {", 'repair timeout parameter')
s = replace_once(s,
    "    'qissa_text_length_repair',\n    buildTextLengthRepairOutputSchema(context, validationErrors),\n    localizedSystem,\n    prompts.user,\n    30_000,",
    "    'qissa_text_length_repair',\n    buildTextLengthRepairOutputSchema(context, validationErrors),\n    localizedSystem,\n    prompts.user,\n    timeoutMs,", 'repair timeout forwarding')
repair_path.write_text(s)

cost_path = Path('scripts/check-story-cost-guard.mjs')
s = cost_path.read_text()
s = replace_once(s,
    "const splitProvider = read('supabase/functions/story-generate/split-openai.ts')",
    "const splitProvider = read('supabase/functions/story-generate/split-openai.ts')\nconst latencyBudget = read('supabase/functions/story-generate/latency-budget.ts')", 'cost guard module read')
s = replace_once(s,
    "    /'qissa_story_blueprint'[\\s\\S]*18_000[\\s\\S]*1800[\\s\\S]*'none'/.test(splitProvider) &&",
    "    /'qissa_story_blueprint'[\\s\\S]*timeoutMs[\\s\\S]*1800[\\s\\S]*'none'/.test(splitProvider) &&", 'cost guard architect budget')
s = replace_once(s,
    "    /'qissa_story_narration'[\\s\\S]*30_000[\\s\\S]*3200[\\s\\S]*'none'/.test(splitProvider) &&",
    "    /'qissa_story_narration'[\\s\\S]*timeoutMs[\\s\\S]*3200[\\s\\S]*'none'/.test(splitProvider) &&", 'cost guard narrator budget')
s = replace_once(s,
    "    /'qissa_text_length_repair'[\\s\\S]*30_000[\\s\\S]*3000[\\s\\S]*'none'/.test(provider) &&",
    "    /'qissa_text_length_repair'[\\s\\S]*timeoutMs[\\s\\S]*3000[\\s\\S]*'none'/.test(provider) &&", 'cost guard repair budget')
s = replace_once(s,
    "  'Browser timeout must cover the bounded 18s architect + 30s narrator + 30s narrator retry + 30s repair + 12s primary safety + 8s consistency-only safety retry envelope (128s) without exceeding the 150s hosted Edge Function ceiling.',",
    "  'Browser timeout must cover the explicit 124s server deadline, not a misleading fixed sum of optional stage ceilings.',", 'cost guard obsolete assertion')
anchor = "requireCondition(\n  /providerFailureClass/.test(storyIndex)"
assert s.count(anchor) == 1, 'cost guard insertion anchor'
s = s.replace(anchor, "requireCondition(\n  /STORY_REQUEST_BUDGET_MS = 124_000/.test(latencyBudget) &&\n    /STORY_SAFETY_RESERVE_MS = 38_000/.test(latencyBudget) &&\n    /hasSafetyBudget/.test(latencyBudget) &&\n    /hasSafetyBudget/.test(splitStoryIndex) &&\n    /stageTimeoutMs/.test(splitStoryIndex) &&\n    /generation-time-budget/.test(splitStoryIndex),\n  'Architect time must be borrowed only inside a shared deadline with a mandatory safety reserve and fail-closed budget exhaustion.',\n)\n\n" + anchor)
s = s.replace('including the bounded safety-only consistency retry are aligned', 'are controlled by an absolute request deadline and a mandatory safety reserve')
cost_path.write_text(s)

index_path = Path('supabase/functions/story-generate/split-index.ts')
s = index_path.read_text()
s = replace_once(s,
    "import { generateStoryBlueprint, generateStoryNarration } from './split-openai.ts'",
    "import { generateStoryBlueprint, generateStoryNarration } from './split-openai.ts'\nimport { hasSafetyBudget, stageTimeoutMs, STORY_REQUEST_BUDGET_MS, STORY_SAFETY_RESERVE_MS } from './latency-budget.ts'", 'orchestrator imports')
s = replace_once(s,
    "Deno.serve(async (request: Request) => {\n  const origin = request.headers.get('origin')",
    "Deno.serve(async (request: Request) => {\n  const requestStartedAt = Date.now()\n  const deadlineAt = requestStartedAt + STORY_REQUEST_BUDGET_MS\n  const origin = request.headers.get('origin')", 'request deadline start')
s = replace_once(s,
    "  let lastFailureClass = 'unknown'\n\n  try {\n    providerCalls += 1\n    blueprint = await generateStoryBlueprint(openAiApiKey, architectModel, context)",
    """  let lastFailureClass = 'unknown'
  let architectElapsedMs = 0
  // Full Narrator plus worst mandatory safety path must remain possible after Architect.
  const architectTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, 30_000 + STORY_SAFETY_RESERVE_MS)
  const budgetFallback = (stage: string): Response => {
    lastFailureClass = 'time-budget'
    trace.push(`${stage}:time-budget`)
    return safeFallback(context, origin, 'generation-time-budget', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Architect-Elapsed-Ms': String(architectElapsedMs),
      'X-QISSA-Architect-Timeout-Ms': String(architectTimeoutMs ?? 0),
      'X-QISSA-Blueprint-Decision-Repair': blueprintDecisionPointRepaired ? 'template' : 'none',
    })
  }
  if (architectTimeoutMs === null) return budgetFallback('architect')
  const architectCallStartedAt = Date.now()

  try {
    providerCalls += 1
    blueprint = await generateStoryBlueprint(openAiApiKey, architectModel, context, architectTimeoutMs)""", 'architect stage budget')
s = replace_once(s,
    "  } catch (error) {\n    const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'\n    lastFailureClass = providerFailureClass(reason)\n    trace.push(`architect:${lastFailureClass}`)",
    "  } catch (error) {\n    architectElapsedMs = Date.now() - architectCallStartedAt\n    const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'\n    lastFailureClass = providerFailureClass(reason)\n    trace.push(`architect:${lastFailureClass}`)", 'architect failure elapsed')
s = replace_once(s,
    "      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),\n      'X-QISSA-Provider-Calls': String(providerCalls),\n    })\n  }\n\n  blueprint = enforceStoryBlueprintContextContract(context, blueprint)",
    "      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),\n      'X-QISSA-Provider-Calls': String(providerCalls),\n      'X-QISSA-Architect-Elapsed-Ms': String(architectElapsedMs),\n      'X-QISSA-Architect-Timeout-Ms': String(architectTimeoutMs),\n    })\n  }\n  architectElapsedMs = Date.now() - architectCallStartedAt\n\n  blueprint = enforceStoryBlueprintContextContract(context, blueprint)", 'architect failure metrics and successful elapsed')
s = replace_once(s,
    "  try {\n    providerCalls += 1\n    const narration = await generateStoryNarration(openAiApiKey, narratorModel, context, blueprint)",
    "  const narrationTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, STORY_SAFETY_RESERVE_MS)\n  if (narrationTimeoutMs === null) return budgetFallback('narrator')\n  try {\n    providerCalls += 1\n    const narration = await generateStoryNarration(openAiApiKey, narratorModel, context, blueprint, '', narrationTimeoutMs)", 'narration budget')
s = replace_once(s,
    "    const repairBaseCandidate = candidate\n    const repairBaseErrors = [...validationErrors]\n    try {",
    "    const repairBaseCandidate = candidate\n    const repairBaseErrors = [...validationErrors]\n    const repairTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, STORY_SAFETY_RESERVE_MS)\n    if (repairTimeoutMs === null) return budgetFallback('repair')\n    try {", 'repair budget gate')
s = replace_once(s,
    "        repairBaseCandidate,\n        repairBaseErrors,\n      )",
    "        repairBaseCandidate,\n        repairBaseErrors,\n        '',\n        repairTimeoutMs,\n      )", 'repair first timeout forwarding')
s = replace_once(s,
    "      if (validationErrors.length > 0 && isTextRepairCorrectionEligible(validationErrors)) {\n        providerCalls += 1",
    "      const repairRetryTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, STORY_SAFETY_RESERVE_MS)\n      if (validationErrors.length > 0 && isTextRepairCorrectionEligible(validationErrors) && repairRetryTimeoutMs !== null) {\n        providerCalls += 1", 'repair correction budget gate')
s = replace_once(s,
    "          repairBaseErrors,\n          repairRetryFeedback,\n        )",
    "          repairBaseErrors,\n          repairRetryFeedback,\n          repairRetryTimeoutMs,\n        )", 'repair retry forwarding')
s = replace_once(s,
    "          trace.push(`repair-retry-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)\n        }\n      }\n    } catch (error) {",
    "          trace.push(`repair-retry-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)\n        }\n      } else if (validationErrors.length > 0 && isTextRepairCorrectionEligible(validationErrors)) {\n        trace.push('repair-retry:skipped-time-budget')\n      }\n    } catch (error) {", 'repair skipped trace')
s = replace_once(s,
    "  if (validationErrors.length > 0 && escalationModel && escalationModel !== narratorModel) {\n    try {",
    "  const escalationTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, STORY_SAFETY_RESERVE_MS)\n  if (validationErrors.length > 0 && escalationModel && escalationModel !== narratorModel && escalationTimeoutMs !== null) {\n    try {", 'escalation budget gate')
s = replace_once(s,
    "      const narration = await generateStoryNarration(openAiApiKey, escalationModel, context, blueprint, retryFeedback)",
    "      const narration = await generateStoryNarration(openAiApiKey, escalationModel, context, blueprint, retryFeedback, escalationTimeoutMs)", 'escalation timeout forwarding')
s = replace_once(s,
    "  try {\n    providerCalls += 1\n    const [evaluation, moderation] = await Promise.all([",
    "  if (!hasSafetyBudget(deadlineAt, Date.now())) return budgetFallback('safety')\n  try {\n    providerCalls += 1\n    const [evaluation, moderation] = await Promise.all([", 'mandatory safety budget gate')
s = replace_once(s,
    "        'X-QISSA-Generation-Source': 'openai-structured',",
    "        'X-QISSA-Generation-Source': 'openai-structured',\n        'X-QISSA-Architect-Elapsed-Ms': String(architectElapsedMs),\n        'X-QISSA-Architect-Timeout-Ms': String(architectTimeoutMs),", 'success architect metrics')
index_path.write_text(s)

print('V91_PATCH_APPLIED: budget helper, provider HTTP timeouts, orchestration mandatory safety, optional stage gating, cost-guard assertions; no providers contacted.')
