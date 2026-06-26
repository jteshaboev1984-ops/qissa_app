import { readFileSync, writeFileSync } from 'node:fs'

const replaceOnce = (source, before, after, label) => {
  const index = source.indexOf(before)
  if (index < 0) throw new Error(`Missing anchor: ${label}`)
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`Duplicate anchor: ${label}`)
  return source.slice(0, index) + after + source.slice(index + before.length)
}

const screenPath = 'src/screens/StoryScreen.tsx'
let screen = readFileSync(screenPath, 'utf8')
screen = replaceOnce(
  screen,
  "import { t } from '../lib/i18n'\n",
  "import { t } from '../lib/i18n'\nimport { getSeriesFinalCopy } from '../lib/storyExperienceCopy'\n",
  'StoryScreen editorial import',
)
screen = replaceOnce(
  screen,
  `  const renderSeriesFinal = () => {
    if (!isSeriesFinal) return null

    return (
`,
  `  const renderSeriesFinal = () => {
    if (!isSeriesFinal) return null
    const completionCopy = getSeriesFinalCopy(language)

    return (
`,
  'StoryScreen completion copy',
)
screen = replaceOnce(
  screen,
  `          <h3 className="q-heading text-3xl font-bold leading-tight">{t(language, 'story.series_final_title')}</h3>
          <p className="mx-auto max-w-xs text-sm leading-6 text-[#625846]">{t(language, 'story.series_final_body')}</p>`,
  `          <h3 className="q-heading text-3xl font-bold leading-tight">{completionCopy.title}</h3>
          <p className="mx-auto max-w-xs text-sm leading-6 text-[#625846]">{completionCopy.body}</p>`,
  'StoryScreen final card',
)
writeFileSync(screenPath, screen)

const dictionaryPath = 'src/i18n/dictionaries.ts'
let dictionaries = readFileSync(dictionaryPath, 'utf8')
const replacements = [
  ["'home.completed_series_title':'Серия завершена'", "'home.completed_series_title':'Эта глава завершилась'"],
  ["'home.completed_series_body':'Вы дошли до конца текущей версии истории. Можно открыть последнюю серию или начать новую историю.'", "'home.completed_series_body':'Герой вернулся в тихое место, а сказочный мир готовится к новой встрече. Можно перечитать эту главу или начать другое путешествие.'"],
  ["'story.series_final_title':'Серия завершена'", "'story.series_final_title':'Эта глава завершилась'"],
  ["'story.series_final_body':'В текущей версии это конец истории. Можно открыть её снова или начать новую.'", "'story.series_final_body':'Герой вернулся в тихое место, а сказочный мир готовится к новой встрече. Эту главу можно прочитать ещё раз или начать другое путешествие.'"],
  ["'home.completed_series_title':'Qism yakunlandi'", "'home.completed_series_title':'Bu bob yakunlandi'"],
  ["'home.completed_series_body':'Siz joriy versiyadagi hikoya oxiriga yetdingiz. Oxirgi qismni ochishingiz yoki yangi hikoya boshlashingiz mumkin.'", "'home.completed_series_body':'Qahramon sokin joyga qaytdi, ertak olami esa yangi uchrashuvga tayyorlanmoqda. Bu bobni yana o‘qish yoki boshqa sayohatni boshlash mumkin.'"],
  ["'story.series_final_title':'Qism yakunlandi'", "'story.series_final_title':'Bu bob yakunlandi'"],
  ["'story.series_final_body':'Joriy versiyada hikoya shu yerda yakunlanadi. Uni yana ochishingiz yoki yangisini boshlashingiz mumkin.'", "'story.series_final_body':'Qahramon sokin joyga qaytdi, ertak olami esa yangi uchrashuvga tayyorlanmoqda. Bu bobni yana o‘qish yoki boshqa sayohatni boshlash mumkin.'"],
  ["'home.completed_series_title':'Бөлім аяқталды'", "'home.completed_series_title':'Бұл тарау аяқталды'"],
  ["'story.series_final_title':'Бөлім аяқталды'", "'story.series_final_title':'Бұл тарау аяқталды'"],
]

for (const [before, after] of replacements) {
  if (dictionaries.includes(before)) dictionaries = dictionaries.replace(before, after)
}
writeFileSync(dictionaryPath, dictionaries)

console.log('Editorial UI copy patch applied.')
