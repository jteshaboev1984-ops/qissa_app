import { useMemo, useState } from 'react'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import { deriveStoryStatus, isStoryCompleted } from '../lib/storyStatus'
import type { Episode, Language, OnboardingSelections, SeriesState } from '../types/qissa'

interface HomeScreenProps {
  language: Language
  selections: OnboardingSelections
  seriesState: SeriesState | null
  episode: Episode | null
  onCreateFirstSeries: () => void
  onContinueStory: () => void
  onResetStory: () => void
  onEditSetup: () => void
}

const ageKeyByGroup = {
  '3-5': 'age.3_5',
  '6-8': 'age.6_8',
  '9-10': 'age.9_10',
} as const

export function HomeScreen({ language, selections, seriesState, episode, onCreateFirstSeries, onContinueStory, onResetStory, onEditSetup }: HomeScreenProps) {
  const [showDetails, setShowDetails] = useState(false)
  const world = stylePacks.find((pack) => pack.id === selections.stylePackId)
  const isSeriesMode = selections.storyMode === 'series'
  const storyStatus = deriveStoryStatus(selections, seriesState, episode)
  const hasStory = storyStatus !== 'not_started'
  const isCompleted = isStoryCompleted(selections, seriesState, episode)

  const compactSummary = useMemo(() => {
    const hero = t(language, `hero.${selections.heroType}` as const)
    const mood = t(language, `mood.${selections.storyMood}` as const)
    return `${hero} · ${world?.title[language]} · ${mood}`
  }, [language, selections.heroType, selections.storyMood, world])

  const renderPrimaryAction = () => {
    if (!hasStory) {
      return (
        <button className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 font-semibold text-white" onClick={onCreateFirstSeries}>
          {isSeriesMode ? t(language, 'home.create_first_series') : t(language, 'home.start_one_time')}
        </button>
      )
    }

    if (!isCompleted) {
      return (
        <div className="space-y-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <h3 className="text-lg font-semibold">{t(language, 'home.continue_story')}</h3>
          <p className="text-sm">{isSeriesMode ? t(language, 'home.world_remembers') : t(language, 'home.one_time_in_progress')}</p>
          <button className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 font-semibold text-white" onClick={onContinueStory}>{t(language, 'home.continue_story')}</button>
        </div>
      )
    }

    return (
      <div className="space-y-3 rounded-2xl bg-sky-50 p-4 text-slate-900">
        <h3 className="text-lg font-semibold">{t(language, 'home.story_completed_title')}</h3>
        <p className="text-sm">{isSeriesMode ? t(language, 'home.story_completed_body') : t(language, 'home.one_time_completed_body')}</p>
        <div className="grid grid-cols-1 gap-2">
          <button className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold" onClick={onContinueStory}>{t(language, 'home.reopen_story')}</button>
          <button className="w-full rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white" onClick={onResetStory}>{t(language, 'home.start_new_story')}</button>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">{t(language, 'home.ready')}</h2>
        <button onClick={onEditSetup} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700">{t(language, 'home.edit_setup')}</button>
      </div>

      <div className="rounded-2xl bg-amber-50/80 p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900">{compactSummary}</p>
        <button className="mt-2 text-xs font-semibold text-amber-700" onClick={() => setShowDetails((v) => !v)}>{showDetails ? t(language, 'home.hide_details') : t(language, 'home.show_details')}</button>
        {showDetails && (
          <div className="mt-3 space-y-1 border-t border-amber-100 pt-3">
            <p>{t(language, 'onboarding.age')}: {t(language, ageKeyByGroup[selections.ageGroup])}</p>
            <p>{t(language, 'onboarding.language')}: {t(language, `language.${selections.language}` as const)}</p>
            <p>{t(language, 'onboarding.hero')}: {t(language, `hero.${selections.heroType}` as const)}</p>
            <p>{t(language, 'onboarding.world')}: {world?.title[language]}</p>
            <p>{t(language, 'onboarding.story_mode')}: {t(language, selections.storyMode === 'series' ? 'mode.series' : 'mode.one_time')}</p>
            <p>{t(language, 'onboarding.mood')}: {t(language, `mood.${selections.storyMood}` as const)}</p>
          </div>
        )}
      </div>

      {renderPrimaryAction()}

      <div className="rounded-2xl bg-slate-50 p-4 text-center">
        <p className="mb-3 text-sm text-slate-600">{t(language, 'home.restart_story')}</p>
        <button className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700" onClick={onResetStory}>{t(language, 'home.reset_story_soft')}</button>
      </div>
    </section>
  )
}
