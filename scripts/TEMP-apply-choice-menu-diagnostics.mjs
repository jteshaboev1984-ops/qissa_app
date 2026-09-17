import { readFileSync, writeFileSync } from 'node:fs'
const path = 'supabase/functions/story-generate/story-architecture.ts'
const source = readFileSync(path, 'utf8')
const oldBlock = `  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')
  else if (context.episodeIndex === 1 && (choiceMenuScaffoldingNeedsRewrite(context.language, value.decision_point) || textRepeatsStructuredChoiceMenu(value.decision_point, value.choices))) errors.push('blueprint_choice_menu_scaffolding')
`
const newBlock = `  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')
  else if (context.episodeIndex === 1) {
    if (choiceMenuScaffoldingNeedsRewrite(context.language, value.decision_point)) errors.push('blueprint_choice_menu_meta_phrasing')
    if (textRepeatsStructuredChoiceMenu(value.decision_point, value.choices)) errors.push('blueprint_choice_menu_repeats_cards')
  }
`
if (source.split(oldBlock).length !== 2) throw new Error('exact decision_point validation block not found once')
writeFileSync(path, source.replace(oldBlock, newBlock))
console.log('patched story-architecture decision_point diagnostics')
