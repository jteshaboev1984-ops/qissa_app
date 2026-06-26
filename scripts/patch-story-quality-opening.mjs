import { readFileSync, writeFileSync } from 'node:fs'

const path = 'supabase/functions/story-generate/fallback.ts'
let source = readFileSync(path, 'utf8')

const replaceOnce = (before, after, label) => {
  const index = source.indexOf(before)
  if (index < 0) throw new Error(`Missing patch anchor: ${label}`)
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`Duplicate patch anchor: ${label}`)
  source = source.slice(0, index) + after + source.slice(index + before.length)
}

replaceOnce(
  "import { addWorldClosing } from './storyWorldClosings.ts'\n",
  "import { addWorldClosing } from './storyWorldClosings.ts'\nimport { addOpeningClosing } from './storyWorldOpeningClosings.ts'\n",
  'opening closing import',
)

replaceOnce(
  '    story_text: qualityNarrative?.episodeOneStory ?? referenceEpisodeOneStory(context, genericOpening),',
  '    story_text: qualityNarrative\n      ? addOpeningClosing(context, qualityNarrative.episodeOneStory)\n      : referenceEpisodeOneStory(context, genericOpening),',
  'quality opening closing',
)

writeFileSync(path, source)
console.log('Story opening quality patch applied.')
