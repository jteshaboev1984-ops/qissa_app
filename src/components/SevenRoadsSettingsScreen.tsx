import { useState } from 'react'
import { ReaderSettingsPanel } from './ReaderSettingsPanel'
import {
  getSevenRoadsCopy,
  sevenRoadsLanguageName,
  sevenRoadsLanguages,
  type SevenRoadsLanguage,
} from '../features/publishedStories/sevenRoadsCopy'
import type { ReaderPreferences } from '../types/qissa'

export function SevenRoadsSettingsScreen({
  language,
  onLanguageChange,
  preferences,
  onPreferencesChange,
  onBack,
  onResetSeason,
}: {
  language: SevenRoadsLanguage
  onLanguageChange: (language: SevenRoadsLanguage) => void
  preferences: ReaderPreferences
  onPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  onBack: () => void
  onResetSeason: () => void
}) {
  const [confirmReset, setConfirmReset] = useState(false)
  const copy = getSevenRoadsCopy(language)

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-[#efe2cb] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-[#2d332f] sm:px-5">
      <header className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          className="q-secondary px-4 py-2.5 text-xs"
          onClick={onBack}
        >
          ← {copy.back}
        </button>
        <p className="q-label">QISSA</p>
      </header>

      <section>
        <p className="q-label mb-2">{copy.adultLabel}</p>
        <h1 className="q-heading text-3xl font-bold leading-tight">{copy.settings}</h1>
        <p className="mt-2 text-sm leading-6 text-[#675e4f]">
          {copy.settingsIntro}
        </p>
      </section>

      <section className="mt-5 q-card p-4">
        <div>
          <p className="q-label mb-1">{copy.storyLanguage}</p>
          <p className="text-sm leading-6 text-[#675e4f]">
            {copy.storyLanguageHint}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {sevenRoadsLanguages.map((option) => (
            <button
              key={option}
              type="button"
              className={`rounded-full border px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${
                language === option
                  ? 'border-[#1f6670] bg-[#1f6670] text-white'
                  : 'border-[#d8c39a] bg-white/80 text-[#5f5848]'
              }`}
              onClick={() => onLanguageChange(option)}
              aria-pressed={language === option}
            >
              {sevenRoadsLanguageName[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 q-card p-4">
        <div className="mb-4">
          <p className="q-label mb-1">{copy.reading}</p>
          <p className="text-sm leading-6 text-[#675e4f]">
            {copy.readingHint}
          </p>
        </div>
        <ReaderSettingsPanel
          language={language}
          preferences={preferences}
          onChange={onPreferencesChange}
          onClose={() => {}}
          showClose={false}
        />
      </section>

      <section className="mt-4 q-card p-5">
        <p className="q-label mb-2">{copy.deviceData}</p>
        <h2 className="q-heading text-2xl font-bold">{copy.progressAndChoices}</h2>
        <p className="mt-2 text-sm leading-6 text-[#675e4f]">
          {copy.deviceDataBody}
        </p>
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-[#d8b9a9] bg-[#fff7f1] p-5">
        <p className="q-label mb-2 text-[#8a5a44]">{copy.season} 1</p>
        <h2 className="q-heading text-2xl font-bold">{copy.restartSeason}</h2>
        <p className="mt-2 text-sm leading-6 text-[#75594a]">
          {copy.restartSeasonBody}
        </p>

        {confirmReset ? (
          <div className="mt-4 grid gap-2.5">
            <button
              type="button"
              className="rounded-full bg-[#a64d3e] px-5 py-3 text-sm font-bold text-white"
              onClick={onResetSeason}
            >
              {copy.restartConfirm}
            </button>
            <button
              type="button"
              className="q-secondary w-full"
              onClick={() => setConfirmReset(false)}
            >
              {copy.cancel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mt-4 rounded-full border border-[#b97765] px-5 py-3 text-sm font-bold text-[#974936]"
            onClick={() => setConfirmReset(true)}
          >
            {copy.resetSeason}
          </button>
        )}
      </section>
    </main>
  )
}
