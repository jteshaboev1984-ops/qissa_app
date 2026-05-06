import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Episode, Language, OnboardingSelections, SeriesState } from '../types/qissa'

interface HomeScreenProps {
  language: Language
  selections: OnboardingSelections
  seriesState: SeriesState | null
  episode: Episode | null
  onCreateFirstSeries: () => void
  onContinueStory: () => void
  onResetStory: () => void
}

export function HomeScreen({ language, selections, seriesState, episode, onCreateFirstSeries, onContinueStory, onResetStory }: HomeScreenProps) {
  const world = stylePacks.find((pack) => pack.id === selections.stylePackId)

  const hasContinuableStory = Boolean(
    seriesState &&
      seriesState.episodeCount > 0 &&
      (seriesState.lastEpisodeSummary.trim().length > 0 || episode),
  )

  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-2xl font-semibold text-slate-900">{t(language, 'home.ready')}</h2>

      <div className="rounded-2xl bg-amber-50/80 p-4 text-sm leading-relaxed text-slate-700">
        <p>{t(language, 'onboarding.age')}: {t(language, `age.${selections.ageGroup.replace('-', '_')}` as const)}</p>
        <p>{t(language, 'onboarding.language')}: {t(language, `language.${selections.language}` as const)}</p>
        <p>{t(language, 'onboarding.hero')}: {t(language, `hero.${selections.heroType}` as const)}</p>
        <p>{t(language, 'onboarding.world')}: {world?.title[language]}</p>
        <p>{t(language, 'onboarding.mood')}: {t(language, `mood.${selections.storyMood}` as const)}</p>
      </div>

      {hasContinuableStory ? (
        <div className="space-y-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <h3 className="text-lg font-semibold">{t(language, 'home.continue_story')}</h3>
          <p className="text-sm">{t(language, 'home.world_remembers')}</p>
          <p className="text-sm">
            <span className="font-semibold">{t(language, 'home.last_episode_summary')}:</span>{' '}
            {seriesState?.lastEpisodeSummary}
          </p>
          <button
            className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 font-semibold text-white"
            onClick={onContinueStory}
          >
            {t(language, 'home.continue_story')}
          </button>
        </div>
      ) : (
        <button
          className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 font-semibold text-white"
          onClick={onCreateFirstSeries}
        >
          {t(language, 'home.create_first_series')}
        </button>
      )}

      <div className="rounded-2xl bg-slate-50 p-4 text-center">
        <p className="mb-3 text-sm text-slate-600">{t(language, 'home.restart_story')}</p>
        <button
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          onClick={onResetStory}
        >
          {t(language, 'home.reset_story')}
        </button>
      </div>
    </section>
  )
}
