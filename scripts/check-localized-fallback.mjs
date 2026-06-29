import { readFileSync } from 'node:fs'

const fallback = readFileSync('supabase/functions/story-generate/fallback.ts', 'utf8')

const checks = [
  {
    ok: !fallback.includes('`${world.opening[language]} {{HERO}} остановился'),
    message: 'genericOpening must not append one Russian sentence to every language.',
  },
  {
    ok: fallback.includes('genericOpeningTail[language]'),
    message: 'genericOpening must use a localized tail for ru/uz/kz.',
  },
  {
    ok: fallback.includes('{{HERO}} oldida ikki sokin yo‘l bor edi'),
    message: 'Uzbek generic opening tail is missing.',
  },
  {
    ok: fallback.includes('{{HERO}} алдында екі тыныш жол тұрды'),
    message: 'Kazakh generic opening tail is missing.',
  },
]

for (const check of checks) {
  if (!check.ok) throw new Error(check.message)
}

console.log('localized fallback check passed: generic openings are language-specific.')
