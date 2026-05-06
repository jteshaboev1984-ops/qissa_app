import { useState } from 'react'
import { stylePacks } from '../../data/stylePacks'
import { t } from '../../lib/i18n'
import type { AgeGroup, HeroType, Language, OnboardingSelections, StoryMode, StoryMood } from '../../types/qissa'
import { OptionCard } from '../../components/OptionCard'
import { onboardingSteps } from './onboardingSteps'

interface OnboardingFlowProps {
  language: Language
  onLanguageChange: (language: Language) => void
  onComplete: (selections: OnboardingSelections) => void
}

const defaultSelections: OnboardingSelections = {
  ageGroup: '6-8',
  language: 'ru',
  heroType: 'girl_hero',
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
}

export function OnboardingFlow({ language, onLanguageChange, onComplete }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<OnboardingSelections>({ ...defaultSelections, language })

  const step = onboardingSteps[stepIndex]

  const next = () => {
    if (stepIndex === onboardingSteps.length - 1) {
      onComplete(draft)
      return
    }
    setStepIndex((prev) => prev + 1)
  }

  const back = () => setStepIndex((prev) => Math.max(0, prev - 1))

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">{stepIndex + 1} / {onboardingSteps.length}</p>

      {step === 'age' && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t(language, 'onboarding.age')}</h2>
          <div className="grid gap-3">
            {(['3-5', '6-8', '9-10'] as AgeGroup[]).map((age) => (
              <OptionCard key={age} title={t(language, `age.${age.replace('-', '_')}` as const)} selected={draft.ageGroup === age} onClick={() => setDraft({ ...draft, ageGroup: age })} />
            ))}
          </div>
        </section>
      )}

      {step === 'language' && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t(language, 'onboarding.language')}</h2>
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
      )}

      {step === 'hero' && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t(language, 'onboarding.hero')}</h2>
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
      )}

      {step === 'world' && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t(language, 'onboarding.world')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {stylePacks.map((pack) => (
              <OptionCard
                key={pack.id}
                title={pack.title[language]}
                description={pack.description[language]}
                selected={draft.stylePackId === pack.id}
                onClick={() => setDraft({ ...draft, stylePackId: pack.id })}
                preview={<div className="mb-3 h-10 w-full rounded-xl" style={{ background: `linear-gradient(90deg, ${pack.palette.primary}, ${pack.palette.secondary}, ${pack.palette.accent})` }} />}
              />
            ))}
          </div>
        </section>
      )}

      {step === 'mode_mood' && (
        <section className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">{t(language, 'onboarding.story_mode')}</h2>
            <div className="grid gap-3">
              {(['series', 'one_time'] as StoryMode[]).map((mode) => (
                <OptionCard key={mode} title={t(language, mode === 'series' ? 'mode.series' : 'mode.one_time')} selected={draft.storyMode === mode} onClick={() => setDraft({ ...draft, storyMode: mode })} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t(language, 'onboarding.mood')}</h3>
            <div className="grid gap-3">
              {(['bedtime', 'kind_adventure'] as StoryMood[]).map((mood) => (
                <OptionCard key={mood} title={t(language, `mood.${mood}` as const)} selected={draft.storyMood === mood} onClick={() => setDraft({ ...draft, storyMood: mood })} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={back} disabled={stepIndex === 0} className="rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">
          {t(language, 'actions.back')}
        </button>
        <button type="button" onClick={next}  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {stepIndex === onboardingSteps.length - 1 ? t(language, 'actions.start_story') : t(language, 'actions.next')}
        </button>
      </div>
    </div>
  )
}
