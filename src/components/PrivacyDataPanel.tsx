import { useState } from 'react'
import type { Language } from '../types/qissa'

const copy: Record<Language, {
  label: string
  title: string
  body: string
  stored: string
  ai: string
  voice: string
  deleteTitle: string
  deleteBody: string
  deleteButton: string
  confirmTitle: string
  confirmBody: string
  confirmButton: string
  cancelButton: string
  deleting: string
}> = {
  ru: {
    label: 'Приватность',
    title: 'Данные ребёнка под контролем родителя',
    body: 'QISSA сохраняет только данные, необходимые для профиля и продолжения историй.',
    stored: 'Сохраняются возрастная группа, язык, герой, истории, выборы и настройки чтения.',
    ai: 'Имя героя не передаётся AI: сервер заменяет его техническим маркером до обработки.',
    voice: 'QISSA не записывает и не хранит образцы голоса ребёнка или родителя.',
    deleteTitle: 'Удалить профиль и все данные',
    deleteBody: 'Будут навсегда удалены профиль, истории, выборы, настройки и связанные технические события.',
    deleteButton: 'Удалить все данные',
    confirmTitle: 'Подтвердите полное удаление',
    confirmBody: 'Это действие нельзя отменить. Обычный сброс истории находится ниже и не удаляет профиль.',
    confirmButton: 'Да, удалить навсегда',
    cancelButton: 'Отмена',
    deleting: 'Удаляем данные…',
  },
  uz: {
    label: 'Maxfiylik',
    title: 'Bola ma’lumotlari ota-ona nazoratida',
    body: 'QISSA faqat profil va hikoyalarni davom ettirish uchun zarur ma’lumotlarni saqlaydi.',
    stored: 'Yosh guruhi, til, qahramon, hikoyalar, tanlovlar va o‘qish sozlamalari saqlanadi.',
    ai: 'Qahramon ismi AI xizmatiga yuborilmaydi: server uni qayta ishlashdan oldin texnik belgi bilan almashtiradi.',
    voice: 'QISSA bola yoki ota-onaning ovoz namunalarini yozmaydi va saqlamaydi.',
    deleteTitle: 'Profil va barcha ma’lumotlarni o‘chirish',
    deleteBody: 'Profil, hikoyalar, tanlovlar, sozlamalar va bog‘liq texnik hodisalar butunlay o‘chiriladi.',
    deleteButton: 'Barcha ma’lumotlarni o‘chirish',
    confirmTitle: 'To‘liq o‘chirishni tasdiqlang',
    confirmBody: 'Bu amalni bekor qilib bo‘lmaydi. Oddiy hikoya tiklash tugmasi pastda va profilni o‘chirmaydi.',
    confirmButton: 'Ha, butunlay o‘chirish',
    cancelButton: 'Bekor qilish',
    deleting: 'Ma’lumotlar o‘chirilmoqda…',
  },
  kz: {
    label: 'Құпиялық',
    title: 'Бала деректері ата-ананың бақылауында',
    body: 'QISSA профиль мен оқиғаларды жалғастыруға қажет деректерді ғана сақтайды.',
    stored: 'Жас тобы, тіл, кейіпкер, оқиғалар, таңдаулар және оқу баптаулары сақталады.',
    ai: 'Кейіпкердің аты AI қызметіне жіберілмейді: сервер өңдеуге дейін оны техникалық белгімен ауыстырады.',
    voice: 'QISSA бала немесе ата-ана дауысының үлгілерін жазбайды және сақтамайды.',
    deleteTitle: 'Профиль мен барлық деректі жою',
    deleteBody: 'Профиль, оқиғалар, таңдаулар, баптаулар және байланысты техникалық оқиғалар біржола жойылады.',
    deleteButton: 'Барлық деректі жою',
    confirmTitle: 'Толық жоюды растаңыз',
    confirmBody: 'Бұл әрекетті қайтару мүмкін емес. Қарапайым оқиғаны қайта бастау түймесі төменде және профильді жоймайды.',
    confirmButton: 'Иә, біржола жою',
    cancelButton: 'Бас тарту',
    deleting: 'Деректер жойылып жатыр…',
  },
}

export function PrivacyDataPanel({
  language,
  onDeleteProfileData,
  isDeleting,
  deletionError,
}: {
  language: Language
  onDeleteProfileData: () => Promise<void>
  isDeleting: boolean
  deletionError: string | null
}) {
  const [confirming, setConfirming] = useState(false)
  const labels = copy[language]

  const confirmDeletion = async () => {
    await onDeleteProfileData()
  }

  return (
    <section className="q-card space-y-4 p-5">
      <div>
        <p className="q-label mb-2">{labels.label}</p>
        <h3 className="q-heading text-2xl font-bold leading-tight">{labels.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#625846]">{labels.body}</p>
      </div>

      <ul className="space-y-2 text-sm leading-6 text-[#514938]">
        <li>• {labels.stored}</li>
        <li>• {labels.ai}</li>
        <li>• {labels.voice}</li>
      </ul>

      <div className="rounded-2xl border border-[#e8c5bd] bg-[#fff7f4] p-4">
        <p className="font-bold text-[#7d3529]">{confirming ? labels.confirmTitle : labels.deleteTitle}</p>
        <p className="mt-2 text-sm leading-6 text-[#70483f]">{confirming ? labels.confirmBody : labels.deleteBody}</p>

        {deletionError ? (
          <p role="alert" className="mt-3 rounded-xl bg-[#fbe3de] px-3 py-2 text-sm font-semibold text-[#8a2f23]">
            {deletionError}
          </p>
        ) : null}

        {confirming ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-full border border-[#b34a3a] bg-[#b34a3a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              disabled={isDeleting}
              onClick={() => void confirmDeletion()}
            >
              {isDeleting ? labels.deleting : labels.confirmButton}
            </button>
            <button
              type="button"
              className="q-secondary px-4 py-2.5"
              disabled={isDeleting}
              onClick={() => setConfirming(false)}
            >
              {labels.cancelButton}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mt-4 rounded-full border border-[#b34a3a] px-5 py-2.5 text-sm font-bold text-[#9d3b2e]"
            onClick={() => setConfirming(true)}
          >
            {labels.deleteButton}
          </button>
        )}
      </div>
    </section>
  )
}
