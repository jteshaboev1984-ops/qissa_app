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
  "import { getWorldNarrative, type WorldBranchNarrative } from './storyWorldNarratives.ts'\n",
  "import { getWorldNarrative, type WorldBranchNarrative } from './storyWorldNarratives.ts'\nimport { addWorldClosing } from './storyWorldClosings.ts'\n",
  'world closing import',
)

replaceOnce(
  '          storyText: qualityBranch.continuation,',
  '          storyText: addWorldClosing(context, latestChoice.choice_id, qualityBranch.continuation),',
  'quality continuation closing',
)

writeFileSync(path, source)
console.log('Story quality closing patch applied.')
