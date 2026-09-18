import { readFileSync } from 'node:fs'
import { storyArchitectEditorialGuidance, storyNarratorEditorialGuidance } from '../supabase/functions/story-generate/editorial-guidance.ts'
import { choiceMenuScaffoldingNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'
import { textRepairRequiresFullStoryRewrite } from '../supabase/functions/story-generate/repair-routing.ts'

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
const newEvidence = readFileSync('docs/qissa/ai/reviews/2026-09-16_v81_e2_ab_diagnostic_success.md', 'utf8')
const failedE1 = readFileSync('docs/qissa/ai/reviews/2026-09-16_v83_e1_validation_failure.md', 'utf8')

for (const [label, content, phrases] of [
  ['Architect E1', architectE1, ['one concrete child-scale desire', 'something actually changes', 'Give {{HERO}} a specific fictional want', 'visibly different child actions', 'Resolve neither choice before', 'interchangeable group performance', 'ONE neutral decision cue', 'structured choice cards alone']],
  ['Architect E2', architectE2, ['one concrete child-scale desire', 'Episode 2 begins AFTER', 'finish tonight', 'Do not repeat Episode 1', 'No required refrain', 'particular action and method as binding canon', 'would not simply fit the unselected branch', 'Durable state_patch values', 'hero_trait should be null', 'unfinished phrase']],
  ['Narrator E1', narratorE1, ['immutable blueprint remains authoritative', 'Show an earned gentle joke', 'choice bridge', 'branch', 'qo‘shiqqa', 'Tikanning', '380-420-word story_text', 'hard minimum 320', 'count only words in story_text', 'ONE neutral', 'structured choice cards', 'mumkin ... yoki ... mumkin', '30-45 meaningful words']],
  ['Narrator E2', narratorE2, ['immutable blueprint remains authoritative', 'selected resolution_text has already been read', 'Never ask the child', 'calm closing image', 'an echo game needs calls and replies', 'undifferentiated simultaneous chorus']],
]) {
  for (const phrase of phrases) check(has(content, phrase), `${label} missing ${phrase}`)
}
check(!has(architectE2, 'Both safe choices pursue'), 'E2 must not include new-choices instruction')
check(!has(narratorE2, 'immediate choice bridges must show two'), 'E2 must not include E1 choice-building guidance')
check(has(split, 'storyArchitectEditorialGuidance(context)'), 'Architect must actually receive editorial guidance')
check(has(split, 'storyNarratorEditorialGuidance(context)'), 'Narrator must actually receive editorial guidance')
check(has(split, "'qissa_story_blueprint'") && has(split, "'qissa_story_narration'"), 'Existing structured JSON contracts must remain wired')
check(has(split, 'storyBlueprintSchema') && has(split, 'storyNarrationSchema'), 'Cannot bypass existing blueprint/narration schemas')
check(has(scorecard, 'at least 20/24') && has(scorecard, 'Choice-pair review'), 'Permanent human editorial gate must remain')
check(has(baseline, 'ITERATE — NOT family-beta qualified') && has(baseline, 'Branch-pair qualification: **INCOMPLETE**'), 'Baseline must not be labeled editorially qualified')
const scoreRows = baseline.split('\n').filter((line) => /^\| (Opening orientation|Story pull|Narrative roles|Description density|Momentum|Character life|Gentle delight \/ wonder|Choice quality|Bridge \+ continuation|Memory \/ continuity|Language \/ localization|Ending \/ bedtime curve) \|/.test(line))
check(scoreRows.length === 12, `Baseline must contain twelve separate dimensions; got ${scoreRows.length}`)
const total = scoreRows.reduce((sum, row) => sum + Number(row.match(/\| (\d)(?: \(provisional\))? \|/)?.[1] ?? Number.NaN), 0)
check(total === 14, `Baseline math changed: expected 14/24, got ${total}`)
check(has(baseline, '35061371574') && has(baseline, '35062412722'), 'Baseline must link to both actual runs')
for (const marker of ['35089384717', '35089754120', '12 → 13 → 14', 'NOT QUALIFIED', 'full original HTTP response envelope', 'no synthetic child profile']) {
  check(has(newEvidence.toLowerCase(), marker.toLowerCase()), `A/B evidence must preserve ${marker}`)
}
check(has(newEvidence, 'exact causes of the earlier') && has(newEvidence, 'remain UNKNOWN'), 'Later successful E2 is not retrospective diagnosis of earlier failures')
check(has(newEvidence, 'No new E1 calls') && has(newEvidence, 'NO-GO'), 'Economical test cannot be relabeled a qualified full-session acceptance')
for (const marker of ['35092551269', '104782056567', '14→15', 'story_words=273', '361', '278', 'story_choice_menu_scaffolding', 'provider-calls=4', 'NO-GO']) {
  check(has(failedE1, marker), `E1 rejection evidence must retain ${marker}`)
}
check(choiceMenuScaffoldingNeedsRewrite('uz', 'Do‘stlar xohlaganini aytishi mumkin. Yoki boshqacha aytishi ham mumkin.'), 'Visible alternative-menu boilerplate must still be rejected')
check(!choiceMenuScaffoldingNeedsRewrite('uz', 'Malika nima qilishini o‘yladi.'), 'One neutral E1 decision cue must remain valid')
check(textRepairRequiresFullStoryRewrite(e1, ['story_choice_menu_scaffolding']), 'Standalone scaffolding must be fully rewritten, never merely length-expanded')
check(textRepairRequiresFullStoryRewrite(e1, ['story_too_short', 'choice_resolution_too_short', 'story_choice_menu_scaffolding']), 'Actual v83 three-error combination must route to full rewrite')

if (errors.length) {
  console.error('Story editorial guidance and evidence contract FAILED:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}
console.log('Story editorial guidance / v83 rejected E1 evidence contract passed; no claim of real quality improvement or external editorial approval.')
