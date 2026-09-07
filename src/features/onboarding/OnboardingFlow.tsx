import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { OptionCard } from '../../components/OptionCard'
import { StylePackCover } from '../../components/StylePackCover'
import { betaScope, isPublicBetaLanguage, isPublicBetaStylePack } from '../../config/betaScope'
import { stylePacks } from '../../data/stylePacks'
import { t } from '../../lib/i18n'
import type { HeroType, Language, OnboardingSelections } from '../../types/qissa'
import { onboardingSteps } from './onboardingSteps'

interface OnboardingFlowProps {
  language: Language
  mode: 'first_launch' | 'edit_setup' | 'new_story'
  initialSelections?: OnboardingSelections
  onComplete: (selections: OnboardingSelections) => void
  onExit: () => void
}

const scopeCopy: Record<Language, { label: string; body: string; uzBeta: string }> = {
  ru: {
    label: 'Закрытая beta',
    body: '5–7 лет · серия перед сном · 3 готовых мира',
    uzBeta: 'O‘zbekcha доступен в beta-режиме.',
  },
  uz: {
    label: 'Yopiq beta',
    body: '5–7 yosh · uyqu oldidan serial · 3 ta tayyor olam',
    uzBeta: 'O‘zbekcha beta rejimida ishlaydi.',
  },
  kz: {
    label: 'Жабық beta',
    body: '5–7 жас · ұйқы алдындағы серия · 3 дайын әлем',
    uzBeta: 'O‘zbekcha beta режимінде қолжетімді.',
  },
}

const defaultSelections = (language: Language): OnboardingSelections => ({
  ageGroup: betaScope.ageGroup,
  language: isPublicBetaLanguage(language) ? language : betaScope.primaryLanguage,
  heroType: 'girl_hero',
  stylePackId: 'cozy_forest',
  storyMode: betaScope.defaultStoryMode,
  storyMood: betaScope.defaultStoryMood,
})

const normalizeForBeta = (
  selections: OnboardingSelections | undefined,
  language: Language,
): OnboardingSelections => {
  const base = selections ?? defaultSelections(language)
  return {
    ...base,
    ageGroup: betaScope.ageGroup,
    language: isPublicBetaLanguage(language) ? language : betaScope.primaryLanguage,
    stylePackId: isPublicBetaStylePack(base.stylePackId) ? base.stylePackId : 'cozy_forest',
    storyMode: betaScope.defaultStoryMode,
    storyMood: betaScope.defaultStoryMood,
  }
}

export function OnboardingFlow({ language, mode, initialSelections, onComplete, onExit }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<OnboardingSelections>(() => normalizeForBeta(initialSelections, language))

  const publicStylePacks = useMemo(
    () => stylePacks.filter((pack) => isPublicBetaStylePack(pack.id)),
    [],
  )

  const activeSteps = useMemo(
    () => mode === 'new_story' ? onboardingSteps.filter((item) => item === 'world') : onboardingSteps,
    [mode],
  )
  const step = activeSteps[Math.min(stepIndex, activeSteps.length - 1)]

  useEffect(() => {
    setStepIndex(0)
    setDraft(normalizeForBeta(initialSelections, language))
  }, [mode, initialSelections])

  useEffect(() => {
    const betaLanguage = isPublicBetaLanguage(language) ? language : betaScope.primaryLanguage
    setDraft((prev) => ({
      ...prev,
      ageGroup: betaScope.ageGroup,
      language: betaLanguage,
      storyMode: betaScope.defaultStoryMode,
      storyMood: betaScope.defaultStoryMood,
    }))
  }, [language])

  const next = () => {
    if (stepIndex === activeSteps.length - 1) {
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
      <div className="flex items-center justify-between gap-3 text-sm text-[#746a55]">
        <p className="rounded-full border border-[#e5d8bf] bg-[#fff8e9] px-3 py-1 text-xs font-bold text-[#735c00]">
          {scopeCopy[language].label}
        </p>
        <p className="font-semibold">{stepIndex + 1} / {activeSteps.length}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#ede3cf]">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[#d4af37] to-[#35666b] transition-all duration-500"
          style={{ width: `${((stepIndex + 1) / activeSteps.length) * 100}%` }}
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

  const renderHeroStep = () => (
    <StepShell title={t(language, 'onboarding.hero_title')} helper={t(language, 'onboarding.hero_helper')}>
      <div className="grid gap-3">
        {(['girl_hero', 'boy_hero', 'animal', 'magical_hero', 'custom'] as HeroType[]).map((hero) => (
          <OptionCard
            key={hero}
            title={t(language, `hero.${hero}` as const)}
            selected={draft.heroType === hero}
            onClick={() => setDraft({ ...draft, heroType: hero })}
          />
        ))}
      </div>
      {draft.heroType === 'custom' && (
        <input
          className="w-full rounded-2xl border border-[#eadfc9] bg-white px-4 py-3 text-[#24261f] shadow-sm"
          placeholder={t(language, 'hero.custom_placeholder')}
          value={draft.customHeroName ?? ''}
          onChange={(event) => setDraft({ ...draft, customHeroName: event.target.value })}
        />
      )}
    </StepShell>
  )

  const renderWorldStep = () => (
    <StepShell title={t(language, 'onboarding.world_title')} helper={t(language, 'onboarding.world_helper')}>
      <div className="rounded-2xl border border-[#d8e5dd] bg-[#f0f8f3] px-4 py-3 text-sm leading-6 text-[#31564a]">
        <p className="font-bold">{scopeCopy[language].body}</p>
        {draft.language === 'uz' ? <p className="mt-1 text-xs">{scopeCopy[language].uzBeta}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {publicStylePacks.map((pack) => {
          const selected = draft.stylePackId === pack.id
          return (
            <div key={pack.id} className="space-y-2">
              <OptionCard
                title={pack.title[language]}
                description={pack.description[language]}
                selected={selected}
                onClick={() => setDraft({ ...draft, stylePackId: pack.id })}
                preview={<StylePackCover stylePack={pack} variant="compact" className="mb-3" />}
              />
              {selected ? (
                <button className="q-primary w-full py-3 text-sm" onClick={next}>
                  {t(language, 'actions.start_story')}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </StepShell>
  )

  const renderFooter = () => (
    <div className="sticky bottom-0 flex items-center justify-between gap-2 rounded-[1.5rem] bg-[#fcf9f2]/95 pt-3 backdrop-blur">
      <button onClick={back} className="q-secondary px-4 py-2.5">
        {t(language, 'actions.back')}
      </button>
      {step !== 'world' ? (
        <button onClick={next} className="q-primary px-6 py-2.5">
          {t(language, 'actions.next')}
        </button>
      ) : (
        <span className="text-xs font-semibold text-[#746a55]">5–7 · bedtime</span>
      )}
    </div>
  )

  return (
    <div className="q-card space-y-5 p-5 sm:p-6">
      <div className="rounded-[1.75rem] bg-[#f6edd9] p-4">
        <p className="q-label mb-2">QISSA</p>
        <h1 className="q-heading text-2xl font-bold leading-tight">{t(language, 'onboarding.title')}</h1>
        <p className="mt-2 text-sm leading-6 text-[#625846]">{scopeCopy[language].body}</p>
      </div>
      {renderProgress()}
      {step === 'hero' ? renderHeroStep() : renderWorldStep()}
      {renderFooter()}
    </div>
  )
}
