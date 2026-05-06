import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Language, OnboardingSelections } from '../types/qissa'

export function HomeScreen({ language, selections, onCreateFirstSeries }: { language: Language; selections: OnboardingSelections; onCreateFirstSeries: () => void }) {
  const world = stylePacks.find((pack) => pack.id === selections.stylePackId)
  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{t(language, 'home.ready')}</h2>
      <div className="rounded-2xl bg-amber-50 p-4 text-sm text-slate-700">
        <p>{t(language, 'onboarding.age')}: {t(language, `age.${selections.ageGroup.replace('-', '_')}` as const)}</p>
        <p>{t(language, 'onboarding.language')}: {t(language, `language.${selections.language}` as const)}</p>
        <p>{t(language, 'onboarding.hero')}: {t(language, `hero.${selections.heroType}` as const)}</p>
        <p>{t(language, 'onboarding.world')}: {world?.title[language]}</p>
        <p>{t(language, 'onboarding.mood')}: {t(language, `mood.${selections.storyMood}` as const)}</p>
      </div>
      <button className="w-full rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white" onClick={onCreateFirstSeries}>
        {t(language, 'home.create_first_series')} · {t(language, 'home.next_create_series')}
      </button>
    </section>
  )
}
