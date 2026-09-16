import fs from 'node:fs'

const replaceOnce = (path, from, to, label) => {
  let text = fs.readFileSync(path, 'utf8')
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected exactly one match, got ${count}`)
  text = text.replace(from, to)
  fs.writeFileSync(path, text)
}

replaceOnce(
  'supabase/functions/story-generate/contracts.ts',
  "  const isContinuation = sessionEpisodeCount > 0 || (!explicitSessionIdentity && choiceHistory.length > 0)",
  "  const isContinuation = storyMode === 'series' && (sessionEpisodeCount > 0 || (!explicitSessionIdentity && choiceHistory.length > 0))",
  'C10 one_time continuation gate',
)

replaceOnce(
  'supabase/functions/story-generate/safety.ts',
  "export const storyRepeatsChoiceMenu = (context: NormalizedStoryContext, candidate: StoryCandidate): boolean => {\n  if (context.episodeIndex !== 1 || !Array.isArray(candidate.choices) || candidate.choices.length < 2 || typeof candidate.story_text !== 'string') return false\n  const finalParagraph = paragraphs(candidate.story_text).at(-1) ?? ''\n  const finalWords = significantChoiceWords(finalParagraph)\n  if (finalWords.size < 4) return false\n\n  return candidate.choices.every((choice) => {\n    if (!isRecord(choice) || typeof choice.text !== 'string') return false\n    const choiceWords = significantChoiceWords(choice.text)\n    if (choiceWords.size < 3) return false\n    const overlap = [...choiceWords].filter((word) => finalWords.has(word)).length\n    return overlap >= Math.max(3, Math.ceil(choiceWords.size * 0.35))\n  })\n}",
  "export const textRepeatsStructuredChoiceMenu = (text: string, choices: unknown): boolean => {\n  if (!Array.isArray(choices) || choices.length < 2) return false\n  const finalParagraph = paragraphs(text).at(-1) ?? ''\n  const finalWords = significantChoiceWords(finalParagraph)\n  if (finalWords.size < 4) return false\n\n  return choices.every((choice) => {\n    if (!isRecord(choice) || typeof choice.text !== 'string') return false\n    const choiceWords = significantChoiceWords(choice.text)\n    if (choiceWords.size < 3) return false\n    const overlap = [...choiceWords].filter((word) => finalWords.has(word)).length\n    return overlap >= Math.max(3, Math.ceil(choiceWords.size * 0.35))\n  })\n}\n\nexport const storyRepeatsChoiceMenu = (context: NormalizedStoryContext, candidate: StoryCandidate): boolean => {\n  if (context.episodeIndex !== 1 || typeof candidate.story_text !== 'string') return false\n  return textRepeatsStructuredChoiceMenu(candidate.story_text, candidate.choices)\n}",
  'C11 shared menu-overlap detector',
)

replaceOnce(
  'supabase/functions/story-generate/story-architecture.ts',
  "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, genericHeroAliasNeedsRewrite, russianHeroTokenNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'",
  "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, genericHeroAliasNeedsRewrite, russianHeroTokenNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, textRepeatsStructuredChoiceMenu, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'",
  'C11 shared detector import',
)
replaceOnce(
  'supabase/functions/story-generate/story-architecture.ts',
  "  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')\n  else if (context.episodeIndex === 1 && choiceMenuScaffoldingNeedsRewrite(context.language, value.decision_point)) errors.push('blueprint_choice_menu_scaffolding')",
  "  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')\n  else if (context.episodeIndex === 1 && (choiceMenuScaffoldingNeedsRewrite(context.language, value.decision_point) || textRepeatsStructuredChoiceMenu(value.decision_point, value.choices))) errors.push('blueprint_choice_menu_scaffolding')",
  'C11 Architect direct-menu preflight',
)

const testPath = 'scripts/check-story-cross-layer-contracts.mjs'
let test = fs.readFileSync(testPath, 'utf8')
const marker = "console.log('Cross-layer story contracts GREEN: C1–C9, including effect-summary alignment, one-time preview parity and immutable RU hero grammar; zero provider calls.')\n"
if (!test.includes(marker)) throw new Error('C10-C11 test insertion marker missing')
const extra = `\n// C10: one_time is always a single E1 interaction, even if stale series-shaped state carries episodeCount/history.\nconst staleOneTimeContext = normalizeStoryRequest({\n  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'one_time', storyMood: 'bedtime' },\n  seriesState: { id: 'one-time-stale-contract', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [{ choice_id: 'old', choice_text: 'Old', effect_summary: 'Old', resolution_text: 'Old', tomorrow_seed: 'Old' }], episodeCount: 1 },\n})\nassert.ok(staleOneTimeContext && staleOneTimeContext.episodeIndex === 1 && staleOneTimeContext.isContinuation === false, 'C10 stale one_time state created Episode 2')\n\n// C11: Architect must reject a decision point that itself repeats both structured choice labels.\nconst directMenu = structuredClone(blueprint)\ndirectMenu.decision_point = 'Barglardan rasm yasash yoki birgalikda qo‘shiq aytish?'\nassert.ok(validateStoryBlueprint(context, directMenu).includes('blueprint_choice_menu_scaffolding'), 'C11 direct structured menu reached paid Narrator')\nassert.deepEqual(validateStoryBlueprint(context, blueprint), [], 'C11 neutral decision point falsely rejected')\n\nconsole.log('Cross-layer story contracts GREEN: C1–C11, including one-time episode identity and upstream direct-menu overlap rejection; zero provider calls.')\n`
test = test.replace(marker, extra)
fs.writeFileSync(testPath, test)
console.log('Applied C10-C11 source fixes and permanent regressions.')
