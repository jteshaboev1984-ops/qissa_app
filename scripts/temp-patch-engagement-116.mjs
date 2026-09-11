import { readFileSync, writeFileSync } from 'node:fs'

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before)
  if (first < 0) throw new Error(`${label}: expected source block not found`)
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: source block is not unique`)
  return source.replace(before, after)
}

const promptPath = 'supabase/functions/story-generate/prompt.ts'
let prompt = readFileSync(promptPath, 'utf8')

const oldBudget = `      beat_budget: [
        'opening / orientation: about 60-80 words — who, where, bedtime atmosphere, and what normal evening looks like',
        'gentle need / problem: about 70-90 words — introduce exactly one concrete goal that can be solved tonight',
        'exploration / build-up: about 120-150 words — discover only the details needed to make the decision meaningful; do not add a second unrelated problem',
        'choice setup: about 60-80 words — make both options understandable as two safe ways to solve the SAME established goal, then ask the child without another delay beat',
      ],`
const newBudget = `      beat_budget: [
        'opening hook / orientation: about 35-50 words — begin with dialogue, visible action, a funny or surprising event, or an immediate child-scale question/problem; add only the minimum setting detail needed to picture the moment',
        'desire / problem: about 55-75 words — make what the character wants understandable within roughly the first 100 words',
        'exploration / build-up: about 150-180 words — move through action, dialogue, reactions and discoveries that deepen the same goal; description must serve what is happening',
        'choice setup: about 55-70 words — make both options understandable as two safe ways to solve the SAME established goal, then ask the child without another delay beat',
      ],`
prompt = replaceOnce(prompt, oldBudget, newBudget, 'beat budget')

const calmness = `  calmness: 'Create calmness through scene, rhythm, sensory detail and a warm ending. Do not pad the story by repeatedly saying calm, quiet, slow, gentle, safe or unhurried.',\n`
const engagementFields = `${calmness}  opening_hook: context.ageGroup === '5-7' ? 'Hook the child within roughly the first 30-50 words through dialogue, visible action, a funny or surprising event, a clear desire, or an immediate question/problem. Do not spend the opening paragraph mainly describing scenery. Make the main desire/problem understandable within roughly the first 100 words.' : 'Open with a concrete event or desire before extended description.',\n  description_budget: 'Description must support current action. Prefer one or two concrete sensory details, then move. Avoid three or more consecutive sentences of static scenery, decorative lists, or narrator explanation that could be shown through a character reaction.',\n  scene_momentum: 'Every one or two short paragraphs should contain a meaningful change: somebody acts, reacts, discovers, asks, answers, jokes, tries, makes a small mistake, notices a clue, or decides. Bedtime can stay gentle without becoming uneventful.',\n  anticipation: 'Keep one simple anticipation loop alive until the payoff: a funny problem, small mystery, question, goal or plan the child wants to see resolved. Pay it off before the final bedtime coda rather than replacing it with a lesson.',\n`
prompt = replaceOnce(prompt, calmness, engagementFields, 'engagement fields')

const oldCharacter = `    ? 'Use one child-scale desire or problem, concrete action, 2-3 memorable supporting characters, natural dialogue, visible reactions, gentle humor or wonder, and one small surprise when it serves the same plot.'`
const newCharacter = `    ? 'Use one child-scale desire or problem, concrete action, 2-3 memorable supporting characters, natural dialogue, visible reactions, gentle humor or wonder, and one small surprise when it serves the same plot. Let dialogue and visible action carry most of the story rather than static description.'`
prompt = replaceOnce(prompt, oldCharacter, newCharacter, 'character guidance')

const systemAnchor = `    'Create bedtime calmness through scene, rhythm, sensory detail and a warm ending, not by repeatedly saying calm, quiet, slow, gentle, safe or unhurried.',\n`
const systemReplacement = `${systemAnchor}    'Hook ages 5-7 within roughly the first 30-50 words using dialogue, visible action, a funny or surprising event, a clear desire, or an immediate question/problem; do not open with a long block of scenery.',\n    'Keep description lean: use one or two concrete sensory details that matter to the current action, then move the scene forward.',\n    'Keep scene momentum: every one or two short paragraphs should contain an action, reaction, discovery, exchange, joke, attempt, small mistake, clue, or decision.',\n    'Maintain one simple anticipation loop the child wants resolved, and pay it off before the final bedtime coda.',\n`
prompt = replaceOnce(prompt, systemAnchor, systemReplacement, 'system engagement guidance')
writeFileSync(promptPath, prompt)

const checkPath = 'scripts/check-story-ai-safety.mjs'
let check = readFileSync(checkPath, 'utf8')
const checkAnchor = `  'Create bedtime calmness through scene, rhythm, sensory detail and a warm ending',\n`
const checkReplacement = `${checkAnchor}  'Hook the child within roughly the first 30-50 words',\n  'Do not spend the opening paragraph mainly describing scenery.',\n  'Prefer one or two concrete sensory details, then move.',\n  'Every one or two short paragraphs should contain a meaningful change',\n  'Keep one simple anticipation loop alive until the payoff',\n  'Let dialogue and visible action carry most of the story rather than static description.',\n  'opening hook / orientation: about 35-50 words',\n  'make what the character wants understandable within roughly the first 100 words',\n  'Hook ages 5-7 within roughly the first 30-50 words',\n  'Keep scene momentum: every one or two short paragraphs',\n`
check = replaceOnce(check, checkAnchor, checkReplacement, 'Story AI CI contract')
writeFileSync(checkPath, check)

const editorialPath = 'docs/qissa/ai/05_CHILD_FIRST_CLOSED_BETA_EDITORIAL.md'
let editorial = readFileSync(editorialPath, 'utf8')
const marker = `## Future provider generation\n\n`
const providerRules = `## Future provider generation\n\n- The deterministic fallback is a safe demo/recovery baseline, not the final engagement ceiling. Future generated stories must also satisfy \`06_GENERATED_STORY_ENGAGEMENT_CONTRACT.md\`.\n- For ages 5–7, hook quickly, minimize static description, keep scenes moving through action/dialogue, and maintain one child-scale anticipation loop until payoff. Bedtime calmness should increase mainly after the story has delivered that payoff.\n`
editorial = replaceOnce(editorial, marker, providerRules, 'provider editorial section')
writeFileSync(editorialPath, editorial)

console.log('Applied generated-story engagement contract patch.')
