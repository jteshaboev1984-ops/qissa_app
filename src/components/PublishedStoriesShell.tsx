import { resolveAuthoredStoryAssetUrl } from '../data/authoredStoryAssets'
import { sevenRoadsSeason1, sevenRoadsSeason2 } from '../data/sevenRoadsSeasons'
import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'
import { sevenRoadsStory1ReadingState } from '../features/publishedStories/sevenRoadsProgress'

export type PublishedStoriesTab = 'home' | 'library'

export function PublishedStoriesShell({
  tab,
  onTab,
  onOpenSeason,
  onContinueStory,
}: {
  tab: PublishedStoriesTab
  onTab: (tab: PublishedStoriesTab) => void
  onOpenSeason: () => void
  onContinueStory: () => void
}) {
  const story = sevenRoadsSeason1.story
  const progress = story ? authoredStoryPersistence.load(story) : null
  const reading = sevenRoadsStory1ReadingState(progress)
  const coverUrl = story
    ? resolveAuthoredStoryAssetUrl(story.cover_illustration.asset_id, story.cover_illustration.runtime_url)
    : null

  const seasonStatus =
    reading.state === 'completed'
      ? 'Завершён'
      : reading.state === 'in_progress'
        ? `Серия ${reading.currentEpisode} из 6`
        : 'Новый сезон'

  return (
    <div className="relative min-h-screen text-[#1f241d]">
      <div className="mx-auto max-w-[430px] px-4 py-5 pb-28 sm:px-6">
        <header className="mb-5">
          <p className="q-label mb-2">QISSA</p>
          <h1 className="q-heading text-3xl font-bold leading-tight">
            {tab === 'home' ? 'Дом историй' : 'Библиотека'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#625846]">
            {tab === 'home'
              ? 'Интерактивные сезоны, где решения ребёнка продолжают жить в следующих историях.'
              : 'Все опубликованные сезоны QISSA и ваш сохранённый прогресс.'}
          </p>
        </header>

        {tab === 'home' && reading.state === 'in_progress' ? (
          <section className="q-card mb-5 space-y-4 p-5">
            <div>
              <p className="q-label mb-1">Продолжить</p>
              <h2 className="q-heading text-2xl font-bold">{sevenRoadsSeason1.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#625846]">
                Сезон 1 · серия {reading.currentEpisode} из 6
              </p>
            </div>
            <button type="button" className="q-primary w-full" onClick={onContinueStory}>
              Продолжить чтение
            </button>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="px-1">
            <p className="q-label mb-1">
              {tab === 'home' ? 'Сезоны' : sevenRoadsSeason1.worldTitle}
            </p>
            <h2 className="q-heading text-2xl font-bold">
              {tab === 'home' ? 'Королевство семи дорог' : 'Сезоны'}
            </h2>
          </div>

          <section className="q-card overflow-hidden p-0">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={sevenRoadsSeason1.title ?? 'Сезон 1'}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            ) : null}

            <div className="space-y-4 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="q-label">Сезон 1</p>
                  <span className="rounded-full bg-[#f4ead8] px-3 py-1 text-xs font-bold text-[#735c00]">
                    {seasonStatus}
                  </span>
                </div>
                <h3 className="q-heading text-2xl font-bold leading-tight">{sevenRoadsSeason1.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f5848]">
                  6 серий · 4 решения · для 8–9 лет
                </p>
              </div>

              <button type="button" className="q-primary w-full" onClick={onOpenSeason}>
                {reading.state === 'new' ? 'Открыть сезон' : 'Смотреть сезон'}
              </button>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-dashed border-[#d8c7a9] bg-[#f8f1e4] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="q-label mb-2">Сезон {sevenRoadsSeason2.number}</p>
                <h3 className="q-heading text-2xl font-bold">Скоро</h3>
              </div>
              <span className="rounded-full bg-[#ece4d5] px-3 py-1 text-xs font-bold text-[#756a56]">
                СКОРО
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#625846]">
              Следующая дорога скоро откроется. Решения из первого сезона останутся с Темуром и Самирой.
            </p>
          </section>
        </section>
      </div>

      <nav
        className="fixed z-40 mx-auto max-w-[398px] rounded-full border border-[#e4d8c0] bg-[#fffdf7]/92 p-2 shadow-[0_18px_45px_-26px_rgba(49,45,34,0.55)] backdrop-blur-xl"
        style={{
          left: 'max(1rem, env(safe-area-inset-left))',
          right: 'max(1rem, env(safe-area-inset-right))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
        aria-label="QISSA"
      >
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className={`min-h-11 rounded-full px-3 py-2.5 text-xs font-bold transition ${
              tab === 'home' ? 'bg-[#d4af37] text-[#2b2100]' : 'text-[#665d49] hover:bg-[#f4ead8]'
            }`}
            onClick={() => onTab('home')}
            aria-current={tab === 'home' ? 'page' : undefined}
          >
            ⌂&nbsp;&nbsp;Главная
          </button>
          <button
            type="button"
            className={`min-h-11 rounded-full px-3 py-2.5 text-xs font-bold transition ${
              tab === 'library' ? 'bg-[#d4af37] text-[#2b2100]' : 'text-[#665d49] hover:bg-[#f4ead8]'
            }`}
            onClick={() => onTab('library')}
            aria-current={tab === 'library' ? 'page' : undefined}
          >
            ☰&nbsp;&nbsp;Библиотека
          </button>
        </div>
      </nav>
    </div>
  )
}
