import { sevenRoadsSeason1, sevenRoadsSeasons } from '../data/sevenRoadsSeasons'
import { sevenRoadsUiAssets } from '../data/sevenRoadsUiAssets'
import { resolveAuthoredStoryAssetUrl } from '../data/authoredStoryAssets'
import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'
import { sevenRoadsStory1ReadingState } from '../features/publishedStories/sevenRoadsProgress'

export type PublishedStoriesTab = 'home' | 'library'

export function PublishedStoriesShell({
  tab,
  onTab,
  onOpenSeason,
  onContinueStory,
  onOpenSettings,
}: {
  tab: PublishedStoriesTab
  onTab: (tab: PublishedStoriesTab) => void
  onOpenSeason: () => void
  onContinueStory: () => void
  onOpenSettings: () => void
}) {
  const story = sevenRoadsSeason1.story
  const progress = story ? authoredStoryPersistence.load(story) : null
  const reading = sevenRoadsStory1ReadingState(progress)
  const futureSeason = sevenRoadsSeasons.find((season) => season.status === 'coming_soon')
  const seasonCover = story
    ? resolveAuthoredStoryAssetUrl(story.cover_illustration.asset_id, story.cover_illustration.runtime_url)
    : null

  const backgroundUrl =
    tab === 'home' ? sevenRoadsUiAssets.home : sevenRoadsUiAssets.library

  const seasonStatus =
    reading.state === 'completed'
      ? 'Завершён'
      : reading.state === 'in_progress'
        ? `Серия ${reading.currentEpisode} из 6`
        : 'Новый сезон'

  const currentEpisodeTitle =
    sevenRoadsSeason1.episodes[reading.currentEpisode - 1]?.title ?? sevenRoadsSeason1.title

  return (
    <div
      className="relative mx-auto min-h-[100dvh] max-w-[430px] overflow-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: `url("${backgroundUrl}")` }}
    >
      <div
        className={`absolute inset-0 ${
          tab === 'home'
            ? 'bg-gradient-to-b from-[#0f2528]/10 via-[#0f2528]/18 to-[#0b2226]/92'
            : 'bg-gradient-to-b from-[#12252a]/18 via-[#12252a]/28 to-[#172421]/92'
        }`}
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-4 pb-[calc(6.6rem+env(safe-area-inset-bottom))] pt-[max(1.2rem,env(safe-area-inset-top))] sm:px-5">
        <header className="flex items-start justify-between gap-4 px-1">
          <div>
            <p className="font-serif text-xl font-bold tracking-[0.2em] text-[#fff7df] drop-shadow">
              QISSA
            </p>
            <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#efd9aa]">
              Королевство семи дорог
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/18 text-white/95 backdrop-blur-md transition active:scale-[0.96]"
            aria-label="Настройки"
            title="Настройки"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="3.1" />
              <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2.9 2.9-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21H10v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1-2.9-2.9.1-.1A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.5-1H3v-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1 2.9-2.9.1.1A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.5V3h4v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1 2.9 2.9-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1h.1v4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
            </svg>
          </button>
        </header>

        {tab === 'home' ? (
          <>
            <div className="flex-1" />

            <section className="space-y-3">
              {reading.state === 'in_progress' ? (
                <button
                  type="button"
                  onClick={onContinueStory}
                  className="w-full rounded-[1.55rem] border border-white/20 bg-[#102b2f]/74 p-4 text-left shadow-[0_18px_45px_-28px_rgba(0,0,0,.85)] backdrop-blur-xl transition active:scale-[0.99]"
                >
                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#efd6a0]">
                    Продолжить
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <div>
                      <h1 className="font-serif text-2xl font-bold leading-tight text-[#fffaf0]">
                        {currentEpisodeTitle}
                      </h1>
                      <p className="mt-1 text-sm text-[#f1e9db]">
                        Сезон 1 · серия {reading.currentEpisode} из 6
                      </p>
                    </div>
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#ecd09a] text-lg font-black text-[#203c40]">
                      →
                    </span>
                  </div>
                </button>
              ) : null}

              <div>
                <p className="px-1 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#efd6a0]">
                  Сезоны
                </p>

                <div className="mt-2 grid grid-cols-[1.2fr_.8fr] gap-2.5">
                  <button
                    type="button"
                    onClick={onOpenSeason}
                    className="relative min-h-44 overflow-hidden rounded-[1.45rem] border border-white/20 bg-[#17383d] text-left shadow-[0_20px_45px_-30px_rgba(0,0,0,.9)] active:scale-[0.99]"
                  >
                    {seasonCover ? (
                      <img
                        src={seasonCover}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-black/5" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-[0.61rem] font-bold uppercase tracking-[0.14em] text-[#f0d7a0]">
                          Сезон 1
                        </p>
                        <span className="rounded-full bg-black/35 px-2 py-1 text-[0.56rem] font-bold text-white/90 backdrop-blur">
                          {seasonStatus}
                        </span>
                      </div>
                      <h2 className="font-serif text-lg font-bold leading-tight text-white">
                        {sevenRoadsSeason1.title}
                      </h2>
                    </div>
                  </button>

                  {futureSeason ? (
                    <div className="relative min-h-44 overflow-hidden rounded-[1.45rem] border border-white/20 bg-[#17383d] shadow-[0_20px_45px_-30px_rgba(0,0,0,.9)]">
                      <img
                        src={sevenRoadsUiAssets.futureSeasonPlaceholder}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/35 to-black/10" />
                      <div className="absolute inset-x-0 bottom-0 p-3.5">
                        <p className="text-[0.61rem] font-bold uppercase tracking-[0.14em] text-[#f0d7a0]">
                          Сезон {futureSeason.number}
                        </p>
                        <h2 className="mt-1 font-serif text-lg font-bold leading-tight text-white">
                          Скоро
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-white/78">Следующая дорога</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="flex-1" />

            <section className="rounded-[1.7rem] border border-[#e7d5b1] bg-[#fffaf0] p-4 text-[#2d332f] shadow-[0_24px_55px_-34px_rgba(0,0,0,.9)]">
              <div className="mb-3">
                <p className="q-label">Коллекция</p>
                <h1 className="q-heading mt-1 text-2xl font-bold">Королевство семи дорог</h1>
                <p className="mt-1 text-sm leading-6 text-[#665e50]">
                  Истории, сезоны и сохранённый путь.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenSeason}
                className="flex w-full items-center gap-3 rounded-[1.25rem] border border-[#d8c39a] bg-white/78 p-3 text-left active:scale-[0.99]"
              >
                {seasonCover ? (
                  <img
                    src={seasonCover}
                    alt=""
                    className="h-20 w-16 flex-none rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#8a6a36]">
                    Сезон 1 · {seasonStatus}
                  </p>
                  <p className="mt-1 font-serif text-lg font-bold leading-tight text-[#2d332f]">
                    {sevenRoadsSeason1.title}
                  </p>
                  <p className="mt-1 text-xs text-[#716757]">6 серий · 4 решения</p>
                </div>
                <span className="text-xl text-[#1f6670]">›</span>
              </button>

              {futureSeason ? (
                <div className="mt-2.5 flex items-center gap-3 rounded-[1.25rem] border border-[#d8c39a]/80 bg-[#f5ead7]/82 p-3">
                  <img
                    src={sevenRoadsUiAssets.futureSeasonPlaceholder}
                    alt=""
                    className="h-20 w-16 flex-none rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#8a6a36]">
                      Сезон {futureSeason.number}
                    </p>
                    <p className="mt-1 font-serif text-lg font-bold leading-tight">Скоро</p>
                    <p className="mt-1 text-xs leading-5 text-[#716757]">
                      Новый путь откроется позже.
                    </p>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>

      <nav
        className="fixed z-40 mx-auto max-w-[398px] rounded-full border border-white/25 bg-[#0f2c31]/78 p-2 shadow-[0_18px_45px_-26px_rgba(0,0,0,.8)] backdrop-blur-xl"
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
              tab === 'home'
                ? 'bg-[#ecd09a] text-[#243c40]'
                : 'text-white/82 hover:bg-white/10'
            }`}
            onClick={() => onTab('home')}
            aria-current={tab === 'home' ? 'page' : undefined}
          >
            Главная
          </button>
          <button
            type="button"
            className={`min-h-11 rounded-full px-3 py-2.5 text-xs font-bold transition ${
              tab === 'library'
                ? 'bg-[#ecd09a] text-[#243c40]'
                : 'text-white/82 hover:bg-white/10'
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
