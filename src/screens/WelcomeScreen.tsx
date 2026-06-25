import { useState } from 'react'
import { StylePackCover } from '../components/StylePackCover'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Language } from '../types/qissa'

const consentCopy: Record<Language, {
  title: string
  intro: string
  parent: string
  data: string
  ai: string
  voice: string
  delete: string
  checkbox: string
  continue: string
}> = {
  ru: {
    title: 'Согласие родителя на использование QISSA',
    intro: 'Перед созданием профиля прочитайте краткое описание обработки данных.',
    parent: 'Я родитель или законный представитель ребёнка и разрешаю создать детский профиль.',
    data: 'QISSA сохраняет возрастную группу, язык, героя, истории, выборы и настройки чтения, чтобы продолжать сказки.',
    ai: 'При включении AI история может обрабатываться внешней моделью, но имя героя заменяется техническим маркером до отправки.',
    voice: 'QISSA не записывает голос ребёнка или родителя и не создаёт голосовые копии.',
    delete: 'Все данные можно навсегда удалить из Родительского центра.',
    checkbox: 'Я прочитал(а) информацию и даю согласие на описанную обработку данных.',
    continue: 'Согласиться и продолжить',
  },
  uz: {
    title: 'QISSA’dan foydalanish uchun ota-ona roziligi',
    intro: 'Profil yaratishdan oldin ma’lumotlar qanday ishlatilishini qisqacha o‘qing.',
    parent: 'Men bolaning ota-onasi yoki qonuniy vakiliman va bola profilini yaratishga ruxsat beraman.',
    data: 'QISSA hikoyalarni davom ettirish uchun yosh guruhi, til, qahramon, hikoyalar, tanlovlar va o‘qish sozlamalarini saqlaydi.',
    ai: 'AI yoqilganda hikoya tashqi modelda qayta ishlanishi mumkin, lekin qahramon ismi yuborilishdan oldin texnik belgi bilan almashtiriladi.',
    voice: 'QISSA bola yoki ota-onaning ovozini yozmaydi va ovoz nusxasini yaratmaydi.',
    delete: 'Barcha ma’lumotlarni Ota-ona markazidan butunlay o‘chirish mumkin.',
    checkbox: 'Ma’lumotni o‘qidim va tavsiflangan qayta ishlashga roziman.',
    continue: 'Rozilik berish va davom etish',
  },
  kz: {
    title: 'QISSA қолдануға ата-ананың келісімі',
    intro: 'Профиль жасамас бұрын деректердің қалай қолданылатынын қысқаша оқыңыз.',
    parent: 'Мен баланың ата-анасы немесе заңды өкілімін және бала профилін жасауға рұқсат беремін.',
    data: 'QISSA оқиғаларды жалғастыру үшін жас тобын, тілді, кейіпкерді, оқиғаларды, таңдауларды және оқу баптауларын сақтайды.',
    ai: 'AI қосылғанда оқиға сыртқы модельде өңделуі мүмкін, бірақ кейіпкердің аты жіберілер алдында техникалық белгімен ауыстырылады.',
    voice: 'QISSA бала немесе ата-ана дауысын жазбайды және дауыс көшірмесін жасамайды.',
    delete: 'Барлық деректі Ата-ана орталығынан біржола жоюға болады.',
    checkbox: 'Ақпаратты оқыдым және сипатталған деректерді өңдеуге келісемін.',
    continue: 'Келісу және жалғастыру',
  },
}

export function WelcomeScreen({
  language,
  consentAlreadyAccepted,
  onAcceptAndStart,
}: {
  language: Language
  consentAlreadyAccepted: boolean
  onAcceptAndStart: () => void
}) {
  const [checked, setChecked] = useState(consentAlreadyAccepted)
  const labels = consentCopy[language]

  return (
    <section className="q-card space-y-6 p-5 sm:p-6">
      <StylePackCover stylePack={stylePacks[0]} variant="hero" title={t(language, 'welcome.title')} subtitle={t(language, 'welcome.subtitle')} />
      <div className="space-y-3 px-1">
        <h2 className="q-heading text-3xl font-bold leading-tight">{t(language, 'welcome.tagline')}</h2>
      </div>

      <section className="rounded-[1.5rem] border border-[#e7dac2] bg-[#fffaf0] p-4">
        <h3 className="q-heading text-xl font-bold leading-tight">{labels.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#625846]">{labels.intro}</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#514938]">
          <li>• {labels.parent}</li>
          <li>• {labels.data}</li>
          <li>• {labels.ai}</li>
          <li>• {labels.voice}</li>
          <li>• {labels.delete}</li>
        </ul>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e0d2b9] bg-white px-4 py-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 h-5 w-5 accent-[#587a52]"
          />
          <span className="text-sm font-semibold leading-6 text-[#3d382c]">{labels.checkbox}</span>
        </label>
      </section>

      <button className="q-primary w-full disabled:cursor-not-allowed disabled:opacity-50" disabled={!checked} onClick={onAcceptAndStart}>
        {consentAlreadyAccepted ? t(language, 'actions.start_story') : labels.continue}
      </button>
    </section>
  )
}
