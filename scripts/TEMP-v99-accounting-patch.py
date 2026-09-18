from pathlib import Path
import re

ROOT = Path('supabase/functions/story-generate')

def change(file, old, new, count=1):
    path = Path(file)
    text = path.read_text()
    found = text.count(old)
    assert found == count, f'{file}: expected {count} occurrences for {old[:75]!r}, got {found}'
    path.write_text(text.replace(old, new))

split = ROOT / 'split-openai.ts'
change(split, 'const postJson = async (apiKey: string, body: unknown, timeoutMs: number): Promise<unknown> => {', 'const postJson = async (apiKey: string, body: unknown, timeoutMs: number, onRequestAttempt?: () => void): Promise<unknown> => {')
change(split, '    const response = await fetch(RESPONSES_URL, {', '    const serializedBody = JSON.stringify(body)\n    onRequestAttempt?.()\n    const response = await fetch(RESPONSES_URL, {')
change(split, '      body: JSON.stringify(body),', '      body: serializedBody,')
change(split, "  reasoningEffort: ReasoningEffort = 'none',\n): Promise<T> => {", "  reasoningEffort: ReasoningEffort = 'none',\n  onRequestAttempt?: () => void,\n): Promise<T> => {")
change(split, '  }, timeoutMs)', '  }, timeoutMs, onRequestAttempt)')
change(split, '  timeoutMs = 30_000,\n): Promise<StoryBlueprint> => {', '  timeoutMs = 30_000,\n  onRequestAttempt?: () => void,\n): Promise<StoryBlueprint> => {')
change(split, '  timeoutMs = 30_000,\n): Promise<StoryNarration> => {', '  timeoutMs = 30_000,\n  onRequestAttempt?: () => void,\n): Promise<StoryNarration> => {')
change(split, "    1800,\n    'none',\n  )", "    1800,\n    'none',\n    onRequestAttempt,\n  )")
change(split, "    3200,\n    'none',\n  )", "    3200,\n    'none',\n    onRequestAttempt,\n  )")

provider = ROOT / 'openai.ts'
change(provider, '  timeoutMs: number,\n): Promise<unknown> => {', '  timeoutMs: number,\n  onRequestAttempt?: () => void,\n): Promise<unknown> => {')
change(provider, '    const response = await fetch(url, {', '    const serializedBody = JSON.stringify(body)\n    onRequestAttempt?.()\n    const response = await fetch(url, {')
change(provider, '      body: JSON.stringify(body),', '      body: serializedBody,')
change(provider, '  reasoningEffort: ReasoningEffort,\n): Promise<T> => {', '  reasoningEffort: ReasoningEffort,\n  onRequestAttempt?: () => void,\n): Promise<T> => {')
change(provider, '  }, timeoutMs)', '  }, timeoutMs, onRequestAttempt)')
change(provider, '  retryReason: string,\n): Promise<StoryCandidate> => {', '  retryReason: string,\n  onRequestAttempt?: () => void,\n): Promise<StoryCandidate> => {')
change(provider, "    4000,\n    'none',\n  )", "    4000,\n    'none',\n    onRequestAttempt,\n  )")
change(provider, '  retryFeedback = \'\',\n  timeoutMs = 30_000,\n): Promise<StoryCandidate> => {', '  retryFeedback = \'\',\n  timeoutMs = 30_000,\n  onRequestAttempt?: () => void,\n): Promise<StoryCandidate> => {')
change(provider, "    3000,\n    'none',\n  )", "    3000,\n    'none',\n    onRequestAttempt,\n  )")
change(provider, "  additionalInstruction = '',\n  timeoutMs = 12_000,\n): Promise<SafetyEvaluation> => {", "  additionalInstruction = '',\n  timeoutMs = 12_000,\n  onRequestAttempt?: () => void,\n): Promise<SafetyEvaluation> => {")
change(provider, "    700,\n    'none',\n  )", "    700,\n    'none',\n    onRequestAttempt,\n  )")
change(provider, "  candidateJson: string,\n): Promise<HumiliationAdjudication>", "  candidateJson: string,\n  onRequestAttempt?: () => void,\n): Promise<HumiliationAdjudication>")
change(provider, "  candidateJson: string,\n): Promise<FearAdjudication>", "  candidateJson: string,\n  onRequestAttempt?: () => void,\n): Promise<FearAdjudication>")
change(provider, "  260,\n  'low',\n)", "  260,\n  'low',\n  onRequestAttempt,\n)", 2)
change(provider, '  candidate: StoryCandidate,\n): Promise<FearAdjudication> => {', '  candidate: StoryCandidate,\n  onRequestAttempt?: () => void,\n): Promise<FearAdjudication> => {')
change(provider, '    JSON.stringify(childVisibleStorySafetyProjection(candidate)),\n  )', '    JSON.stringify(childVisibleStorySafetyProjection(candidate)),\n    onRequestAttempt,\n  )')
change(provider, '  candidate: StoryCandidate,\n): Promise<SafetyEvaluation> => {', '  candidate: StoryCandidate,\n  onRequestAttempt?: () => void,\n): Promise<SafetyEvaluation> => {')
change(provider, '  const first = await requestSafetyEvaluation(apiKey, model, context, candidateJson)', "  const first = await requestSafetyEvaluation(apiKey, model, context, candidateJson, '', 12_000, onRequestAttempt)")
change(provider, '      8_000,\n    )', '      8_000,\n      onRequestAttempt,\n    )')
change(provider, '    const adjudication = await requestHumiliationAdjudication(apiKey, model, candidateJson)', '    const adjudication = await requestHumiliationAdjudication(apiKey, model, candidateJson, onRequestAttempt)')
change(provider, '  const adjudication = await requestFearAdjudication(apiKey, model, candidateJson)', '  const adjudication = await requestFearAdjudication(apiKey, model, candidateJson, onRequestAttempt)')
change(provider, 'export const moderateStoryText = async (apiKey: string, text: string): Promise<ModerationResult> => {', 'export const moderateStoryText = async (apiKey: string, text: string, onRequestAttempt?: () => void): Promise<ModerationResult> => {')
change(provider, '  }, 7_000)', '  }, 7_000, onRequestAttempt)')

