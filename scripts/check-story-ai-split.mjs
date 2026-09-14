import fs from 'node:fs'

const architecture = fs.readFileSync('supabase/functions/story-generate/story-architecture.ts', 'utf8')
const provider = fs.readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')
const orchestrator = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
const scalingDoc = fs.readFileSync('docs/qissa/17_QISSA_Split_Story_Architecture_and_Series_Scaling_2026_09.md', 'utf8')

const failures = []

const requireFragments = (label, text, fragments) => {
  for (const fragment of fragments) {
    if (!text.includes(fragment)) failures.push(`${label} is missing: ${fragment}`)
  }
}

requireFragments('architecture', architecture, [
  "plan_version: 'split-v1'",
  'storyBlueprintSchema',
  'storyNarrationSchema',
  'validateStoryBlueprint',
  'narrationToCandidate',
  'The architecture is the source of truth for canon, branch consequences and memory.',
  'The blueprint owns plot, choices, canon, relationships and branch consequences.',
  'Prefer updating an existing canon key when a persistent fact changes.',
  'Never import consequences from an unselected branch.',
  'For Episode 2, continue after the already-confirmed resolution bridge',
  "target_story_words: target",
])

const narrationSchemaStart = architecture.indexOf('export const storyNarrationSchema')
const narrationSchemaEnd = architecture.indexOf('const languageNames', narrationSchemaStart)
const narrationSchema = architecture.slice(narrationSchemaStart, narrationSchemaEnd)
for (const forbidden of ['state_patch', 'canon_updates', 'relationship_updates', 'tomorrow_seed', 'effect_summary']) {
  if (narrationSchema.includes(forbidden)) failures.push(`Narrator schema must not own ${forbidden}`)
}

requireFragments('split provider', provider, [
  'generateStoryBlueprint',
  'generateStoryNarration',
  "'qissa_story_blueprint'",
  "'qissa_story_narration'",
  '1800',
  '3200',
  "'none'",
])

requireFragments('split orchestrator', orchestrator, [
  "'X-QISSA-Story-Pipeline': 'split-v1'",
  "'gpt-5.6-luna'",
  "OPENAI_NARRATOR_ESCALATION_MODEL",
  "|| ''",
  'validateStoryBlueprint(context, blueprint)',
  'narrationToCandidate(context, blueprint, narration)',
  'repairStoryCandidateTextLengths',
  'evaluateStorySafety',
  'moderateStoryText',
  "'X-QISSA-Provider-Calls'",
  "'X-QISSA-Escalation-Used'",
])

if (orchestrator.includes("OPENAI_NARRATOR_ESCALATION_MODEL')?.trim() || 'gpt-5.6-sol'")) {
  failures.push('Sol escalation must remain opt-in during tuning')
}

requireFragments('scaling architecture doc', scalingDoc, [
  'bedtime session',
  'series_id',
  'session_id',
  'session_index',
  'segment_index',
  'compact active memory',
  'old story prose remains archived outside the prompt',
])

if (failures.length > 0) {
  console.error('Split Story AI architecture contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Split Story AI contract passed: Architect owns canon/branches, Narrator owns prose only, Luna is default, Sol escalation is opt-in, and long-series identity/memory scaling is documented.')
