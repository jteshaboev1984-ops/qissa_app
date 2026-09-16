import { readFileSync } from 'node:fs'
import { storyArchitectEditorialGuidance, storyNarratorEditorialGuidance } from '../supabase/functions/story-generate/editorial-guidance.ts'

const errors = []
const check = (condition, message) => { if (!condition) errors.push(message) }
const has = (source, phrase) => source.includes(phrase)
const e1 = { episodeIndex: 1 }
const e2 = { episodeIndex: 2 }
const architectE1 = storyArchitectEditorialGuidance(e1)
const architectE2 = storyArchitectEditorialGuidance(e2)
const narratorE1 = storyNarratorEditorialGuidance(e1)
const narratorE2 = storyNarratorEditorialGuidance(e2)
const split = readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')
const scorecard = readFileSync('docs/qissa/ai/09_FAMILY_BETA_EDITORIAL_SCORECARD.md', 'utf8')
const baseline = readFileSync('docs/qissa/ai/reviews/2026-09-16_malika_uz_v79-e1_v80-e2_baseline.md', 'utf8')

for (const [label, content, phrases] of [
  ['Architect E1', architectE1, ['one concrete child-scale desire', 'something actually changes', 'Give {{HERO}} a specific fictional want', 'visibly different child actions', 'Resolve neither choice before']],
  ['Architect E2', architectE2, ['one concrete child-scale desire', 'Episode 2 begins AFTER', 'finish tonight', 'Do not repeat Episode 1', 'no required refrain']],
  ['Narrator E1', narratorE1, ['immutable blueprint remains authoritative', 'Show an earned gentle joke', 'immediate choice bridges', 'branch-neutral']],
  ['Narrator E2', narratorE2, ['immutable blueprint remains authoritative', 'selected resolution_text has already been read', 'Never ask the child', 'calm closing image']],
]) {
  for (const phrase of phrases) check(has(content, phrase), `${label} missing ${phrase}`)
}
check(!has(architectE2, 'Both safe choices pursue'), 'E2 must not include new-choices instruction')
check(!has(narratorE2, 'immediate choice bridges must show two'), 'E2 must not include E1 choice-building guidance')
check(has(split, 'storyArchitectEditorialGuidance(context)'), 'Architect must actually receive editorial guidance')
check(has(split, 'storyNarratorEditorialGuidance(context)'), 'Narrator must actually receive editorial guidance')
check(has(split, "'qissa_story_blueprint'" ) && has(split, "'qissa_story_narration'"), 'Existing structured JSON contracts must remain wired')
check(has(split, 'storyBlueprintSchema') && has(split, 'storyNarrationSchema'), 'Cannot bypass existing blueprint/narration schemas')
check(has(scorecard, 'at least 20/24') && has(scorecard, 'Choice-pair review'), 'Permanent human editorial gate must remain')
check(has(baseline, 'ITERATE — NOT family-beta qualified') && has(baseline, 'Branch-pair qualification: **INCOMPLETE**'), 'Baseline must not be labeled editorially qualified')
const scoreRows = baseline.split('\n').filter((line) => /^\| (Opening orientation|Story pull|Narrative roles|Description density|Momentum|Character life|Gentle delight \/ wonder|Choice quality|Bridge \+ continuation|Memory \/ continuity|Language \/ localization|Ending \/ bedtime curve) \|/.test(line))
check(scoreRows.length === 12, `Baseline must contain twelve separate dimensions; got ${scoreRows.length}`)
const total = scoreRows.reduce((sum, row) => sum + Number(row.match(/\| (\d)(?: \(provisional\))? \|/)?.[1] ?? Number.NaN), 0)
check(total === 14, `Baseline math changed: expected 14/24, got ${total}`)
check(has(baseline, '35061371574') && has(baseline, '35062412722'), 'Baseline must link to both actual runs')

if (errors.length) {
  console.error('Story editorial guidance and evidence contract FAILED:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}
console.log('Story editorial guidance and honest baseline evidence contract passed (12 dimensions; 14/24 provisional ITERATE).')
