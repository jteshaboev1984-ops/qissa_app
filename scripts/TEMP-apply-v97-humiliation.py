from pathlib import Path

openai_path = Path('supabase/functions/story-generate/openai.ts')
text = openai_path.read_text()

old_import = "import { fearAdjudicationConsistencyErrors, fearAdjudicationOutputSchema, type FearAdjudication } from './fear-adjudication.ts'\n"
new_import = old_import + "import { humiliationAdjudicationConsistencyErrors, humiliationAdjudicationOutputSchema, type HumiliationAdjudication } from './humiliation-adjudication.ts'\n"
assert text.count(old_import) == 1
text = text.replace(old_import, new_import)

anchor = "const requestFearAdjudication = async (\n"
assert text.count(anchor) == 1
humiliation_request = """const requestHumiliationAdjudication = async (\n  apiKey: string,\n  model: string,\n  candidateJson: string,\n): Promise<HumiliationAdjudication> => requestStructured<HumiliationAdjudication>(\n  apiKey,\n  model,\n  'qissa_humiliation_adjudication',\n  humiliationAdjudicationOutputSchema,\n  [\n    'You are the narrow child humiliation adjudicator for QISSA.',\n    'Classify ONLY whether the exact child-visible material contains clear targeted interpersonal humiliation.',\n    'humiliation=true only for targeted mockery, demeaning name-calling, public shaming, belittling, coercive shame, or comparable clear treatment that lowers a character’s dignity.',\n    'Shyness, looking down, touching paws or hands together, blushing, a quiet voice, an ordinary mistake, supportive correction, self-conscious body language, or harmless shared laughter that is not directed at a character is NOT humiliation by itself.',\n    'If humiliation is present, choose the matching category and copy one short exact excerpt from the supplied child-visible text into evidence. Do not paraphrase or invent evidence.',\n    'If no clear humiliation is directly supported, return humiliation=false, category=none, evidence as an empty string.',\n    'Do not classify fear, violence, bedtime stimulation or any other safety category here.',\n  ].join(' '),\n  candidateJson,\n  8_000,\n  260,\n  'low',\n)\n\n"""
text = text.replace(anchor, humiliation_request + anchor)

fear_gate_anchor = "const needsInteractiveFearConfirmation = (\n"
assert text.count(fear_gate_anchor) == 1
humiliation_gate = """const needsIsolatedHumiliationConfirmation = (\n  context: NormalizedStoryContext,\n  evaluation: SafetyEvaluation,\n): boolean => {\n  if (!(context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime')) return false\n  if (evaluation.flags.humiliation !== true) return false\n  return Object.entries(evaluation.flags).every(([flag, value]) => flag === 'humiliation' || value !== true)\n}\n\n"""
text = text.replace(fear_gate_anchor, humiliation_gate + fear_gate_anchor)

old_eval_tail = """  if (!needsInteractiveFearConfirmation(context, evaluation)) return evaluation\n\n  // General semantic safety remains authoritative for every named flag. When Episode 1 is\n"""
assert text.count(old_eval_tail) == 1
new_eval_tail = """  if (needsIsolatedHumiliationConfirmation(context, evaluation)) {\n    const adjudication = await requestHumiliationAdjudication(apiKey, model, candidateJson)\n    const adjudicationErrors = humiliationAdjudicationConsistencyErrors(adjudication, childVisibleStorySafetyText(candidate))\n    if (adjudicationErrors.length > 0) throw new Error('openai_humiliation_adjudication_inconsistent')\n\n    if (adjudication.humiliation) {\n      evaluation = {\n        ...evaluation,\n        notes: [\n          `humiliation_adjudication:${adjudication.category}`,\n          `humiliation_evidence:${adjudication.evidence}`,\n        ],\n      }\n    } else {\n      const cleared: SafetyEvaluation = {\n        approved: true,\n        risk_level: 'low',\n        flags: { ...evaluation.flags, humiliation: false },\n        required_action: 'publish',\n        notes: ['isolated humiliation was not confirmed by narrow humiliation adjudication'],\n      }\n      const clearedErrors = safetyEvaluationConsistencyErrors(cleared)\n      if (clearedErrors.length > 0) throw new Error('openai_safety_evaluation_inconsistent')\n      evaluation = cleared\n    }\n  }\n\n  if (!needsInteractiveFearConfirmation(context, evaluation)) return evaluation\n\n  // General semantic safety remains authoritative for every named flag. When Episode 1 is\n"""
text = text.replace(old_eval_tail, new_eval_tail)
openai_path.write_text(text)

package_path = Path('package.json')
package = package_path.read_text()
old = '"check:story-ai": "node scripts/check-story-ai-safety.mjs && node scripts/check-story-safety-verdict.mjs",'
new = '"check:story-ai": "node scripts/check-story-ai-safety.mjs && node scripts/check-story-safety-verdict.mjs && node scripts/check-story-humiliation-adjudication.mjs",'
assert package.count(old) == 1
package_path.write_text(package.replace(old, new))

latency_path = Path('scripts/check-story-latency-budget.mjs')
latency = latency_path.read_text()
needle = "assert.match(repair, /retryFeedback = ''\\s*,\\s*timeoutMs = 30_000/, 'Repair must accept remaining-time cap')\n"
assert latency.count(needle) == 1
addition = needle + "assert.match(repair, /requestSafetyEvaluation[\\s\\S]*timeoutMs = 12_000/, 'Primary semantic safety remains capped at 12s')\nassert.match(repair, /requestHumiliationAdjudication[\\s\\S]*8_000[\\s\\S]*260[\\s\\S]*'low'/, 'Isolated humiliation adjudication is bounded to 8s')\nassert.match(repair, /requestFearAdjudication[\\s\\S]*8_000[\\s\\S]*260[\\s\\S]*'low'/, 'Existing fear adjudication remains bounded to 8s')\nassert.ok(12_000 + 8_000 + 8_000 + 8_000 <= STORY_SAFETY_RESERVE_MS, 'Worst bounded safety path must fit the 38s reserve: primary + consistency correction + humiliation adjudication + moderation fear adjudication')\n"
latency_path.write_text(latency.replace(needle, addition))
