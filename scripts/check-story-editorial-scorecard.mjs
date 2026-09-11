import { readFileSync } from 'node:fs'

const scorecard = readFileSync('docs/qissa/ai/09_FAMILY_BETA_EDITORIAL_SCORECARD.md', 'utf8')
const renderer = readFileSync('scripts/render-story-ai-sample.mjs', 'utf8')

const failures = []
const requireText = (label, source, fragments) => {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${label} is missing: ${fragment}`)
  }
}

requireText('family beta editorial scorecard', scorecard, [
  'would a 5–7-year-old want to hear what happens next',
  'at least 20/24',
  '**Story pull**',
  '**Gentle delight / wonder**',
  '**Choice quality**',
  '**Language / localization**',
  'Hard fails',
  'both choices produce effectively the same child-visible consequence',
  'Choice-pair review',
  'equally legitimate choices for the child',
  'Localization review',
  '“Wow” review',
  'next-session memory payoff',
  '`PASS`, `ITERATE`, or `REJECT`',
])

requireText('Story AI sample renderer', renderer, [
  'There is at least one earned funny, surprising, tender or imaginative moment worth remembering.',
  'Both choices are concrete hero actions, equally legitimate, and promise visibly different consequences.',
  'Resolution bridge is roughly 30–45 words',
  'Newly invented names/nicknames fit the selected language while custom/remembered/canon names stay unchanged.',
  'Dialogue, humor, interjections and forms of address sound native rather than translated.',
  'Cultural details fit the scene and do not feel like decorative regional stereotypes.',
  'The story does not explain its moral; values emerge from character action and consequence.',
  '09_FAMILY_BETA_EDITORIAL_SCORECARD.md',
])

if (failures.length > 0) {
  console.error('Story AI family beta editorial scorecard check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story AI family beta editorial scorecard and renderer contract check passed.')
