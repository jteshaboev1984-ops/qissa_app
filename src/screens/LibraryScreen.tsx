import { StylePackCover } from '../components/StylePackCover'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import { deriveStoryStatus } from '../lib/storyStatus'
import type { Episode, Language, OnboardingSelections, SeriesState } from '../types/qissa'

export function LibraryScreen({
  language,
  selections,
  seriesState,
  episode,
  onOpenStory,
  onCreateStory,
}: {
  language: Language
  selections: OnboardingSelections
  seriesState: SeriesState | null
  episode: Episode | null
  onOpenStory: () => void
  onCreateStory: () => void
}) {
  const pack = stylePacks.find((p) => p.id === selections.stylePackId) ?? stylePacks[0]
  const status = deriveStoryStatus(selections, seriesState, episode)

  if (!episode) {
    return (
      <section className="space-y-5">
        <div className="px-1">
          <p className="q-label mb-2">{t(language, 'nav.library')}</p>
          <h2 className="q-heading text-3xl font-bold leading-tight">{t(language, 'library.empty_title')}</h2>
        </div>
        <div className="q-card overflow-hidden p-0">
          <StylePackCover stylePack={pack} variant="hero" title={pack.title[language]} subtitle={t(language, 'library.empty_title')} />
          <div className="space-y-4 p-5">
            <p className="text-sm leading-6 text-[#625846]">{t(language, 'library.empty_body')}</p>
            <button className="q-primary w-full" onClick={onCreateStory}>
              {t(language, selections.storyMode === 'series' ? 'home.create_first_series' : 'home.start_one_time')}
            </button>
          </div>
        </div>
      </section>
    )
  }

  const completed = status === 'completed'

  return (
    <section className="space-y-5">
      <div className="px-1">
        <p className="q-label mb-2">{t(language, 'nav.library')}</p>
        <h2 className="q-heading text-3xl font-bold leading-tight">{t(language, 'nav.library')}</h2>
      </div>
      <article className="q-card overflow-hidden p-0">
        <StylePackCover stylePack={pack} variant="hero" title={episode.title} subtitle={pack.title[language]} />
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="q-label">{completed ? t(language, 'library.status_completed') : t(language, 'library.status_active')}</p>
            <span className="rounded-full bg-[#f4ead8] px-3 py-1 text-xs font-bold text-[#735c00]">
              {t(language, selections.storyMode === 'series' ? 'mode.series' : 'mode.one_time')}
            </span>
          </div>
          {seriesState?.lastEpisodeSummary ? (
            <p className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3 text-sm leading-6 text-[#4d4635]">
              {seriesState.lastEpisodeSummary}
            </p>
          ) : null}
          <button className="q-primary w-full" onClick={onOpenStory}>
            {completed && selections.storyMode === 'series' ? t(language, 'home.open_last_story') : t(language, 'home.open_current_story')}
          </button>
          <p className="text-center text-xs leading-5 text-[#7a705d]">{t(language, 'library.saved_note')}</p>
        </div>
      </article>
    </section>
  )
}
