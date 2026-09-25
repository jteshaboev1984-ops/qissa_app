import { useState } from 'react'
import { sevenRoadsUiAssets } from '../data/sevenRoadsUiAssets'
import {
  getSevenRoadsCopy,
  sevenRoadsLanguageName,
  sevenRoadsLanguages,
  type SevenRoadsLanguage,
} from '../features/publishedStories/sevenRoadsCopy'

function LanguageSwitcher({
  language,
  onLanguageChange,
  dark = false,
}: {
  language: SevenRoadsLanguage
  onLanguageChange: (language: SevenRoadsLanguage) => void
  dark?: boolean
}) {
  return (
    <div
      className={`inline-flex rounded-full border p-1 backdrop-blur-md ${
        dark ? 'border-white/25 bg-black/20' : 'border-[#d8c39a] bg-white/72'
      }`}
      aria-label={language === 'uz' ? 'Hikoya tili' : 'Язык истории'}
    >
      {sevenRoadsLanguages.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onLanguageChange(option)}
          aria-pressed={language === option}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            language === option
              ? dark
                ? 'bg-[#ecd09a] text-[#263f42]'
                : 'bg-[#1f6670] text-white'
              : dark
                ? 'text-white/85'
                : 'text-[#675e4f]'
          }`}
        >
          {sevenRoadsLanguageName[option]}
        </button>
      ))}
    </div>
  )
}

export function PublishedStoriesWelcome({
  language,
  onLanguageChange,
  onComplete,
}: {
  language: SevenRoadsLanguage
  onLanguageChange: (language: SevenRoadsLanguage) => void
  onComplete: () => void
}) {
  const [step, setStep] = useState<'intro' | 'parent'>('intro')
  const [checked, setChecked] = useState(false)
  const copy = getSevenRoadsCopy(language)

  const backgroundStyle = {
    backgroundImage: `url("${sevenRoadsUiAssets.welcome}")`,
  }

  if (step === 'intro') {
    return (
      <main
        className="relative mx-auto min-h-[100dvh] max-w-[430px] overflow-hidden bg-cover bg-center text-white"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#102025]/5 via-[#102025]/5 to-[#102025]/90" />

        <div className="relative z-10 flex min-h-[100dvh] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
          <header className="text-center">
            <p className="font-serif text-[1.55rem] font-bold tracking-[0.22em] text-[#fff7df] drop-shadow-sm">
              QISSA
            </p>
            <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#f0d9a5]">
              {copy.worldTitle}
            </p>
            <div className="mt-3">
              <LanguageSwitcher
                language={language}
                onLanguageChange={onLanguageChange}
                dark
              />
            </div>
          </header>

          <div className="flex-1" />

          <section className="pb-2 text-center">
            <h1 className="font-serif text-[2.35rem] font-bold leading-[1.03] tracking-[-0.035em] text-[#fffaf0] drop-shadow-md">
              {copy.welcomeHeadline}
            </h1>
            <p className="mx-auto mt-4 max-w-[330px] text-[0.95rem] leading-6 text-[#f7efe1]">
              {copy.welcomeBody}
            </p>

            <button
              type="button"
              className="mt-6 w-full rounded-full border border-[#f0d7a0]/80 bg-[#ecd09a] px-5 py-4 text-sm font-extrabold text-[#263f42] shadow-[0_16px_40px_-22px_rgba(0,0,0,.9)] transition active:scale-[0.98]"
              onClick={() => setStep('parent')}
            >
              {copy.start}
            </button>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main
      className="relative mx-auto min-h-[100dvh] max-w-[430px] overflow-hidden bg-cover bg-center"
      style={backgroundStyle}
    >
      <div className="absolute inset-0 bg-[#10272c]/45 backdrop-blur-[2px]" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="absolute inset-x-0 top-[max(1.25rem,env(safe-area-inset-top))] text-center">
          <p className="font-serif text-xl font-bold tracking-[0.2em] text-[#fff7df]">QISSA</p>
          <div className="mt-3">
            <LanguageSwitcher
              language={language}
              onLanguageChange={onLanguageChange}
              dark
            />
          </div>
        </header>

        <section className="rounded-t-[2rem] border-t border-[#e2c998] bg-[#fffaf0]/96 px-5 pb-[max(1.4rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-22px_55px_-36px_rgba(0,0,0,.8)] backdrop-blur-xl">
          <div>
            <p className="q-label mb-2">{copy.parentLabel}</p>
            <h1 className="q-heading text-3xl font-bold leading-tight">
              {copy.consentTitle}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#625846]">
              {copy.consentBody}
            </p>
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-[#b9d5d1] bg-[#e7f2ef] p-4 text-sm leading-6 text-[#31564a]">
            {copy.consentAccountNote}
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[1.25rem] border border-[#d8c39a] bg-white/75 p-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-1 h-5 w-5 accent-[#1f6670]"
            />
            <span className="text-sm font-semibold leading-6 text-[#3d382c]">
              {copy.consentCheckbox}
            </span>
          </label>

          <div className="mt-5 grid gap-2.5">
            <button
              type="button"
              className="q-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!checked}
              onClick={onComplete}
            >
              {copy.continue}
            </button>
            <button type="button" className="q-secondary w-full" onClick={() => setStep('intro')}>
              {copy.back}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
