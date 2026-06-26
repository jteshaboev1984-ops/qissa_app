import { readFileSync, writeFileSync } from 'node:fs'

const path = 'supabase/functions/story-generate/fallback.ts'
let source = readFileSync(path, 'utf8')

const replaceOnce = (before, after, label) => {
  const index = source.indexOf(before)
  if (index < 0) throw new Error(`Missing patch anchor: ${label}`)
  if (source.indexOf(before, index + before.length) >= 0) {
    throw new Error(`Patch anchor is not unique: ${label}`)
  }
  source = source.slice(0, index) + after + source.slice(index + before.length)
}

replaceOnce(
  "} from './contracts.ts'\n",
  "} from './contracts.ts'\nimport { fallbackChoiceMemory, fallbackContinuationMemory } from './storyCoreBranches.ts'\n",
  'Story Core imports',
)

replaceOnce(
  `  if (context.isContinuation) {
    const latestChoice = context.choiceHistory[context.choiceHistory.length - 1]
    const remembered = latestChoice?.tomorrow_seed || latestChoice?.effect_summary || latestChoice?.choice_text || ''
    const candidate: StoryCandidate = {
      title: world.titleTwo[language],
      story_text: \`${'${remembered ? `${remembered} ` : ``}'}${'${common.continuation[language]}'}\`.trim(),
      choices: [],
      state_patch: patch('continued_saved_choice', ''),
      vocabulary: [],
      nextEpisodePreview: '',
    }
`,
  `  if (context.isContinuation) {
    const continuation = fallbackContinuationMemory(context)
    const candidate: StoryCandidate = {
      title: world.titleTwo[language],
      story_text: continuation.storyText,
      choices: [],
      state_patch: continuation.statePatch,
      vocabulary: [],
      nextEpisodePreview: '',
    }
`,
  'continuation branch',
)

replaceOnce(
  `  const makeChoice = (id: 'choice-a' | 'choice-b', text: string, icon: string): CandidateChoice => ({
    choice_id: id,
    text,
    effect_summary: language === 'ru'
      ? 'Этот выбор помогает друзьям и оставляет в мире добрый след.'
      : language === 'uz'
        ? 'Bu tanlov do‘stlarga yordam beradi va dunyoda mehribon iz qoldiradi.'
        : 'Бұл таңдау достарға көмектесіп, әлемде мейірімді із қалдырады.',
    resolution_text: common.resolution[language],
    tomorrow_seed: common.seed[language],
    choice_icon: icon,
    state_patch: patch(id, \`continue-${'${context.stylePackId}'}-${'${id}'}\`),
    value_alignment: id === 'choice-a' ? ['kindness', 'mutual_help'] : ['friendship', 'curiosity'],
  })
`,
  `  const makeChoice = (id: 'choice-a' | 'choice-b', text: string, icon: string): CandidateChoice => {
    const memory = fallbackChoiceMemory(context, id, text)
    return {
      choice_id: id,
      text,
      effect_summary: memory.effectSummary,
      resolution_text: memory.resolutionText,
      tomorrow_seed: memory.tomorrowSeed,
      choice_icon: icon,
      state_patch: memory.statePatch,
      value_alignment: id === 'choice-a' ? ['kindness', 'mutual_help'] : ['friendship', 'curiosity'],
    }
  }
`,
  'choice memory branch',
)

writeFileSync(path, source)
console.log('Story Core fallback patch applied.')
