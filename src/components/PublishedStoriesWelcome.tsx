import { useState } from 'react'
import { SevenRoadsMark } from './SevenRoadsMark'

export function PublishedStoriesWelcome({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'intro' | 'parent'>('intro')
  const [checked, setChecked] = useState(false)

  if (step === 'intro') {
    return (
      <main className="mx-auto flex min-h-screen max-w-[430px] items-center px-4 py-8 sm:px-6">
        <section className="q-world-panel w-full p-6">
          <div className="relative z-10 space-y-6">
            <div className="mx-auto w-44 text-[#ead3a0]">
              <SevenRoadsMark />
            </div>

            <div className="space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ead3a0]">QISSA</p>
              <h1 className="font-serif text-4xl font-bold leading-tight text-[#fff9ec]">
                Истории, которые помнят твои решения
              </h1>
              <p className="text-base leading-7 text-[#eef7f6]">
                Читайте по сериям, выбирайте путь героев — и Королевство семи дорог будет помнить эти решения дальше.
              </p>
            </div>

            <div className="q-ornament-rule !bg-[linear-gradient(90deg,transparent,rgba(234,211,160,.8),transparent)]" />

            <div className="rounded-[1.4rem] border border-[#ead3a0]/35 bg-[#fff9ec]/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ead3a0]">Королевство семи дорог</p>
              <p className="mt-2 text-sm leading-6 text-[#f8f1e4]">
                Первый сезон уже открыт. Следующие сезоны продолжат общую историю и сохранят память прошлых решений.
              </p>
            </div>

            <button type="button" className="w-full rounded-full border border-[#ead3a0] bg-[#ead3a0] px-5 py-3.5 text-sm font-bold text-[#24434a] active:scale-[0.98]" onClick={() => setStep('parent')}>
              Начать
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] items-center px-4 py-8 sm:px-6">
      <section className="q-stone-panel w-full space-y-5 p-6">
        <div className="mx-auto w-28 text-[#1f6670]">
          <SevenRoadsMark compact />
        </div>

        <div>
          <p className="q-label mb-2 text-center">Для родителя</p>
          <h1 className="q-heading text-center text-3xl font-bold leading-tight">Сохраняем только прогресс чтения</h1>
          <p className="mt-3 text-sm leading-6 text-[#625846]">
            QISSA сохраняет на этом устройстве, какую серию вы читаете и какие решения ребёнок сделал.
            Это нужно, чтобы будущие сезоны могли помнить прошлые выборы.
          </p>
        </div>

        <div className="rounded-[1.35rem] border border-[#b9d5d1] bg-[#e7f2ef] p-4 text-sm leading-6 text-[#31564a]">
          Аккаунт, email и пароль сейчас не нужны. Их можно будет добавить позже только для синхронизации между устройствами.
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-[1.35rem] border border-[#d8c39a] bg-[#fffaf0] p-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 h-5 w-5 accent-[#1f6670]"
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
