import { useMemo, useState } from 'react'
import { PublishedStoriesShell, type PublishedStoriesTab } from './components/PublishedStoriesShell'
import { PublishedStoriesWelcome } from './components/PublishedStoriesWelcome'
import { SeasonOverview } from './components/SeasonOverview'
import { SevenRoadsSettingsScreen } from './components/SevenRoadsSettingsScreen'
import { getSevenRoadsSeason1 } from './data/sevenRoadsSeasons'
import { AuthoredStoryPlayer } from './features/authoredStory/AuthoredStoryPlayer'
import { getSevenRoadsCopy } from './features/publishedStories/sevenRoadsCopy'
import { publishedStoriesConsent } from './lib/publishedStoriesConsent'
import { authoredStoryPersistence } from './lib/authoredStoryPersistence'
import { authoredReadingPosition } from './lib/authoredReadingPosition'
import { sevenRoadsLanguagePreference } from './lib/sevenRoadsLanguagePreference'
import { sevenRoadsReaderPreferences } from './lib/sevenRoadsReaderPreferences'
import type { ReaderPreferences } from './types/qissa'

type SevenRoadsView = 'shell' | 'season' | 'story' | 'settings'

function App() {
  const [language, setLanguage] = useState(() => sevenRoadsLanguagePreference.load())
  const season = useMemo(() => getSevenRoadsSeason1(language), [language])
  const story = season.story
  if (!story) throw new Error('Published Seven Roads Season 1 must have a story package.')

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

  const authoredPreviewRequested =
    import.meta.env.VITE_QISSA_AUTHORED_V3_PREVIEW === 'true' &&
    new URLSearchParams(window.location.search).get('authoredStory') === 'prazdnik-muzhestva'

  const episodeTitles = season.episodes.map((episode) => episode.title)

  const changeLanguage = (nextLanguage: typeof language) => {
    setLanguage(nextLanguage)
    sevenRoadsLanguagePreference.save(nextLanguage)
  }

  if (authoredPreviewRequested) {
    return (
      <div className="relative min-h-screen text-[#1f241d]">
        <div className="mx-auto max-w-[430px] px-4 py-5 sm:px-6">
          <AuthoredStoryPlayer
            story={story}
            seasonNumber={season.number}
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
