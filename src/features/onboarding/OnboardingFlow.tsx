import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { OptionCard } from '../../components/OptionCard'
import { StylePackCover } from '../../components/StylePackCover'
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
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-[#746a55]">
        <p className="q-label normal-case tracking-normal">{t(language, 'onboarding.title')}</p>
        <p className="font-semibold">{stepIndex + 1} / {onboardingSteps.length}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#ede3cf]">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[#d4af37] to-[#35666b] transition-all duration-500"
          style={{ width: `${((stepIndex + 1) / onboardingSteps.length) * 100}%` }}
        />
      </div>
    </div>
  )

  const StepShell = ({ title, helper, children }: { title: string; helper: string; children: ReactNode }) => (
    <section className="space-y-4 rounded-[1.75rem] border border-[#eadfc9] bg-[#fffdf7]/85 p-4 shadow-[0_14px_38px_-30px_rgba(115,92,0,.7)]">
      <div className="space-y-2">
        <h2 className="q-heading text-2xl font-bold leading-tight">{title}</h2>
        <p className="text-sm leading-6 text-[#635b49]">{helper}</p>
      </div>
      {children}
    </section>
  )

  const renderAgeStep = () => (
    <StepShell title={t(language, 'onboarding.age_title')} helper={t(language, 'onboarding.age_helper')}>
      <div className="grid gap-3">
        {([
          { value: '3-5', key: 'age.3_5' },
          { value: '6-8', key: 'age.6_8' },
          { value: '9-10', key: 'age.9_10' },
        ] as const).map(({ value, key }) => (
          <OptionCard key={value} title={t(language, key)} selected={draft.ageGroup === value} onClick={() => setDraft({ ...draft, ageGroup: value as AgeGroup })} />
        ))}
      </div>
    </StepShell>
  )

  const renderLanguageStep = () => (
    <StepShell title={t(language, 'onboarding.language_title')} helper={t(language, 'onboarding.language_helper')}>
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
    </StepShell>
  )

  const renderHeroStep = () => (
    <StepShell title={t(language, 'onboarding.hero_title')} helper={t(language, 'onboarding.hero_helper')}>
      <div className="grid gap-3">
        {(['girl_hero', 'boy_hero', 'animal', 'magical_hero', 'custom'] as HeroType[]).map((hero) => (
          <OptionCard key={hero} title={t(language, `hero.${hero}` as const)} selected={draft.heroType === hero} onClick={() => setDraft({ ...draft, heroType: hero })} />
        ))}
      </div>
      {draft.heroType === 'custom' && (
        <input
          className="w-full rounded-2xl border border-[#eadfc9] bg-white px-4 py-3 text-[#24261f] shadow-sm"
          placeholder={t(language, 'hero.custom_placeholder')}
          value={draft.customHeroName ?? ''}
          onChange={(e) => setDraft({ ...draft, customHeroName: e.target.value })}
        />
      )}
    </StepShell>
  )

  const renderWorldStep = () => (
    <StepShell title={t(language, 'onboarding.world_title')} helper={t(language, 'onboarding.world_helper')}>
      {showWorldHint && !worldInteracted && <p className="rounded-2xl bg-[#fff3d0] px-3 py-2 text-sm font-medium text-[#735c00]">{t(language, 'onboarding.world_hint')}</p>}
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
                preview={<StylePackCover stylePack={pack} variant="compact" className="mb-3" />}
              />
              {showInlineContinue && (
                <button className="q-primary w-full py-3 text-xs" onClick={next}>
                  {t(language, 'onboarding.world_continue')}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </StepShell>
  )

  const renderModeMoodStep = () => (
    <StepShell title={t(language, 'onboarding.mode_title')} helper={t(language, 'onboarding.mode_helper')}>
      <div className="grid gap-3">
        {(['series', 'one_time'] as StoryMode[]).map((storyMode) => (
          <OptionCard key={storyMode} title={t(language, storyMode === 'series' ? 'mode.series' : 'mode.one_time')} selected={draft.storyMode === storyMode} onClick={() => setDraft({ ...draft, storyMode })} />
        ))}
      </div>
      <div className="space-y-3 border-t border-[#eadfc9] pt-4">
        <h3 className="text-base font-bold text-[#24261f]">{t(language, 'onboarding.mood')}</h3>
        <div className="grid gap-3">
          {(['bedtime', 'kind_adventure'] as StoryMood[]).map((storyMood) => (
            <OptionCard key={storyMood} title={t(language, `mood.${storyMood}` as const)} selected={draft.storyMood === storyMood} onClick={() => setDraft({ ...draft, storyMood })} />
          ))}
        </div>
      </div>
    </StepShell>
  )

  const hideFooterNext = step === 'world'

  const renderFooter = () => (
    <div className="sticky bottom-0 flex items-center justify-between gap-2 rounded-[1.5rem] bg-[#fcf9f2]/95 pt-3 backdrop-blur">
      <button onClick={back} className="q-secondary px-4 py-2.5">
        {t(language, 'actions.back')}
      </button>
      {!hideFooterNext && (
        <button onClick={next} className="q-primary px-6 py-2.5">
          {stepIndex === onboardingSteps.length - 1 ? t(language, 'actions.start_story') : t(language, 'actions.next')}
        </button>
      )}
      {hideFooterNext && <span className="text-sm text-[#746a55]">{mode === 'edit_setup' ? t(language, 'onboarding.world_continue') : ''}</span>}
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
    <div className="q-card space-y-5 p-5 sm:p-6">
      <div className="rounded-[1.75rem] bg-[#f6edd9] p-4">
        <p className="q-label mb-2">QISSA</p>
        <h1 className="q-heading text-2xl font-bold leading-tight">{t(language, 'onboarding.title')}</h1>
      </div>
      {renderProgress()}
      {content}
      {renderFooter()}
    </div>
  )
}
