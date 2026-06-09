import fs from 'node:fs'

const filesToCheck = [
  'src/lib/storyAgent.ts',
  'src/i18n/dictionaries.ts',
  'src/screens/HomeScreen.tsx',
  'src/screens/StoryScreen.tsx',
  'src/screens/WelcomeScreen.tsx',
  'src/features/onboarding/OnboardingFlow.tsx',
]

const bannedStrings = [
  ['old generic Episode 1 title', 'Тёплый вечер в мире'],
  ['old generic Episode 2 title', 'Утренний след выбора'],
  ['meta next preview RU', 'История запомнит выбор'],
  ['meta next preview UZ', 'Hikoya tanlovni eslab qoladi'],
  ['meta next preview KZ', 'Оқиға таңдауды есте сақтайды'],
  ['terminal paste artifact', 'PYint('],
  ['terminal paste artifact', '^[[200~'],
  ['terminal paste artifact', '^[[201~'],
  ['English placeholder leak', 'gently'],
  ['generic RU world effect', 'Мир станет спокойнее'],
  ['generic RU world resolution', 'В мире стало мягче'],
  ['generic RU world response', 'Мир ответил спокойствием'],
  ['generic RU path result', 'Герой выбрал путь'],
  ['generic RU path continuation', 'На тропинке остался вчерашний мягкий знак'],
  ['broken UZ spacing', 'Eskidumaloq'],
  ['broken KZ spacing', 'томарқасында'],
  ['broken RU spacing', 'нижнейветки'],
  ['broken UZ spacing', 'o‘rmontinchidi'],
]

const bannedRegexes = [
  ['RU meta world remembers', /(?:Мир|мир)\s+(?:помнил|помнит|мягко помнил)/],
  ['RU choice remembered wording', /помнили выбор/],
  ['UZ world remembers wording', /Olam .*esladi/],
  ['UZ choice remembered wording', /tanlov esda edi/],
  ['KZ world remembers wording', /Әлем .*есте сақтады/],
  ['KZ choice remembered wording', /таңдау есте еді/],
]

const issues = []

for (const file of filesToCheck) {
  if (!fs.existsSync(file)) continue
  const text = fs.readFileSync(file, 'utf8')

  for (const [label, needle] of bannedStrings) {
    if (text.includes(needle)) {
      issues.push(`${file}: ${label}: ${needle}`)
    }
  }

  for (const [label, regex] of bannedRegexes) {
    const match = text.match(regex)
    if (match) {
      issues.push(`${file}: ${label}: ${match[0]}`)
    }
  }
}

if (issues.length > 0) {
  console.error('Story copy check failed:')
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log('story copy check passed.')