index = ROOT / 'split-index.ts'
text = index.read_text()
assert text.count('  let providerCalls = 0\n') == 1
text = text.replace('  let providerCalls = 0\n', '  let providerCalls = 0\n  // Request-local observer: one increment immediately before each actual OpenAI HTTP fetch.\n  const onRequestAttempt = () => { providerCalls += 1 }\n')
text, removed = re.subn(r'(?m)^\s+providerCalls \+= 1\n', '', text)
assert removed == 7, f'expected 7 obsolete stage-level increments, got {removed}'
assert text.count('generateStoryBlueprint(openAiApiKey, architectModel, context, architectTimeoutMs)') == 1
text = text.replace('generateStoryBlueprint(openAiApiKey, architectModel, context, architectTimeoutMs)', 'generateStoryBlueprint(openAiApiKey, architectModel, context, architectTimeoutMs, onRequestAttempt)')
assert text.count("generateStoryNarration(openAiApiKey, narratorModel, context, blueprint, '', narrationTimeoutMs)") == 1
text = text.replace("generateStoryNarration(openAiApiKey, narratorModel, context, blueprint, '', narrationTimeoutMs)", "generateStoryNarration(openAiApiKey, narratorModel, context, blueprint, '', narrationTimeoutMs, onRequestAttempt)")
assert text.count('        repairTimeoutMs,\n      )') == 1
text = text.replace('        repairTimeoutMs,\n      )', '        repairTimeoutMs,\n        onRequestAttempt,\n      )')
assert text.count('          repairRetryTimeoutMs,\n        )') == 1
text = text.replace('          repairRetryTimeoutMs,\n        )', '          repairRetryTimeoutMs,\n          onRequestAttempt,\n        )')
assert text.count('generateStoryNarration(openAiApiKey, escalationModel, context, blueprint, retryFeedback, escalationTimeoutMs)') == 1
text = text.replace('generateStoryNarration(openAiApiKey, escalationModel, context, blueprint, retryFeedback, escalationTimeoutMs)', 'generateStoryNarration(openAiApiKey, escalationModel, context, blueprint, retryFeedback, escalationTimeoutMs, onRequestAttempt)')
old_safety = '''    const [evaluation, moderation] = await Promise.all([
      evaluateStorySafety(openAiApiKey, safetyModel, context, candidate),
      moderateStoryText(openAiApiKey, candidateTextForModeration(candidate)),
    ])'''
new_safety = '''    // Both requests already started. Await BOTH so nested safety corrections are counted
    // before returning even if moderation rejects earlier. Verdicts still fail closed.
    const [evaluationOutcome, moderationOutcome] = await Promise.allSettled([
      evaluateStorySafety(openAiApiKey, safetyModel, context, candidate, onRequestAttempt),
      moderateStoryText(openAiApiKey, candidateTextForModeration(candidate), onRequestAttempt),
    ])
    if (evaluationOutcome.status === 'rejected') throw evaluationOutcome.reason
    if (moderationOutcome.status === 'rejected') throw moderationOutcome.reason
    const evaluation = evaluationOutcome.value
    const moderation = moderationOutcome.value'''
assert text.count(old_safety) == 1
text = text.replace(old_safety, new_safety)
assert text.count('adjudicateStoryFear(openAiApiKey, safetyModel, candidate)') == 1
text = text.replace('adjudicateStoryFear(openAiApiKey, safetyModel, candidate)', 'adjudicateStoryFear(openAiApiKey, safetyModel, candidate, onRequestAttempt)')
legacy_count = text.count("'X-QISSA-Provider-Calls': String(providerCalls),")
assert legacy_count >= 8, f'expected all success and failure exits to have legacy header, got {legacy_count}'
text = text.replace("'X-QISSA-Provider-Calls': String(providerCalls),", "'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),\n      'X-QISSA-Provider-Calls': String(providerCalls),")
assert text.count("'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),") == legacy_count
assert text.count('providerCalls += 1') == 1
index.write_text(text)
print(f'Applied v99: two HTTP boundaries, nested safety and moderation, {legacy_count} exit headers, request-scoped counter; no network or model calls.')
