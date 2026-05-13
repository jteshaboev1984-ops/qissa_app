import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import { deriveStoryStatus } from '../lib/storyStatus'
import type { Episode, Language, OnboardingSelections, SeriesState } from '../types/qissa'
import { StylePackCover } from '../components/StylePackCover'

export function LibraryScreen({ language, selections, seriesState, episode, onOpenStory, onCreateStory }: { language: Language; selections: OnboardingSelections; seriesState: SeriesState | null; episode: Episode | null; onOpenStory: () => void; onCreateStory: () => void }) {
  const pack = stylePacks.find((p) => p.id === selections.stylePackId) ?? stylePacks[0]
  const status = deriveStoryStatus(selections, seriesState, episode)
  if (!episode) return <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-semibold">{t(language, 'library.empty_title')}</h2><p className="text-sm text-slate-600">{t(language, 'library.empty_body')}</p><button className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-white" onClick={onCreateStory}>{t(language, selections.storyMode === 'series' ? 'home.create_first_series' : 'home.start_one_time')}</button></section>
  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">{t(language, 'nav.library')}</h2>
      <StylePackCover stylePack={pack} variant="card" title={episode.title} subtitle={pack.title[language]} />
      <p className="text-sm text-slate-600">{status === 'completed' ? t(language, 'library.status_completed') : t(language, 'library.status_active')}</p>
      <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white" onClick={onOpenStory}>{t(language, status === 'completed' && selections.storyMode === 'series' ? 'home.open_last_story' : 'home.open_current_story')}</button>
      <p className="text-xs text-slate-500">{t(language, 'library.saved_note')}</p>
    </section>
  )
}
