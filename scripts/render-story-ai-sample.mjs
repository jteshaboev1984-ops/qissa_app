import fs from 'node:fs'

const [episode1Path, selectedChoiceId, episode2Path] = process.argv.slice(2)

if (!episode1Path || !selectedChoiceId || !episode2Path) {
  console.error('Usage: node scripts/render-story-ai-sample.mjs <episode1-response.json> <choice-id> <episode2-response.json>')
  process.exit(2)
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const unwrapEpisode = (payload) => payload && typeof payload === 'object' && payload.episode
  ? payload.episode
  : payload

const episode1 = unwrapEpisode(readJson(episode1Path))
const episode2 = unwrapEpisode(readJson(episode2Path))

const requireEpisode = (label, episode) => {
  if (!episode || typeof episode !== 'object') throw new Error(`${label}: missing episode object`)
  if (typeof episode.title !== 'string' || typeof episode.story_text !== 'string') {
    throw new Error(`${label}: missing title/story_text`)
  }
  if (!Array.isArray(episode.choices)) throw new Error(`${label}: missing choices array`)
}

requireEpisode('episode1', episode1)
requireEpisode('episode2', episode2)

const selectedChoice = episode1.choices.find((choice) => choice?.choice_id === selectedChoiceId)
if (!selectedChoice) {
  const available = episode1.choices.map((choice) => choice?.choice_id).filter(Boolean).join(', ')
  throw new Error(`selected choice ${selectedChoiceId} not found; available: ${available || 'none'}`)
}

if (episode1.choices.length !== 2) throw new Error(`episode1: expected 2 choices, received ${episode1.choices.length}`)
if (episode2.choices.length !== 0) throw new Error(`episode2: expected 0 choices, received ${episode2.choices.length}`)
if (typeof selectedChoice.resolution_text !== 'string') throw new Error('selected choice: missing resolution_text')

const countWords = (text) => text.trim().split(/\s+/u).filter(Boolean).length
const ep1Words = countWords(episode1.story_text)
const bridgeWords = countWords(selectedChoice.resolution_text)
const ep2Words = countWords(episode2.story_text)
const totalWords = ep1Words + bridgeWords + ep2Words
const minutesAt140 = totalWords / 140
const choicePct = totalWords > 0 ? (ep1Words / totalWords) * 100 : 0

const metric = (label, value) => `- **${label}:** ${value}`
const choiceLine = (choice, index) => `- **${String.fromCharCode(65 + index)} — ${choice.choice_id}:** ${choice.text}`

const output = [
  '# QISSA Story AI editorial sample',
  '',
  '> Review this as a complete child-facing story. The child is the listener/decision-maker; ordinary prose should remain about the in-world hero.',
  '',
  '## Episode 1',
  '',
  `### ${episode1.title}`,
  '',
  episode1.story_text,
  '',
  '## Child choice moment',
  '',
  ...episode1.choices.map(choiceLine),
  '',
  `**Selected for this review:** ${selectedChoice.text}`,
  '',
  '### Resolution bridge',
  '',
  selectedChoice.resolution_text,
  '',
  '## Episode 2',
  '',
  `### ${episode2.title}`,
  '',
  episode2.story_text,
  '',
  '## Session metrics',
  '',
  metric('World', episode1.stylePackId ?? 'unknown'),
  metric('Mode / mood', `${episode1.mode ?? 'unknown'} / ${episode1.mood ?? 'unknown'}`),
  metric('Episode 1 words', ep1Words),
  metric('Bridge words', bridgeWords),
  metric('Episode 2 words', ep2Words),
  metric('Total words', totalWords),
  metric('Estimated duration at 140 WPM', `${minutesAt140.toFixed(2)} min`),
  metric('Choice position', `${choicePct.toFixed(1)}% of spoken story before the bridge`),
  '',
  '## Human editorial review',
  '',
  '- [ ] First paragraph clearly orients world, hero and current situation.',
  '- [ ] By roughly 100–120 words there is a clear reason to keep listening.',
  '- [ ] The child remains outside ordinary story prose and participates at the explicit choice moment.',
  '- [ ] The hero has a clear child-scale desire/problem/question.',
  '- [ ] Description serves the action and never becomes a long static block.',
  '- [ ] After setup, something meaningfully changes every 1–2 short paragraphs.',
  '- [ ] Dialogue, reactions and character traits make the cast feel alive.',
  '- [ ] Both choices are concrete hero actions with visibly different consequences.',
  '- [ ] Episode 2 continues after the bridge without replaying the selected action.',
  '- [ ] Prior memory/state is reflected concretely when available.',
  '- [ ] Language sounds natural and age-appropriate rather than generated or translated.',
  '- [ ] The original story question is solved before a calm, complete bedtime coda.',
  '',
].join('\n')

process.stdout.write(output)
