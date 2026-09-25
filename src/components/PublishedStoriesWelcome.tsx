import { useState } from 'react'

export function PublishedStoriesWelcome({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'intro' | 'parent'>('intro')
  const [checked, setChecked] = useState(false)

  if (step === 'intro') {
    return (
      <main className="mx-auto flex min-h-screen max-w-[430px] items-center px-4 py-8 sm:px-6">
        <section className="q-card w-full space-y-6 p-6">
          <div className="space-y-3 text-center">
            <p className="q-label">QISSA</p>
            <h1 className="q-heading text-4xl font-bold leading-tight">
              Истории, которые помнят твои решения
            </h1>
            <p className="text-base leading-7 text-[#5f5848]">
              Читайте по сериям, выбирайте путь героев — и мир будет помнить эти решения дальше.
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-[#eadfc9] bg-[#fff8e9] p-5">
            <p className="q-label mb-2">Королевство семи дорог</p>
            <p className="text-sm leading-6 text-[#5f5848]">
              Первый сезон уже открыт. Новые сезоны будут продолжать общую историю Темура и Самиры.
            </p>
          </div>

          <button type="button" className="q-primary w-full" onClick={() => setStep('parent')}>
            Начать
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] items-center px-4 py-8 sm:px-6">
      <section className="q-card w-full space-y-5 p-6">
        <div>
          <p className="q-label mb-2">Для родителя</p>
          <h1 className="q-heading text-3xl font-bold leading-tight">Сохраняем только прогресс чтения</h1>
          <p className="mt-3 text-sm leading-6 text-[#5f5848]">
            QISSA сохраняет на этом устройстве, какую серию вы читаете и какие решения ребёнок сделал.
            Это нужно, чтобы будущие сезоны могли помнить прошлые выборы.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#d8e5dd] bg-[#f0f8f3] p-4 text-sm leading-6 text-[#31564a]">
          Аккаунт, email и пароль сейчас не нужны. Эти данные можно будет добавить позже только для синхронизации между устройствами.
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-[1.5rem] border border-[#e0d2b9] bg-white p-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 h-5 w-5 accent-[#587a52]"
          />
          <span className="text-sm font-semibold leading-6 text-[#3d382c]">
            Я родитель или законный представитель и разрешаю сохранять прогресс чтения и решения ребёнка на этом устройстве.
          </span>
        </label>

        <div className="grid gap-2.5">
          <button
            type="button"
            className="q-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!checked}
            onClick={onComplete}
          >
            Продолжить
          </button>
          <button type="button" className="q-secondary w-full" onClick={() => setStep('intro')}>
            Назад
          </button>
        </div>
      </section>
    </main>
  )
}
