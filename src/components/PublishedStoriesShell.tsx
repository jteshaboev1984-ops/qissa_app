import { sevenRoadsSeason1, sevenRoadsSeason2 } from '../data/sevenRoadsSeasons'
import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'
import { sevenRoadsStory1ReadingState } from '../features/publishedStories/sevenRoadsProgress'
import { SevenRoadsMark } from './SevenRoadsMark'

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

  const seasonStatus =
    reading.state === 'completed'
      ? 'Завершён'
      : reading.state === 'in_progress'
        ? `Серия ${reading.currentEpisode} из 6`
        : 'Новый сезон'

  return (
    <div className="relative min-h-screen text-[#2d332f]">
      <div className="mx-auto max-w-[430px] px-4 py-5 pb-28 sm:px-6">
        <section className="q-world-panel mb-5 p-5">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-24 flex-none text-[#ead3a0]">
              <SevenRoadsMark compact />
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#ead3a0]">QISSA</p>
              <h1 className="mt-1 font-serif text-3xl font-bold leading-tight text-[#fff9ec]">
                {tab === 'home' ? 'Дом историй' : 'Библиотека'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#eaf3f1]">
                Королевство семи дорог
              </p>
            </div>
          </div>
        </section>

        {tab === 'home' && reading.state === 'in_progress' ? (
          <section className="q-stone-panel mb-5 space-y-4 p-5">
            <div>
              <p className="q-label mb-1">Продолжить путь</p>
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
            <p className="q-label mb-1">{tab === 'home' ? 'Сезоны' : 'Коллекция'}</p>
            <h2 className="q-heading text-2xl font-bold">
              {tab === 'home' ? 'Выберите сезон' : 'Королевство семи дорог'}
            </h2>
          </div>

          <section className="q-arch-card p-5 pt-8">
            <div className="mx-auto mb-3 w-24 text-[#1f6670]">
              <SevenRoadsMark compact />
            </div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="q-label">Сезон 1</p>
              <span className="q-badge">{seasonStatus}</span>
            </div>
            <h3 className="q-heading text-center text-2xl font-bold leading-tight">{sevenRoadsSeason1.title}</h3>
            <div className="q-ornament-rule my-4" />
            <p className="text-center text-sm leading-6 text-[#5f5848]">
              6 серий · 4 решения · для 8–9 лет
            </p>

            <button type="button" className="q-primary mt-5 w-full" onClick={onOpenSeason}>
              {reading.state === 'new' ? 'Открыть сезон' : 'Смотреть сезон'}
            </button>
          </section>

          <section className="q-stone-panel p-5">
            <div className="flex items-start gap-4">
              <div className="w-20 flex-none text-[#8a7859] opacity-70">
                <SevenRoadsMark compact />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="q-label">Сезон {sevenRoadsSeason2.number}</p>
                  <span className="q-badge opacity-75">СКОРО</span>
                </div>
                <h3 className="q-heading mt-1 text-2xl font-bold">Следующая дорога</h3>
                <p className="mt-2 text-sm leading-6 text-[#625846]">
                  Скоро откроется новый сезон. Решения из первого сезона останутся с миром и героями.
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>

      <nav
        className="fixed z-40 mx-auto max-w-[398px] rounded-full border border-[#cdb483] bg-[#fffaf0]/94 p-2 shadow-[0_18px_45px_-26px_rgba(49,45,34,0.55)] backdrop-blur-xl"
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
              tab === 'home' ? 'bg-[#1f6670] text-[#fff9ec]' : 'text-[#665d49] hover:bg-[#f1e2c7]'
            }`}
            onClick={() => onTab('home')}
            aria-current={tab === 'home' ? 'page' : undefined}
          >
            Главная
          </button>
          <button
            type="button"
            className={`min-h-11 rounded-full px-3 py-2.5 text-xs font-bold transition ${
              tab === 'library' ? 'bg-[#1f6670] text-[#fff9ec]' : 'text-[#665d49] hover:bg-[#f1e2c7]'
            }`}
            onClick={() => onTab('library')}
            aria-current={tab === 'library' ? 'page' : undefined}
          >
            Библиотека
          </button>
        </div>
      </nav>
    </div>
  )
}
