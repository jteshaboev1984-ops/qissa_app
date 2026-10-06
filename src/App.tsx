import { useEffect, useMemo, useState } from 'react'
import { PublishedStoriesShell, type PublishedStoriesTab } from './components/PublishedStoriesShell'
import { PublishedStoriesWelcome } from './components/PublishedStoriesWelcome'
import { SeasonOverview } from './components/SeasonOverview'
import { SevenRoadsSettingsScreen } from './components/SevenRoadsSettingsScreen'
import {
  getPrimaryPublishedSeasonStory,
  getSeasonStoryByNumber,
  getSevenRoadsSeason1,
  getSevenRoadsSeasons,
} from './data/sevenRoadsSeasons'
import { AuthoredStoryPlayer } from './features/authoredStory/AuthoredStoryPlayer'
import { getSevenRoadsCopy } from './features/publishedStories/sevenRoadsCopy'
import { publishedStoriesConsent } from './lib/publishedStoriesConsent'
import { authoredStoryPersistence } from './lib/authoredStoryPersistence'
import { authoredReadingPosition } from './lib/authoredReadingPosition'
import { authoredIllustrationDiscovery } from './lib/authoredIllustrationDiscovery'
import { sevenRoadsLanguagePreference } from './lib/sevenRoadsLanguagePreference'
import { sevenRoadsReaderPreferences } from './lib/sevenRoadsReaderPreferences'
import type { AuthoredStoryPackage } from './features/authoredStory/types'
import type { ReaderPreferences } from './types/qissa'

type SevenRoadsView = 'shell' | 'season' | 'story' | 'settings'

interface QissaNavigationSnapshot {
  view: SevenRoadsView
  tab: PublishedStoriesTab
  selectedSeasonNumber: number
  selectedStoryNumber: number
  requestedEpisodeNumber: number | null
}

interface QissaHistoryState {
  snapshot: QissaNavigationSnapshot
  depth: number
}

const QISSA_HISTORY_SNAPSHOT_KEY = 'qissaNavigation'
const QISSA_HISTORY_DEPTH_KEY = 'qissaNavigationDepth'

const readQissaHistoryState = (state: unknown): QissaHistoryState | null => {
  if (!state || typeof state !== 'object') return null
  const record = state as Record<string, unknown>
  const snapshot = record[QISSA_HISTORY_SNAPSHOT_KEY]
  const depth = record[QISSA_HISTORY_DEPTH_KEY]
  if (!snapshot || typeof snapshot !== 'object' || typeof depth !== 'number') return null

  const candidate = snapshot as Partial<QissaNavigationSnapshot>
  if (
    (candidate.view !== 'shell' &&
      candidate.view !== 'season' &&
      candidate.view !== 'story' &&
      candidate.view !== 'settings') ||
    (candidate.tab !== 'home' && candidate.tab !== 'library') ||
    typeof candidate.selectedSeasonNumber !== 'number' ||
    typeof candidate.selectedStoryNumber !== 'number' ||
    (candidate.requestedEpisodeNumber !== null &&
      typeof candidate.requestedEpisodeNumber !== 'number')
  ) {
    return null
  }

  return {
    snapshot: candidate as QissaNavigationSnapshot,
    depth: Math.max(0, Math.floor(depth)),
  }
}

