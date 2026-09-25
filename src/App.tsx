import { useState } from 'react'
import { PublishedStoriesShell, type PublishedStoriesTab } from './components/PublishedStoriesShell'
import { PublishedStoriesWelcome } from './components/PublishedStoriesWelcome'
import { SeasonOverview } from './components/SeasonOverview'
import { SevenRoadsSettingsScreen } from './components/SevenRoadsSettingsScreen'
import { sevenRoadsSeason1 } from './data/sevenRoadsSeasons'
import { AuthoredStoryPlayer } from './features/authoredStory/AuthoredStoryPlayer'
import { publishedStoriesConsent } from './lib/publishedStoriesConsent'
import { authoredStoryPersistence } from './lib/authoredStoryPersistence'
import { authoredReadingPosition } from './lib/authoredReadingPosition'
import { sevenRoadsReaderPreferences } from './lib/sevenRoadsReaderPreferences'
import type { ReaderPreferences } from './types/qissa'

type SevenRoadsView = 'shell' | 'season' | 'story' | 'settings'

function App() {
  const story = sevenRoadsSeason1.story
  if (!story) throw new Error('Published Seven Roads Season 1 must have a story package.')

  const [consentAccepted, setConsentAccepted] = useState(
    () => Boolean(publishedStoriesConsent.load()),
  )
  const [tab, setTab] = useState<PublishedStoriesTab>('home')
  const [view, setView] = useState<SevenRoadsView>('shell')
  const [readerPreferences, setReaderPreferences] = useState<ReaderPreferences>(
    () => sevenRoadsReaderPreferences.load(),
  )

  const authoredPreviewRequested =
    import.meta.env.VITE_QISSA_AUTHORED_V3_PREVIEW === 'true' &&
    new URLSearchParams(window.location.search).get('authoredStory') === 'prazdnik-muzhestva'

  const episodeTitles = sevenRoadsSeason1.episodes.map((episode) => episode.title)

  if (authoredPreviewRequested) {
    return (
      <div className="relative min-h-screen text-[#1f241d]">
        <div className="mx-auto max-w-[430px] px-4 py-5 sm:px-6">
          <AuthoredStoryPlayer
            story={story}
            seasonNumber={sevenRoadsSeason1.number}
            episodeTitles={episodeTitles}
            completionSummary="Темур и Самира стали юными бахадурами царства."
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
            seasonNumber={sevenRoadsSeason1.number}
            episodeTitles={episodeTitles}
            completionSummary="Темур и Самира стали юными бахадурами царства."
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={(patch) => {
              const next = { ...readerPreferences, ...patch }
              setReaderPreferences(next)
              sevenRoadsReaderPreferences.save(next)
            }}
            onBack={() => {
              setTab('home')
              setView('shell')
            }}
            onFinishForToday={() => {
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
        season={sevenRoadsSeason1}
        onBack={() => setView('shell')}
        onRead={() => setView('story')}
      />
    )
  }

  return (
    <PublishedStoriesShell
      tab={tab}
      onTab={setTab}
      onOpenSeason={() => setView('season')}
      onContinueStory={() => setView('story')}
      onOpenSettings={() => setView('settings')}
    />
  )
}

export default App
