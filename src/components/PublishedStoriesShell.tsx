import { useState } from 'react'
import { getSevenRoadsSeason1, getSevenRoadsSeasons } from '../data/sevenRoadsSeasons'
import { sevenRoadsUiAssets } from '../data/sevenRoadsUiAssets'
import { resolveAuthoredStoryAssetUrl } from '../data/authoredStoryAssets'
import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'
import { authoredIllustrationDiscovery } from '../lib/authoredIllustrationDiscovery'
import {
  formatSevenRoadsEpisodeLabel,
  formatSevenRoadsEpisodeProgress,
  formatSevenRoadsSeasonEpisodeContext,
  formatSevenRoadsSeasonLabel,
  getSevenRoadsCopy,
  type SevenRoadsLanguage,
} from '../features/publishedStories/sevenRoadsCopy'
import {
  sevenRoadsStory1EpisodeNumber,
  sevenRoadsStory1ReadingState,
} from '../features/publishedStories/sevenRoadsProgress'

export type PublishedStoriesTab = 'home' | 'library'
type LibraryView = 'seasons' | 'gallery'
type LibraryNotice =
  | { kind: 'coming-season'; seasonNumber: number }
  | { kind: 'locked-art'; episodeNumber: number }

export function PublishedStoriesShell({
  language,
  tab,
  onTab,
  onOpenSeason,
  onContinueStory,
  onOpenSettings,
}: {
  language: SevenRoadsLanguage
  tab: PublishedStoriesTab
  onTab: (tab: PublishedStoriesTab) => void
  onOpenSeason: () => void
  onContinueStory: () => void
  onOpenSettings: () => void
}) {
  const copy = getSevenRoadsCopy(language)
  const sevenRoadsSeason1 = getSevenRoadsSeason1(language)
  const sevenRoadsSeasons = getSevenRoadsSeasons(language)
  const story = sevenRoadsSeason1.story
  const progress = story ? authoredStoryPersistence.load(story) : null
  const reading = sevenRoadsStory1ReadingState(progress)

  const [libraryView, setLibraryView] = useState<LibraryView>('seasons')
  const [expandedGallerySeason, setExpandedGallerySeason] = useState<number | null>(null)
  const [expandedGalleryEpisode, setExpandedGalleryEpisode] = useState<string | null>(null)
  const [galleryLightbox, setGalleryLightbox] = useState<{ url: string; alt: string } | null>(null)
  const [notice, setNotice] = useState<LibraryNotice | null>(null)

  const seasonCover = story
    ? resolveAuthoredStoryAssetUrl(
        story.cover_illustration.asset_id,
        story.cover_illustration.runtime_url,
      )
    : null

  const currentEpisodeTitle =
    sevenRoadsSeason1.episodes[reading.currentEpisode - 1]?.title ?? sevenRoadsSeason1.title

  const buildSeasonGallery = (season: (typeof sevenRoadsSeasons)[number]) => {
    if (season.status !== 'published' || !season.story) {
      return { episodes: [], totalItems: 0, unlockedItems: 0 }
    }

    const seasonProgress = authoredStoryPersistence.load(season.story)
    const episodes = authoredIllustrationDiscovery.buildGalleryEpisodes(
      season.story,
      season.episodes.map((episode) => episode.title),
      seasonProgress,
      season.number === 1 ? sevenRoadsStory1EpisodeNumber : undefined,
    )

    return {
      episodes,
      totalItems: episodes.reduce((sum, episode) => sum + episode.items.length, 0),
      unlockedItems: episodes.reduce((sum, episode) => sum + episode.unlockedCount, 0),
    }
  }

  const backgroundUrl = tab === 'home' ? sevenRoadsUiAssets.home : sevenRoadsUiAssets.library

  const homeAction = (() => {
    if (reading.state === 'new') {
      return {
        eyebrow: language === 'uz' ? 'Hikoyani boshlash' : 'Начать историю',
        title: sevenRoadsSeason1.title,
        subtitle: formatSevenRoadsSeasonEpisodeContext(language, 1, 1),
        action: onOpenSeason,
      }
    }

    if (reading.state === 'completed') {
      return {
        eyebrow: language === 'uz' ? 'Mavsum tugadi' : 'Сезон завершён',
        title: sevenRoadsSeason1.title,
        subtitle: language === 'uz' ? 'Yakunini ko‘rish' : 'Посмотреть итог',
        action: onContinueStory,
      }
    }

    return {
      eyebrow: copy.continue,
      title: currentEpisodeTitle,
      subtitle: formatSevenRoadsSeasonEpisodeContext(language, 1, reading.currentEpisode, 6),
      action: onContinueStory,
    }
  })()

  const seasonProgressLabel =
    reading.state === 'completed'
      ? copy.completed
      : reading.state === 'in_progress'
        ? formatSevenRoadsEpisodeProgress(language, reading.currentEpisode, 6)
        : language === 'uz'
          ? 'Boshlanmagan'
          : 'Не начат'

  const closeNotice = () => setNotice(null)

  return (
    <div className="relative mx-auto h-[100dvh] max-w-[430px] overflow-hidden text-white">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${backgroundUrl}")` }}
      />
      <div
        className={`absolute inset-0 z-0 ${
          tab === 'home'
            ? 'bg-gradient-to-b from-[#0f2528]/10 via-[#0f2528]/10 to-[#0b2226]/80'
            : 'bg-gradient-to-b from-[#12252a]/10 via-transparent to-[#0d2024]/72'
        }`}
      />

      {galleryLightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/95 p-3"
          onClick={() => setGalleryLightbox(null)}
          aria-label={language === 'uz' ? 'Lavhani yopish' : 'Закрыть сцену'}
        >
          <img
            src={galleryLightbox.url}
            alt={galleryLightbox.alt}
            className="max-h-full max-w-full rounded-[1.4rem] object-contain"
          />
        </button>
      ) : null}

      {notice ? (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeNotice}
        >
          <section
            className="w-full max-w-[430px] rounded-[1.8rem] border border-[#e1c999] bg-[#fff8e9] p-5 text-[#2d332f] shadow-[0_24px_70px_-30px_rgba(0,0,0,.85)]"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            {notice.kind === 'coming-season' ? (
              <>
                <p className="q-label">
                  {language === 'uz' ? 'Keyingi yo‘l' : 'Следующая дорога'}
                </p>
                <h2 className="q-heading mt-1 text-2xl font-bold">
                  {language === 'uz'
                    ? `${notice.seasonNumber}-mavsum tayyorlanmoqda`
                    : `Сезон ${notice.seasonNumber} готовится`}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#675e4f]">
                  {language === 'uz'
                    ? 'Davomini tayyorlayapmiz. Mavsum tayyor bo‘lganda bu yerda uning muqovasi, qismlari va alohida galereyasi paydo bo‘ladi.'
                    : 'Мы уже готовим продолжение. Когда сезон будет готов, здесь появятся его обложка, серии и собственная галерея.'}
                </p>
                <button type="button" className="q-primary mt-5 w-full" onClick={closeNotice}>
                  {language === 'uz' ? 'Tushunarli' : 'Понятно'}
                </button>
              </>
            ) : (
              <>
                <p className="q-label">{language === 'uz' ? 'Galereya' : 'Галерея'}</p>
                <h2 className="q-heading mt-1 text-2xl font-bold">
                  {language === 'uz' ? 'Lavha hali ochilmagan' : 'Сцена ещё скрыта'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#675e4f]">
                  {language === 'uz'
                    ? `Bu lavha ${notice.episodeNumber}-qismdagi shu joyni o‘qigach ochiladi. Shunda galereya voqealarni oldindan ko‘rsatmaydi.`
                    : `Она откроется после того, как эта сцена появится во время чтения серии ${notice.episodeNumber}. Так Галерея не показывает сюжет заранее.`}
                </p>
                <div className="mt-5 grid gap-2.5">
                  {reading.state === 'in_progress' ? (
                    <button
                      type="button"
                      className="q-primary w-full"
                      onClick={() => {
                        closeNotice()
                        onContinueStory()
                      }}
                    >
                      {language === 'uz' ? 'O‘qishni davom ettirish' : 'Продолжить чтение'}
                    </button>
                  ) : null}
                  <button type="button" className="q-secondary w-full" onClick={closeNotice}>
                    {copy.close}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}

      <div className="relative z-10 flex h-full min-h-0 flex-col px-4 pt-[max(1.2rem,env(safe-area-inset-top))] sm:px-5">
        <header className="flex flex-none items-start justify-between gap-4 px-1">
          <div>
            <p className="font-serif text-xl font-bold tracking-[0.2em] text-[#fff7df] drop-shadow">
              QISSA
            </p>
            <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#efd9aa]">
              {copy.worldTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white/95 backdrop-blur-md transition active:scale-[0.96]"
            aria-label={copy.settings}
            title={copy.settings}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="3.1" />
              <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2.9 2.9-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21H10v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1-2.9-2.9.1-.1A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.5-1H3v-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1 2.9-2.9.1.1A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.5V3h4v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1 2.9 2.9-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1h.1v4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
            </svg>
          </button>
        </header>

        {tab === 'home' ? (
          <>
            <div className="min-h-0 flex-1" />
            <div className="pb-[calc(6.6rem+env(safe-area-inset-bottom))]">
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
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-[40dvh] min-h-[300px] flex-none flex-col justify-end pb-4">
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#efd6a0]">
                {language === 'uz' ? 'Hikoyalar xazinasi' : 'Хранилище историй'}
              </p>
              <h1 className="mt-1 font-serif text-[2.45rem] font-bold leading-none text-[#fffaf0] drop-shadow">
                {copy.library}
              </h1>
              <p className="mt-3 max-w-[350px] text-sm leading-6 text-[#f4ecdf]">
                {language === 'uz'
                  ? 'Sening yo‘lingdagi hikoyalar, mavsumlar va lavhalar.'
                  : 'Истории, сезоны и сцены твоего пути.'}
              </p>
            </div>

            <section className="-mx-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[2rem] border-t border-[#ead8b7]/75 bg-[#f8efdf]/90 text-[#2d332f] shadow-[0_-24px_60px_-40px_rgba(0,0,0,.75)] backdrop-blur-xl sm:-mx-5">
              <div className="relative z-30 flex-none bg-[#fff9ed]/95 px-4 pt-4 backdrop-blur-xl sm:px-5">
                <div className="grid grid-cols-2 border-b border-[#d8c39a]/75">
                  <button
                    type="button"
                    className={`border-b-2 px-3 pb-3 pt-1 text-sm font-bold transition ${
                      libraryView === 'seasons'
                        ? 'border-[#1f6670] text-[#244c52]'
                        : 'border-transparent text-[#786d58]'
                    }`}
                    onClick={() => setLibraryView('seasons')}
                  >
                    {copy.seasons}
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-3 pb-3 pt-1 text-sm font-bold transition ${
                      libraryView === 'gallery'
                        ? 'border-[#1f6670] text-[#244c52]'
                        : 'border-transparent text-[#786d58]'
                    }`}
                    onClick={() => setLibraryView('gallery')}
                  >
                    {language === 'uz' ? 'Galereya' : 'Галерея'}
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-5">
                {libraryView === 'seasons' ? (
                  <div className="space-y-3">
                    <div className="px-1">
                      <p className="q-label">{copy.worldTitle}</p>
                      <h2 className="q-heading mt-1 text-2xl font-bold">{copy.seasons}</h2>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenSeason}
                      className="relative min-h-52 w-full overflow-hidden rounded-[1.55rem] border border-[#cfb57f] bg-[#17383d] text-left shadow-[0_18px_42px_-30px_rgba(0,0,0,.75)] transition active:scale-[0.99]"
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
                            {formatSevenRoadsSeasonLabel(language, 1)}
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

                    {sevenRoadsSeasons
                      .filter((season) => season.status === 'coming_soon')
                      .map((season) => (
                        <button
                          key={season.id}
                          type="button"
                          onClick={() =>
                            setNotice({ kind: 'coming-season', seasonNumber: season.number })
                          }
                          className="relative min-h-40 w-full overflow-hidden rounded-[1.55rem] border border-[#cfb57f]/80 bg-[#17383d] text-left shadow-[0_18px_42px_-30px_rgba(0,0,0,.7)] transition active:scale-[0.99]"
                        >
                          <img
                            src={sevenRoadsUiAssets.futureSeasonPlaceholder}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#f0d7a0]">
                              {formatSevenRoadsSeasonLabel(language, season.number)}
                            </p>
                            <div className="mt-1 flex items-end justify-between gap-3">
                              <h3 className="font-serif text-2xl font-bold text-white">{copy.soon}</h3>
                              <span className="rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-[0.62rem] font-bold text-white/90 backdrop-blur">
                                {language === 'uz' ? 'Tayyorlanmoqda' : 'Готовим'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="px-1">
                      <h2 className="q-heading text-2xl font-bold">
                        {language === 'uz' ? 'Hikoya lavhalari' : 'Сцены сказки'}
                      </h2>
                    </div>

                    <div className="overflow-hidden rounded-[1.15rem] border-y border-[#d8c39a]/80 bg-[#fff9ed]/45">
                      {sevenRoadsSeasons
                        .filter((season) => season.status === 'published' && Boolean(season.story))
                        .map((season) => {
                          const gallery = buildSeasonGallery(season)
                          const expanded = expandedGallerySeason === season.number
                          const progressPercent =
                            gallery.totalItems > 0
                              ? Math.round((gallery.unlockedItems / gallery.totalItems) * 100)
                              : 0
                          const panelId = `gallery-season-${season.number}`

                          return (
                            <section
                              key={season.id}
                              className="border-b border-[#d8c39a]/70 last:border-b-0"
                            >
                              <button
                                type="button"
                                className="flex min-h-[64px] w-full items-center gap-3 px-3 py-3 text-left transition active:bg-[#efe3cf]/75"
                                onClick={() => {
                                  setExpandedGallerySeason(expanded ? null : season.number)
                                  setExpandedGalleryEpisode(null)
                                }}
                                aria-expanded={expanded}
                                aria-controls={panelId}
                              >
                                <h3 className="min-w-0 flex-1 font-serif text-lg font-bold leading-tight text-[#2d332f]">
                                  {season.title}
                                </h3>

                                <div className="flex flex-none items-center gap-2.5">
                                  <span className="text-xs font-bold tabular-nums text-[#756a56]">
                                    {gallery.unlockedItems} / {gallery.totalItems}
                                  </span>
                                  <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                      expanded
                                        ? 'border-[#1f6670]/55 bg-[#e3efeb] text-[#1f6670]'
                                        : 'border-[#cdb583] bg-[#fffaf0] text-[#72582f]'
                                    }`}
                                    aria-hidden="true"
                                  >
                                    <svg
                                      viewBox="0 0 20 20"
                                      className={`h-4 w-4 transition-transform duration-200 ${
                                        expanded ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="m5 7.5 5 5 5-5" />
                                    </svg>
                                  </span>
                                </div>
                              </button>

                              {expanded ? (
                                <div
                                  id={panelId}
                                  className="border-t border-[#d8c39a]/55 px-3 pb-4 pt-3"
                                  role="region"
                                  aria-label={season.title ?? copy.seasons}
                                >
                                  <div
                                    className="h-px overflow-hidden bg-[#d8c39a]/80"
                                    aria-hidden="true"
                                  >
                                    <div
                                      className="h-full bg-[#1f6670]"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>

                                  <div className="mt-4 overflow-hidden rounded-[1rem] border border-[#d8c39a]/70 bg-[#fffaf0]/55">
                                    {gallery.episodes.map((episode) => {
                                      const episodeKey = `${season.number}:${episode.episodeNumber}`
                                      const episodeExpanded =
                                        expandedGalleryEpisode === episodeKey
                                      const episodePanelId =
                                        `gallery-season-${season.number}-episode-${episode.episodeNumber}`

                                      return (
                                        <section
                                          key={episode.episodeNumber}
                                          className="border-b border-[#d8c39a]/65 last:border-b-0"
                                        >
                                          <button
                                            type="button"
                                            className="flex min-h-[62px] w-full items-center gap-3 px-3 py-3 text-left transition active:bg-[#efe3cf]/70"
                                            onClick={() =>
                                              setExpandedGalleryEpisode(
                                                episodeExpanded ? null : episodeKey,
                                              )
                                            }
                                            aria-expanded={episodeExpanded}
                                            aria-controls={episodePanelId}
                                          >
                                            <div className="min-w-0 flex-1">
                                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#8a6a36]">
                                                {formatSevenRoadsEpisodeLabel(language, episode.episodeNumber)}
                                              </p>
                                              <h4 className="mt-0.5 font-serif text-[1.02rem] font-bold leading-tight text-[#2d332f]">
                                                {episode.title}
                                              </h4>
                                            </div>

                                            <div className="flex flex-none items-center gap-2.5">
                                              <span className="text-xs font-semibold tabular-nums text-[#756a56]">
                                                {episode.unlockedCount} / {episode.items.length}
                                              </span>
                                              <span
                                                className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                                                  episodeExpanded
                                                    ? 'border-[#1f6670]/50 bg-[#e3efeb] text-[#1f6670]'
                                                    : 'border-[#d2bd91] bg-[#fffaf0] text-[#72582f]'
                                                }`}
                                                aria-hidden="true"
                                              >
                                                <svg
                                                  viewBox="0 0 20 20"
                                                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                                    episodeExpanded ? 'rotate-180' : ''
                                                  }`}
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="1.8"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <path d="m5 7.5 5 5 5-5" />
                                                </svg>
                                              </span>
                                            </div>
                                          </button>

                                          {episodeExpanded ? (
                                            <div
                                              id={episodePanelId}
                                              className="border-t border-[#d8c39a]/50 px-3 pb-3 pt-3"
                                              role="region"
                                              aria-label={episode.title}
                                            >
                                              <div className="grid grid-cols-2 gap-2.5">
                                                {episode.items.map((item) => {
                                                  const url =
                                                    item.unlocked && item.assetId
                                                      ? resolveAuthoredStoryAssetUrl(
                                                          item.assetId,
                                                          item.runtimeUrl,
                                                        )
                                                      : null

                                                  if (url) {
                                                    return (
                                                      <button
                                                        key={item.key}
                                                        type="button"
                                                        className="aspect-[4/3] overflow-hidden rounded-[1.2rem] border border-[#d4bc8d] bg-[#e9dcc5] shadow-[0_14px_32px_-26px_rgba(74,49,13,.75)] transition active:scale-[0.98]"
                                                        onClick={() =>
                                                          setGalleryLightbox({
                                                            url,
                                                            alt: item.alt,
                                                          })
                                                        }
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
                                                    <button
                                                      key={item.key}
                                                      type="button"
                                                      className="relative aspect-[4/3] overflow-hidden rounded-[1.2rem] border border-[#cfb57f]/80 bg-[#17383d] text-left shadow-[0_14px_32px_-26px_rgba(74,49,13,.7)] transition active:scale-[0.98]"
                                                      onClick={() =>
                                                        setNotice({
                                                          kind: 'locked-art',
                                                          episodeNumber: episode.episodeNumber,
                                                        })
                                                      }
                                                      aria-label={
                                                        language === 'uz'
                                                          ? `${episode.episodeNumber}-qism lavhasi hali ochilmagan`
                                                          : `Сцена серии ${episode.episodeNumber} ещё не открыта`
                                                      }
                                                    >
                                                      <img
                                                        src={sevenRoadsUiAssets.futureSeasonPlaceholder}
                                                        alt=""
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                        loading="lazy"
                                                      />
                                                      <div className="absolute inset-0 bg-[#10282d]/60" />
                                                      <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="rounded-full border border-[#efd7a7]/60 bg-black/25 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#fff4dc] backdrop-blur-sm">
                                                          {language === 'uz'
                                                            ? 'Ochilmagan'
                                                            : 'Не открыто'}
                                                        </div>
                                                      </div>
                                                    </button>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                          ) : null}
                                        </section>
                                      )
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </section>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <nav
        className="absolute inset-x-4 z-50 mx-auto max-w-[398px] rounded-full border border-white/25 bg-[#0f2c31]/80 p-1.5 shadow-[0_18px_45px_-26px_rgba(0,0,0,.8)] backdrop-blur-xl"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        aria-label="QISSA"
      >
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className={`min-h-10 rounded-full px-3 py-2 text-xs font-bold transition ${
              tab === 'home'
                ? 'bg-[#ecd09a] text-[#243c40]'
                : 'text-white/80 hover:bg-white/10'
            }`}
            onClick={() => onTab('home')}
            aria-current={tab === 'home' ? 'page' : undefined}
          >
            {copy.home}
          </button>
          <button
            type="button"
            className={`min-h-10 rounded-full px-3 py-2 text-xs font-bold transition ${
              tab === 'library'
                ? 'bg-[#ecd09a] text-[#243c40]'
                : 'text-white/80 hover:bg-white/10'
            }`}
            onClick={() => onTab('library')}
            aria-current={tab === 'library' ? 'page' : undefined}
          >
            {copy.library}
          </button>
        </div>
      </nav>
    </div>
  )
}
