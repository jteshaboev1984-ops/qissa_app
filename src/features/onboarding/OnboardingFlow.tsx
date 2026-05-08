import { useEffect, useMemo, useState } from 'react'
import { OptionCard } from '../../components/OptionCard'
import { stylePacks } from '../../data/stylePacks'
import { t } from '../../lib/i18n'
import type { AgeGroup, HeroType, Language, OnboardingSelections, StoryMode, StoryMood } from '../../types/qissa'
import { onboardingSteps } from './onboardingSteps'

interface OnboardingFlowProps {
  language: Language
  mode: 'first_launch' | 'edit_setup'
  initialSelections?: OnboardingSelections
  onLanguageChange: (language: Language) => void
  onComplete: (selections: OnboardingSelections) => void
  onExit: () => void
}

const defaultSelections: OnboardingSelections = {
  ageGroup: '6-8',
  language: 'ru',
  heroType: 'girl_hero',
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
}

export function OnboardingFlow({ language, mode, initialSelections, onLanguageChange, onComplete, onExit }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<OnboardingSelections>(initialSelections ?? { ...defaultSelections, language })
  const [showWorldHint, setShowWorldHint] = useState(false)
  const [worldInteracted, setWorldInteracted] = useState(false)

  const step = onboardingSteps[stepIndex]

  useEffect(() => {
    if (initialSelections) {
      setDraft(initialSelections)
      return
    }

    setDraft((prev) => ({ ...prev, language }))
  }, [initialSelections])

  useEffect(() => {
    if (step !== 'world') return
    setWorldInteracted(false)
    setShowWorldHint(false)
    const timer = setTimeout(() => setShowWorldHint(true), 6000)
    return () => clearTimeout(timer)
  }, [step])

  const next = () => {
    if (stepIndex === onboardingSteps.length - 1) {
      onComplete(draft)
      return
    }
    setStepIndex((prev) => prev + 1)
  }

  const back = () => {
    if (stepIndex === 0) {
      onExit()
      return
    }
    setStepIndex((prev) => Math.max(0, prev - 1))
  }

  const renderProgress = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>{t(language, 'onboarding.title')}</p>
        <p>{stepIndex + 1} / {onboardingSteps.length}</p>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-amber-400 transition-all"
          style={{ width: `${((stepIndex + 1) / onboardingSteps.length) * 100}%` }}
        />
      </div>
    </div>
  )

  const renderAgeStep = () => (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t(language, 'onboarding.age_title')}</h2>
      <p className="text-sm text-slate-600">{t(language, 'onboarding.age_helper')}</p>
      <div className="grid gap-3">
        {([
          { value: '3-5', key: 'age.3_5' },
          { value: '6-8', key: 'age.6_8' },
          { value: '9-10', key: 'age.9_10' },
        ] as const).map(({ value, key }) => (
          <OptionCard key={value} title={t(language, key)} selected={draft.ageGroup === value} onClick={() => setDraft({ ...draft, ageGroup: value as AgeGroup })} />
        ))}
      </div>
    </section>
  )

  const renderLanguageStep = () => (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t(language, 'onboarding.language_title')}</h2>
      <p className="text-sm text-slate-600">{t(language, 'onboarding.language_helper')}</p>
      <div className="grid gap-3">
        {(['ru', 'uz', 'kz'] as Language[]).map((value) => (
          <OptionCard
            key={value}
            title={t(language, `language.${value}` as const)}
            selected={draft.language === value}
            onClick={() => {
              setDraft({ ...draft, language: value })
              onLanguageChange(value)
            }}
          />
        ))}
      </div>
    </section>
  )

  const renderHeroStep = () => (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t(language, 'onboarding.hero_title')}</h2>
      <p className="text-sm text-slate-600">{t(language, 'onboarding.hero_helper')}</p>
      <div className="grid gap-3">
        {(['girl_hero', 'boy_hero', 'animal', 'magical_hero', 'custom'] as HeroType[]).map((hero) => (
          <OptionCard key={hero} title={t(language, `hero.${hero}` as const)} selected={draft.heroType === hero} onClick={() => setDraft({ ...draft, heroType: hero })} />
        ))}
      </div>
      {draft.heroType === 'custom' && (
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
          placeholder={t(language, 'hero.custom_placeholder')}
          value={draft.customHeroName ?? ''}
          onChange={(e) => setDraft({ ...draft, customHeroName: e.target.value })}
        />
      )}
    </section>
  )

  const renderWorldStep = () => (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t(language, 'onboarding.world_title')}</h2>
      <p className="text-sm text-slate-600">{t(language, 'onboarding.world_helper')}</p>
      {showWorldHint && !worldInteracted && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{t(language, 'onboarding.world_hint')}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {stylePacks.map((pack) => {
          const selected = draft.stylePackId === pack.id
          const showInlineContinue = selected && (worldInteracted || mode === 'edit_setup')

          return (
            <div key={pack.id} className="space-y-2">
              <OptionCard
                title={pack.title[language]}
                description={pack.description[language]}
                selected={selected}
                onClick={() => {
                  setDraft({ ...draft, stylePackId: pack.id })
                  setWorldInteracted(true)
                  setShowWorldHint(false)
                }}
                preview={<div className="mb-3 h-12 w-full rounded-xl" style={{ background: `linear-gradient(90deg, ${pack.palette.primary}, ${pack.palette.secondary}, ${pack.palette.accent})` }} />}
              />
              {showInlineContinue && (
                <button className="w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white" onClick={next}>
                  {t(language, 'onboarding.world_continue')}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )

  const renderModeMoodStep = () => (
    <section className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{t(language, 'onboarding.mode_title')}</h2>
        <p className="text-sm text-slate-600">{t(language, 'onboarding.mode_helper')}</p>
        <div className="grid gap-3">
          {(['series', 'one_time'] as StoryMode[]).map((storyMode) => (
            <OptionCard key={storyMode} title={t(language, storyMode === 'series' ? 'mode.series' : 'mode.one_time')} selected={draft.storyMode === storyMode} onClick={() => setDraft({ ...draft, storyMode })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t(language, 'onboarding.mood')}</h3>
        <div className="grid gap-3">
          {(['bedtime', 'kind_adventure'] as StoryMood[]).map((storyMood) => (
            <OptionCard key={storyMood} title={t(language, `mood.${storyMood}` as const)} selected={draft.storyMood === storyMood} onClick={() => setDraft({ ...draft, storyMood })} />
          ))}
        </div>
      </div>
    </section>
  )

  const hideFooterNext = step === 'world'

  const renderFooter = () => (
    <div className="flex items-center justify-between pt-2">
      <button onClick={back} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
        {t(language, 'actions.back')}
      </button>
      {!hideFooterNext && (
        <button onClick={next} className="rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white">
          {stepIndex === onboardingSteps.length - 1 ? t(language, 'actions.start_story') : t(language, 'actions.next')}
        </button>
      )}
      {hideFooterNext && <span className="text-sm text-slate-500">{mode === 'edit_setup' ? t(language, 'onboarding.world_continue') : ''}</span>}
    </div>
  )

  const content = useMemo(() => {
    if (step === 'age') return renderAgeStep()
    if (step === 'language') return renderLanguageStep()
    if (step === 'hero') return renderHeroStep()
    if (step === 'world') return renderWorldStep()
    return renderModeMoodStep()
  }, [step, draft, language, showWorldHint, worldInteracted])

  return (
    <div className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      {renderProgress()}
      {content}
      {renderFooter()}
    </div>
  )
}