function App() {
  const [language, setLanguage] = useState(() => sevenRoadsLanguagePreference.load())
  const seasons = useMemo(() => getSevenRoadsSeasons(language), [language])
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1)
  const season =
    seasons.find(
      (candidate) =>
        candidate.number === selectedSeasonNumber && candidate.status === 'published',
    ) ?? getSevenRoadsSeason1(language)
  const primarySeasonStory = getPrimaryPublishedSeasonStory(season)
  const [selectedStoryNumber, setSelectedStoryNumber] = useState(
    () => primarySeasonStory?.number ?? 1,
  )
  const seasonStory =
    getSeasonStoryByNumber(season, selectedStoryNumber) ?? primarySeasonStory
  const story = seasonStory?.authoredStory
  if (!seasonStory || !story) {
    throw new Error('Published Seven Roads Season 1 must have a published story package.')
  }

  const copy = getSevenRoadsCopy(language)
  const nextSeasonPublished = seasons.some(
    (candidate) =>
      candidate.number === season.number + 1 && candidate.status === 'published',
  )

  const [consentAccepted, setConsentAccepted] = useState(
    () => Boolean(publishedStoriesConsent.load()),
  )
  const [tab, setTab] = useState<PublishedStoriesTab>('home')
  const [view, setView] = useState<SevenRoadsView>('shell')
  const [requestedEpisodeNumber, setRequestedEpisodeNumber] = useState<number | null>(null)
  const [readerPreferences, setReaderPreferences] = useState<ReaderPreferences>(
    () => sevenRoadsReaderPreferences.load(),
  )

  const authoredPreviewKey =
    import.meta.env.VITE_QISSA_AUTHORED_V3_PREVIEW === 'true'
      ? new URLSearchParams(window.location.search).get('authoredStory')
      : null
  const authoredPreviewRequested = authoredPreviewKey === 'prazdnik-muzhestva'
  const story2PreviewRequested =
    import.meta.env.VITE_QISSA_STORY2_PREVIEW === 'true' &&
    authoredPreviewKey === 'tayna-vostochnogo-karavana'
  const [story2PreviewStory, setStory2PreviewStory] = useState<AuthoredStoryPackage | null>(null)
  const [story2PreviewError, setStory2PreviewError] = useState<string | null>(null)

  const currentNavigationSnapshot = (): QissaNavigationSnapshot => ({
    view,
    tab,
    selectedSeasonNumber,
    selectedStoryNumber,
    requestedEpisodeNumber,
  })

  const applyNavigationSnapshot = (snapshot: QissaNavigationSnapshot) => {
    setView(snapshot.view)
    setTab(snapshot.tab)
    setSelectedSeasonNumber(snapshot.selectedSeasonNumber)
    setSelectedStoryNumber(snapshot.selectedStoryNumber)
    setRequestedEpisodeNumber(snapshot.requestedEpisodeNumber)
  }

  const writeHistoryState = (
    snapshot: QissaNavigationSnapshot,
    depth: number,
    mode: 'push' | 'replace',
  ) => {
    const currentState =
      window.history.state && typeof window.history.state === 'object'
        ? window.history.state
        : {}
    const nextState = {
      ...currentState,
      [QISSA_HISTORY_SNAPSHOT_KEY]: snapshot,
      [QISSA_HISTORY_DEPTH_KEY]: depth,
    }
    if (mode === 'push') {
      window.history.pushState(nextState, '')
    } else {
      window.history.replaceState(nextState, '')
    }
  }

  const navigateTo = (patch: Partial<QissaNavigationSnapshot>) => {
    const snapshot = { ...currentNavigationSnapshot(), ...patch }
    const currentHistory = readQissaHistoryState(window.history.state)
    applyNavigationSnapshot(snapshot)
    writeHistoryState(snapshot, (currentHistory?.depth ?? 0) + 1, 'push')
  }

  const replaceNavigation = (patch: Partial<QissaNavigationSnapshot>) => {
    const snapshot = { ...currentNavigationSnapshot(), ...patch }
    applyNavigationSnapshot(snapshot)
    writeHistoryState(snapshot, 0, 'replace')
  }

  const navigateBack = (fallback: Partial<QissaNavigationSnapshot>) => {
    const currentHistory = readQissaHistoryState(window.history.state)
    if (currentHistory && currentHistory.depth > 0) {
      window.history.back()
      return
    }

    replaceNavigation(fallback)
  }

  useEffect(() => {
    if (!consentAccepted || authoredPreviewRequested || story2PreviewRequested) return

    const baseline = currentNavigationSnapshot()
    writeHistoryState(baseline, 0, 'replace')

    const onPopState = (event: PopStateEvent) => {
      const historyState = readQissaHistoryState(event.state)
      if (historyState) applyNavigationSnapshot(historyState.snapshot)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [consentAccepted, authoredPreviewRequested, story2PreviewRequested])

  useEffect(() => {
    if (!story2PreviewRequested) return

    let active = true
    setStory2PreviewError(null)

    setStory2PreviewStory(null)

    import('./data/story2Preview')
      .then(({ taynaVostochnogoKaravanaV4ByLanguage }) => {
        if (active) setStory2PreviewStory(taynaVostochnogoKaravanaV4ByLanguage[language])
      })
      .catch((error: unknown) => {
        if (!active) return
        setStory2PreviewError(
          error instanceof Error ? error.message : 'Story 2 preview failed to load.',
        )
      })

    return () => {
      active = false
    }
  }, [story2PreviewRequested, language])

  const episodeTitles = seasonStory.episodes.map((episode) => episode.title)

  const inheritedSelectedChoices = useMemo<Record<string, string>>(() => {
    if (season.number !== 2 || seasonStory.number !== 3) return {}

    const sourceStory = getSeasonStoryByNumber(season, 2)?.authoredStory
    if (!sourceStory) return {}

    const sourceProgress = authoredStoryPersistence.load(sourceStory)
    const inheritedChoice =
      sourceProgress?.selected_choices.story2_choice_3_sarvan_check
    if (!inheritedChoice) return {}

    return {
      story2_choice_3_sarvan_check: inheritedChoice,
    }
  }, [season, seasonStory.number])

  const changeLanguage = (nextLanguage: typeof language) => {
    setLanguage(nextLanguage)
    sevenRoadsLanguagePreference.save(nextLanguage)
  }


  if (story2PreviewRequested) {
    if (story2PreviewError) {
      return (
        <div className="mx-auto max-w-[430px] px-4 py-8 text-sm text-[#6b2d2d]">
          Story 2 preview error: {story2PreviewError}
        </div>
      )
    }

    if (!story2PreviewStory) {
      return (
        <div className="mx-auto max-w-[430px] px-4 py-8 text-sm text-[#665d49]">
          Loading Story 2 preview…
        </div>
      )
    }

    return (
      <div className="relative min-h-screen text-[#1f241d]">
        <div className="mx-auto max-w-[430px] px-4 py-5 sm:px-6">
          <AuthoredStoryPlayer
            story={story2PreviewStory}
            seasonNumber={2}
            storyNumber={2}
            completionScope="story"
            readerUnit="part"
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={(patch) => {
              const next = { ...readerPreferences, ...patch }
              setReaderPreferences(next)
              sevenRoadsReaderPreferences.save(next)
            }}
            showMissingAssetPlaceholders
            showCover
            onBack={() => {
              const url = new URL(window.location.href)
              url.searchParams.delete('authoredStory')
              window.location.assign(url.toString())
            }}
          />
        </div>
      </div>
    )
  }

  if (authoredPreviewRequested) {
    return (
      <div className="relative min-h-screen text-[#1f241d]">
        <div className="mx-auto max-w-[430px] px-4 py-5 sm:px-6">
          <AuthoredStoryPlayer
            story={story}
            seasonNumber={season.number}
            storyNumber={seasonStory.number}
            completionScope={seasonStory.completionScope}
            readerUnit={seasonStory.readerUnit}
            episodeTitles={episodeTitles}
            showCover={season.presentation !== 'single-cover-episode-list'}
            completionSummary={
              seasonStory.completionScope === 'season'
                ? copy.completionSummary
                : undefined
            }
            nextSeasonPublished={nextSeasonPublished}
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={(patch) => {
              const next = { ...readerPreferences, ...patch }
              setReaderPreferences(next)
              sevenRoadsReaderPreferences.save(next)
            }}
            showMissingAssetPlaceholders
            onBack={() => {
              const url = new URL(window.location.href)
              url.searchParams.delete('authoredStory')
              window.location.assign(url.toString())
            }}
          />
        </div>
      </div>
    )
  }

  if (!consentAccepted) {
    return (
      <PublishedStoriesWelcome
        language={language}
        onLanguageChange={changeLanguage}
        onComplete={() => {
          publishedStoriesConsent.accept()
          setConsentAccepted(true)
        }}
      />
    )
  }

  if (view === 'story') {
    return (
      <div className="relative min-h-screen text-[#1f241d]">
        <div className="mx-auto max-w-[430px] px-4 py-5 sm:px-6">
          <AuthoredStoryPlayer
            story={story}
            seasonNumber={season.number}
            storyNumber={seasonStory.number}
            completionScope={seasonStory.completionScope}
            readerUnit={seasonStory.readerUnit}
            episodeTitles={episodeTitles}
            showCover={season.presentation !== 'single-cover-episode-list'}
            completionSummary={
              seasonStory.completionScope === 'season'
                ? copy.completionSummary
                : undefined
            }
            nextSeasonPublished={nextSeasonPublished}
            initialEpisodeNumber={requestedEpisodeNumber ?? undefined}
            inheritedSelectedChoices={inheritedSelectedChoices}
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={(patch) => {
              const next = { ...readerPreferences, ...patch }
              setReaderPreferences(next)
              sevenRoadsReaderPreferences.save(next)
            }}
            onBack={() => {
              const returnToSeason =
                requestedEpisodeNumber != null ||
                season.presentation === 'single-cover-episode-list'
              navigateBack(
                returnToSeason
                  ? { view: 'season', requestedEpisodeNumber: null }
                  : { view: 'shell', tab: 'home', requestedEpisodeNumber: null },
              )
            }}
            onFinishForToday={() => {
              replaceNavigation({
                view: 'shell',
                tab: 'home',
                requestedEpisodeNumber: null,
              })
            }}
          />
        </div>
      </div>
    )
  }

  if (view === 'settings') {
    return (
      <SevenRoadsSettingsScreen
        language={language}
        onLanguageChange={changeLanguage}
        preferences={readerPreferences}
        onPreferencesChange={(patch) => {
          const next = { ...readerPreferences, ...patch }
          setReaderPreferences(next)
          sevenRoadsReaderPreferences.save(next)
        }}
        onBack={() => navigateBack({ view: 'shell' })}
        onResetSeason={() => {
          authoredStoryPersistence.clearAll()
          authoredReadingPosition.clearAll()
          authoredIllustrationDiscovery.clearAll()
          replaceNavigation({
            view: 'shell',
            tab: 'home',
            selectedSeasonNumber: 1,
            selectedStoryNumber: 1,
            requestedEpisodeNumber: null,
          })
        }}
      />
    )
  }

  if (view === 'season') {
    return (
      <SeasonOverview
        language={language}
        season={season}
        onBack={() =>
          navigateBack({
            view: 'shell',
            requestedEpisodeNumber: null,
          })
        }
        onRead={(storyNumber, episodeNumber) => {
          navigateTo({
            view: 'story',
            selectedStoryNumber: storyNumber,
            requestedEpisodeNumber: episodeNumber ?? null,
          })
        }}
      />
    )
  }

  return (
    <PublishedStoriesShell
      language={language}
      tab={tab}
      onTab={(nextTab) => {
        if (nextTab === tab) return
        navigateTo({ view: 'shell', tab: nextTab })
      }}
      onBack={() => navigateBack({ view: 'shell', tab: 'home' })}
      onOpenSeason={(seasonNumber) => {
        const nextSeason =
          seasons.find(
            (candidate) =>
              candidate.number === seasonNumber && candidate.status === 'published',
          ) ?? season
        const nextStory = getPrimaryPublishedSeasonStory(nextSeason)

        if (nextSeason.number === 2) {
          const firstSeason = getSevenRoadsSeason1(language)
          const firstStory = getPrimaryPublishedSeasonStory(firstSeason)
          const firstStoryProgress = firstStory?.authoredStory
            ? authoredStoryPersistence.load(firstStory.authoredStory)
            : null
          if (!firstStoryProgress?.completed) return
        }

        navigateTo({
          view: nextStory?.completionScope === 'story' ? 'story' : 'season',
          selectedSeasonNumber: nextSeason.number,
          selectedStoryNumber: nextStory?.number ?? 1,
          requestedEpisodeNumber: null,
        })
      }}
      onContinueStory={() => {
        const homeSeason = getSevenRoadsSeason1(language)
        const homeStory = getPrimaryPublishedSeasonStory(homeSeason)
        navigateTo({
          view: 'story',
          selectedSeasonNumber: homeSeason.number,
          selectedStoryNumber: homeStory?.number ?? 1,
          requestedEpisodeNumber: null,
        })
      }}
      onOpenSettings={() => navigateTo({ view: 'settings' })}
    />
  )
}

export default App
