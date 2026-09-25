import { useState } from 'react'
import { sevenRoadsSeason1, sevenRoadsSeasons } from '../data/sevenRoadsSeasons'
import { sevenRoadsUiAssets } from '../data/sevenRoadsUiAssets'
import { resolveAuthoredStoryAssetUrl } from '../data/authoredStoryAssets'
import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'
import { authoredIllustrationDiscovery } from '../lib/authoredIllustrationDiscovery'
import { sevenRoadsStory1ReadingState } from '../features/publishedStories/sevenRoadsProgress'

export type PublishedStoriesTab = 'home' | 'library'
type LibraryView = 'seasons' | 'gallery'

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
  const [libraryView, setLibraryView] = useState<LibraryView>('seasons')
  const [galleryLightbox, setGalleryLightbox] = useState<{ url: string; alt: string } | null>(null)

  const seasonCover = story
    ? resolveAuthoredStoryAssetUrl(story.cover_illustration.asset_id, story.cover_illustration.runtime_url)
    : null

  const currentEpisodeTitle =
    sevenRoadsSeason1.episodes[reading.currentEpisode - 1]?.title ?? sevenRoadsSeason1.title

  const galleryEpisodes = story
    ? authoredIllustrationDiscovery.buildGalleryEpisodes(
        story,
        sevenRoadsSeason1.episodes.map((episode) => episode.title),
        progress,
      )
    : []

  const totalGalleryItems = galleryEpisodes.reduce((sum, episode) => sum + episode.items.length, 0)
  const unlockedGalleryItems = galleryEpisodes.reduce(
    (sum, episode) => sum + episode.unlockedCount,
    0,
  )

  const backgroundUrl = tab === 'home' ? sevenRoadsUiAssets.home : sevenRoadsUiAssets.library

  const homeAction = (() => {
    if (reading.state === 'new') {
      return {
        eyebrow: 'Начать историю',
        title: sevenRoadsSeason1.title,
        subtitle: 'Сезон 1 · серия 1',
        action: onOpenSeason,
      }
    }

    if (reading.state === 'completed') {
      return {
        eyebrow: 'Сезон завершён',
        title: sevenRoadsSeason1.title,
        subtitle: 'Посмотреть итог',
        action: onContinueStory,
      }
    }

    return {
      eyebrow: 'Продолжить',
      title: currentEpisodeTitle,
      subtitle: `Сезон 1 · серия ${reading.currentEpisode} из 6`,
      action: onContinueStory,
    }
  })()

  const seasonProgressLabel =
    reading.state === 'completed'
      ? 'Завершён'
      : reading.state === 'in_progress'
        ? `Серия ${reading.currentEpisode} из 6`
        : 'Не начат'

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px] overflow-x-hidden text-white">
      <div
        className="fixed inset-y-0 left-1/2 z-0 w-full max-w-[430px] -translate-x-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url("${backgroundUrl}")` }}
      />
      <div
        className={`fixed inset-y-0 left-1/2 z-0 w-full max-w-[430px] -translate-x-1/2 ${
          tab === 'home'
            ? 'bg-gradient-to-b from-[#0f2528]/10 via-[#0f2528]/10 to-[#0b2226]/80'
            : 'bg-gradient-to-b from-[#12252a]/10 via-transparent to-[#172421]/50'
        }`}
      />

      {galleryLightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/95 p-3"
          onClick={() => setGalleryLightbox(null)}
          aria-label="Закрыть иллюстрацию"
        >
          <img
            src={galleryLightbox.url}
            alt={galleryLightbox.alt}
            className="max-h-full max-w-full rounded-[1.4rem] object-contain"
          />
        </button>
      ) : null}

      <div
        className={`relative z-10 flex min-h-[100dvh] flex-col px-4 pt-[max(1.2rem,env(safe-area-inset-top))] sm:px-5 ${
          tab === 'home'
            ? 'pb-[calc(6.6rem+env(safe-area-inset-bottom))]'
            : 'pb-[calc(6.6rem+env(safe-area-inset-bottom))]'
        }`}
      >
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
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white/95 backdrop-blur-md transition active:scale-[0.96]"
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
            <div className="flex-1 min-h-[48dvh]" />
            <button
              type="button"
              onClick={homeAction.action}
              className="w-full rounded-[1.65rem] border border-[#efd59b]/50 bg-[#102b2f]/75 p-5 text-left shadow-[0_22px_50px_-28px_rgba(0,0,0,.9)] backdrop-blur-xl transition active:scale-[0.99]"
            >
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#efd6a0]">
                {homeAction.eyebrow}
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-serif text-2xl font-bold leading-tight text-[#fffaf0]">
                    {homeAction.title}
                  </h1>
                  <p className="mt-1 text-sm text-[#f1e9db]">{homeAction.subtitle}</p>
                </div>
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#ecd09a] text-lg font-black text-[#203c40]">
                  →
                </span>
              </div>
            </button>
          </>
        ) : (
          <>
            <div className="flex min-h-[34dvh] flex-col justify-end pb-5 pt-8">
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#efd6a0]">
                Хранилище историй
              </p>
              <h1 className="mt-1 font-serif text-[2.45rem] font-bold leading-none text-[#fffaf0] drop-shadow">
                Библиотека
              </h1>
              <p className="mt-3 max-w-[350px] text-sm leading-6 text-[#f4ecdf]">
                Истории, сезоны и иллюстрации твоего пути.
              </p>
            </div>

            <section className="-mx-4 min-h-[58dvh] rounded-t-[2rem] border-t border-[#ead8b7]/75 bg-[#f8efdf]/90 px-4 pb-8 pt-4 text-[#2d332f] shadow-[0_-24px_60px_-40px_rgba(0,0,0,.75)] backdrop-blur-xl sm:-mx-5 sm:px-5">
              <div className="sticky top-0 z-30 -mx-1 rounded-[1.3rem] border border-[#d7bf92]/80 bg-[#fff9ed]/95 p-1 shadow-[0_12px_32px_-28px_rgba(74,49,13,.7)] backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    className={`rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
                      libraryView === 'seasons'
                        ? 'bg-[#1f6670] text-[#fffaf0]'
                        : 'text-[#665d49]'
                    }`}
                    onClick={() => setLibraryView('seasons')}
                  >
                    Сезоны
                  </button>
                  <button
                    type="button"
                    className={`rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
                      libraryView === 'gallery'
                        ? 'bg-[#1f6670] text-[#fffaf0]'
                        : 'text-[#665d49]'
                    }`}
                    onClick={() => setLibraryView('gallery')}
                  >
                    Галерея
                  </button>
                </div>
              </div>

              {libraryView === 'seasons' ? (
                <div className="mt-5 space-y-3">
                  <div className="px-1">
                    <p className="q-label">Королевство семи дорог</p>
                    <h2 className="q-heading mt-1 text-2xl font-bold">Сезоны</h2>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenSeason}
                    className="relative min-h-52 w-full overflow-hidden rounded-[1.55rem] border border-[#cfb57f] bg-[#17383d] text-left shadow-[0_18px_42px_-30px_rgba(0,0,0,.75)] active:scale-[0.99]"
                  >
                    {seasonCover ? (
                      <img
                        src={seasonCover}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#f0d7a0]">
                          Сезон 1
                        </p>
                        <span className="rounded-full bg-black/35 px-2.5 py-1 text-[0.62rem] font-bold text-white/90 backdrop-blur">
                          {seasonProgressLabel}
                        </span>
                      </div>
                      <h3 className="mt-1 font-serif text-2xl font-bold leading-tight text-white">
                        {sevenRoadsSeason1.title}
                      </h3>
                    </div>
                  </button>

                  {futureSeason ? (
                    <div className="relative min-h-40 overflow-hidden rounded-[1.55rem] border border-[#cfb57f]/80 bg-[#17383d] shadow-[0_18px_42px_-30px_rgba(0,0,0,.7)]">
                      <img
                        src={sevenRoadsUiAssets.futureSeasonPlaceholder}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#f0d7a0]">
                          Сезон {futureSeason.number}
                        </p>
                        <h3 className="mt-1 font-serif text-2xl font-bold text-white">Скоро</h3>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-5 space-y-6">
                  <div className="flex items-end justify-between gap-4 px-1">
                    <div>
                      <p className="q-label">Открыто по мере чтения</p>
                      <h2 className="q-heading mt-1 text-2xl font-bold">Галерея</h2>
                    </div>
                    <p className="text-xs font-bold text-[#756a56]">
                      {unlockedGalleryItems} из {totalGalleryItems}
                    </p>
                  </div>

                  {galleryEpisodes.map((episode) => (
                    <section key={episode.episodeNumber}>
                      <div className="mb-2.5 flex items-end justify-between gap-3 px-1">
                        <div>
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#8a6a36]">
                            Серия {episode.episodeNumber}
                          </p>
                          <h3 className="font-serif text-lg font-bold leading-tight text-[#2d332f]">
                            {episode.title}
                          </h3>
                        </div>
                        <p className="text-xs font-semibold text-[#756a56]">
                          {episode.unlockedCount} из {episode.items.length}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {episode.items.map((item) => {
                          const url =
                            item.unlocked && item.assetId
                              ? resolveAuthoredStoryAssetUrl(item.assetId, item.runtimeUrl)
                              : null

                          if (url) {
                            return (
                              <button
                                key={item.key}
                                type="button"
                                className="aspect-[4/3] overflow-hidden rounded-[1.2rem] border border-[#d4bc8d] bg-[#e9dcc5] shadow-[0_14px_32px_-26px_rgba(74,49,13,.75)] active:scale-[0.98]"
                                onClick={() => setGalleryLightbox({ url, alt: item.alt })}
                              >
                                <img
                                  src={url}
                                  alt={item.alt}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            )
                          }

                          return (
                            <div
                              key={item.key}
                              className="flex aspect-[4/3] items-center justify-center rounded-[1.2rem] border border-dashed border-[#cdb98f] bg-[#e8dcc8]/70"
                              aria-label="Иллюстрация ещё не открыта"
                            >
                              <div className="text-center text-[#897b64]">
                                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#bca77d] bg-[#f4ead7]/75 text-base">
                                  ◇
                                </div>
                                <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.08em]">
                                  Не открыто
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <nav
        className="fixed z-40 mx-auto max-w-[398px] rounded-full border border-white/25 bg-[#0f2c31]/80 p-2 shadow-[0_18px_45px_-26px_rgba(0,0,0,.8)] backdrop-blur-xl"
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
                : 'text-white/80 hover:bg-white/10'
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
                : 'text-white/80 hover:bg-white/10'
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
