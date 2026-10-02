import { useEffect, useMemo, useState } from 'react'
import { PublishedStoriesShell, type PublishedStoriesTab } from './components/PublishedStoriesShell'
import { PublishedStoriesWelcome } from './components/PublishedStoriesWelcome'
import { SeasonOverview } from './components/SeasonOverview'
import { SevenRoadsSettingsScreen } from './components/SevenRoadsSettingsScreen'
import {
  getPrimaryPublishedSeasonStory,
  getSevenRoadsSeason1,
} from './data/sevenRoadsSeasons'
import { AuthoredStoryPlayer } from './features/authoredStory/AuthoredStoryPlayer'
import { getSevenRoadsCopy } from './features/publishedStories/sevenRoadsCopy'
import { publishedStoriesConsent } from './lib/publishedStoriesConsent'
import { authoredStoryPersistence } from './lib/authoredStoryPersistence'
import { authoredReadingPosition } from './lib/authoredReadingPosition'
import { sevenRoadsLanguagePreference } from './lib/sevenRoadsLanguagePreference'
import { sevenRoadsReaderPreferences } from './lib/sevenRoadsReaderPreferences'
import type { AuthoredStoryPackage } from './features/authoredStory/types'
import type { ReaderPreferences } from './types/qissa'

type SevenRoadsView = 'shell' | 'season' | 'story' | 'settings'

function App() {
  const [language, setLanguage] = useState(() => sevenRoadsLanguagePreference.load())
  const season = useMemo(() => getSevenRoadsSeason1(language), [language])
  const seasonStory = getPrimaryPublishedSeasonStory(season)
  const story = seasonStory?.authoredStory
  if (!seasonStory || !story) {
    throw new Error('Published Seven Roads Season 1 must have a published story package.')
  }

  const copy = getSevenRoadsCopy(language)

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

  useEffect(() => {
    if (!story2PreviewRequested) return

    let active = true
    setStory2PreviewError(null)

    import('./data/story2Preview')
      .then(({ taynaVostochnogoKaravanaV4Ru }) => {
        if (active) setStory2PreviewStory(taynaVostochnogoKaravanaV4Ru)
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
  }, [story2PreviewRequested])

  const episodeTitles = seasonStory.episodes.map((episode) => episode.title)

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
            showCover={false}
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
            completionSummary={copy.completionSummary}
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
            completionSummary={copy.completionSummary}
            initialEpisodeNumber={requestedEpisodeNumber ?? undefined}
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={(patch) => {
              const next = { ...readerPreferences, ...patch }
              setReaderPreferences(next)
              sevenRoadsReaderPreferences.save(next)
            }}
            onBack={() => {
              const returnToSeason = requestedEpisodeNumber != null
              setRequestedEpisodeNumber(null)
              if (returnToSeason) {
                setView('season')
                return
              }
              setTab('home')
              setView('shell')
            }}
            onFinishForToday={() => {
              setRequestedEpisodeNumber(null)
              setTab('home')
              setView('shell')
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
        onBack={() => setView('shell')}
        onResetSeason={() => {
          authoredStoryPersistence.clear(story)
          authoredReadingPosition.clear(story)
          setTab('home')
          setView('shell')
        }}
      />
    )
  }

  if (view === 'season') {
    return (
      <SeasonOverview
        language={language}
        season={season}
        onBack={() => {
          setRequestedEpisodeNumber(null)
          setView('shell')
        }}
        onRead={(episodeNumber) => {
          setRequestedEpisodeNumber(episodeNumber ?? null)
          setView('story')
        }}
      />
    )
  }

  return (
    <PublishedStoriesShell
      language={language}
      tab={tab}
      onTab={setTab}
      onOpenSeason={() => {
        setRequestedEpisodeNumber(null)
        setView('season')
      }}
      onContinueStory={() => {
        setRequestedEpisodeNumber(null)
        setView('story')
      }}
      onOpenSettings={() => setView('settings')}
    />
  )
}

export default App
