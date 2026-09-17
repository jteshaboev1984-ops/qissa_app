import assert from 'node:assert/strict'
import { choiceMenuScaffoldingNeedsRewrite, textRepeatsStructuredChoiceMenu } from '../supabase/functions/story-generate/safety.ts'

// Engineering-labelled provider-free corpus. These are synthetic examples, not an independent
// native-speaker acceptance corpus. No model, HTTP or database calls.
const metaCases = [
  {
    label: 'UZ natural thought across sentence boundaries', language: 'uz', expected: false,
    text: 'Malika o‘yladi. Do‘stlariga qanday yordam berishi mumkin? Balki barglarni birga sanash yoki boshqa yo‘l topish mumkin edi.',
  },
  {
    label: 'UZ explicit two-option scaffolding in one sentence', language: 'uz', expected: true,
    text: 'Barglardan rasm yasash mumkin yoki yong‘oqlardan bezak qilish mumkin.',
  },
  {
    label: 'UZ explicit alternatives across sentences', language: 'uz', expected: true,
    text: 'Barglardan rasm yasash mumkin. Yana yong‘oqlardan bezak qilish mumkin.',
  },
  {
    label: 'RU natural possibility across sentence boundaries', language: 'ru', expected: false,
    text: 'Малика задумалась. Как можно помочь друзьям? Может быть, они найдут другой путь, или можно немного подождать.',
  },
  {
    label: 'RU explicit two-option scaffolding in one sentence', language: 'ru', expected: true,
    text: 'Можно сделать рисунок, или можно спеть песню.',
  },
  {
    label: 'RU explicit alternatives across sentences', language: 'ru', expected: true,
    text: 'Можно начать с веточек. А можно сначала обратиться к Степашке.',
  },
  {
    label: 'KZ natural possibility across sentence boundaries', language: 'kz', expected: false,
    text: 'Малика ойланып қалды. Достарына қалай көмектесуге болады? Басқа жол іздеуге немесе тағы күтуге болады.',
  },
  {
    label: 'KZ explicit two-option scaffolding in one sentence', language: 'kz', expected: true,
    text: 'Сурет салуға болады немесе ән айтуға болады.',
  },
  {
    label: 'KZ explicit alternatives across sentences', language: 'kz', expected: true,
    text: 'Сурет салуға болады. Тағы ән айтуға болады.',
  },
]
for (const item of metaCases) {
  assert.equal(choiceMenuScaffoldingNeedsRewrite(item.language, item.text), item.expected, item.label)
}

const choices = [
  { text: 'Quvnoq va Chittakka rangli bayroqchalar yasashni taklif qilish' },
  { text: 'Quvnoq va Chittakka yong‘oqlarni qator qilib terishni taklif qilish' },
]
assert.equal(
  textRepeatsStructuredChoiceMenu('Malika Quvnoq va Chittakka qanday yordam berishni taklif qiladi?', choices),
  false,
  'shared character/context words must not make a neutral question look like both cards',
)
assert.equal(
  textRepeatsStructuredChoiceMenu('Rangli bayroqchalar yasashmi yoki yong‘oqlarni qator qilib terishmi?', choices),
  true,
  'a decision point that names the branch-distinguishing actions must still be rejected',
)
assert.equal(
  textRepeatsStructuredChoiceMenu('Rangli bayroqchalar yasash haqida nima deydi?', choices),
  false,
  'mentioning only one branch must not be misclassified as repeating both cards',
)

const unrelated = [
  { text: 'Barglardan rasm yasash' },
  { text: 'Mayin qo‘shiq aytish' },
]
assert.equal(textRepeatsStructuredChoiceMenu('Endi qahramon nima qiladi?', unrelated), false,
  'short neutral question must remain allowed')
assert.equal(textRepeatsStructuredChoiceMenu('Barglardan rasm yasash yoki mayin qo‘shiq aytish?', unrelated), true,
  'direct restatement of compact cards must remain rejected')

console.log('Choice-menu predicate precision corpus PASS: natural cross-sentence reasoning stays allowed, explicit alternative scaffolding remains blocked, and branch-distinct overlap tolerates ordinary suffix changes; zero provider/HTTP/database calls.')
