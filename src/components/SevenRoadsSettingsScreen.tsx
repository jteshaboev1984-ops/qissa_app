import { useState } from 'react'
import { ReaderSettingsPanel } from './ReaderSettingsPanel'
import type { ReaderPreferences } from '../types/qissa'

export function SevenRoadsSettingsScreen({
  preferences,
  onPreferencesChange,
  onBack,
  onResetSeason,
}: {
  preferences: ReaderPreferences
  onPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  onBack: () => void
  onResetSeason: () => void
}) {
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-[#efe2cb] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-[#2d332f] sm:px-5">
      <header className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          className="q-secondary px-4 py-2.5 text-xs"
          onClick={onBack}
        >
          ← Назад
        </button>
        <p className="q-label">QISSA</p>
      </header>

      <section>
        <p className="q-label mb-2">Для взрослого</p>
        <h1 className="q-heading text-3xl font-bold leading-tight">Настройки</h1>
        <p className="mt-2 text-sm leading-6 text-[#675e4f]">
          Здесь меняется только комфорт чтения и локальный прогресс. Сюжет и сохранённые решения не меняются без отдельного подтверждения.
        </p>
      </section>

      <section className="mt-5 q-card p-4">
        <div className="mb-4">
          <p className="q-label mb-1">Чтение</p>
          <p className="text-sm leading-6 text-[#675e4f]">
            Эти параметры применяются ко всем сериям Seven Roads на этом устройстве.
          </p>
        </div>
        <ReaderSettingsPanel
          language="ru"
          preferences={preferences}
          onChange={onPreferencesChange}
          onClose={() => {}}
          showClose={false}
        />
      </section>

      <section className="mt-4 q-card p-5">
        <p className="q-label mb-2">Данные на устройстве</p>
        <h2 className="q-heading text-2xl font-bold">Прогресс и решения</h2>
        <p className="mt-2 text-sm leading-6 text-[#675e4f]">
          Сейчас QISSA хранит прогресс чтения, позицию в тексте и выборы локально на этом устройстве. Аккаунт и облачная синхронизация пока не используются.
        </p>
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-[#d8b9a9] bg-[#fff7f1] p-5">
        <p className="q-label mb-2 text-[#8a5a44]">Сезон 1</p>
        <h2 className="q-heading text-2xl font-bold">Начать сезон заново</h2>
        <p className="mt-2 text-sm leading-6 text-[#75594a]">
          Это удалит текущий прогресс чтения и четыре сделанных выбора для первого сезона на этом устройстве.
        </p>

        {confirmReset ? (
          <div className="mt-4 grid gap-2.5">
            <button
              type="button"
              className="rounded-full bg-[#a64d3e] px-5 py-3 text-sm font-bold text-white"
              onClick={onResetSeason}
            >
              Да, начать заново
            </button>
            <button
              type="button"
              className="q-secondary w-full"
              onClick={() => setConfirmReset(false)}
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mt-4 rounded-full border border-[#b97765] px-5 py-3 text-sm font-bold text-[#974936]"
            onClick={() => setConfirmReset(true)}
          >
            Сбросить прогресс сезона
          </button>
        )}
      </section>
    </main>
  )
}
