import { useEffect, useMemo, useState } from 'react'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { createInitialSeriesState, applyChoiceToSeriesState } from './lib/memoryAgent'
import { t } from './lib/i18n'
import { localPersistence, type AppScreen } from './lib/localPersistence'
import { createStoryEpisode } from './lib/storyAgent'
import { HomeScreen } from './screens/HomeScreen'
import { LibraryScreen } from './screens/LibraryScreen'
import { ParentScreen } from './screens/ParentScreen'
import { AppBottomNav, type AppTab } from './components/AppBottomNav'
import { StoryScreen } from './screens/StoryScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import type {
  Episode,
  EpisodeChoice,
  Language,
  OnboardingSelections,
  ReaderPreferences,
  SeriesState,
} from './types/qissa'

type OnboardingMode = 'first_launch' | 'edit_setup'

function resolveHydratedState() {
  const language = localPersistence.loadLanguage() ?? 'ru'
  const selections = localPersistence.loadOnboardingSelections()
  const storedSeriesState = localPersistence.loadSeriesStateOrRepair(selections)
  const episode = localPersistence.loadCurrentEpisode()
  const savedScreen = localPersistence.loadScreen()
  const readerPreferences = localPersistence.loadReaderPreferences()

  if (!selections) {
    return { language, selections: null, seriesState: null, episode: null, screen: 'welcome' as AppScreen, readerPreferences }
  }

  const seriesState = storedSeriesState ?? createInitialSeriesState(selections)

  if (!episode) {
    return { language, selections, seriesState, episode: null, screen: 'home' as AppScreen, readerPreferences }
  }

  if (savedScreen === 'story') {
    return { language, selections, seriesState, episode, screen: 'story' as AppScreen, readerPreferences }
  }

  return { language, selections, seriesState, episode, screen: 'home' as AppScreen, readerPreferences }
}

const defaultReaderPreferences: ReaderPreferences = {
  textSize: 'medium',
  fontMode: 'standard',
  lineSpacing: 'relaxed',
  theme: 'warm',
  showTextWithAudio: true,
  audioOnlyNightMode: true,
  voicePresetId: 'neutral_storyteller',
  defaultPlaybackMode: 'read',
}

function App() {
  const hydrated = useMemo(resolveHydratedState, [])
  const [language, setLanguage] = useState<Language>(hydrated.language)
  const [screen, setScreen] = useState<AppScreen>(hydrated.screen)
  const [selections, setSelections] = useState<OnboardingSelections | null>(hydrated.selections)
  const [episode, setEpisode] = useState<Episode | null>(hydrated.episode)
  const [seriesState, setSeriesState] = useState<SeriesState | null>(hydrated.seriesState)
  const [readerPreferences, setReaderPreferences] = useState<ReaderPreferences>(hydrated.readerPreferences ?? defaultReaderPreferences)
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>('first_launch')
  const [appTab, setAppTab] = useState<AppTab>('home')

  useEffect(() => {
    localPersistence.clearDeprecatedKeys()
  }, [])

  const updateLanguage = (value: Language) => {
    setLanguage(value)
    localPersistence.saveLanguage(value)
  }

  const updateScreen = (value: AppScreen) => {
    setScreen(value)
    localPersistence.saveScreen(value)
  }

  const updateReaderPreferences = (patch: Partial<ReaderPreferences>) => {
    setReaderPreferences((prev) => {
      const next = { ...prev, ...patch }
      localPersistence.saveReaderPreferences(next)
      return next
    })
  }

  const setupChanged = (a: OnboardingSelections, b: OnboardingSelections) => JSON.stringify(a) !== JSON.stringify(b)

  const handleOnboardingComplete = (value: OnboardingSelections) => {
    const isEditing = onboardingMode === 'edit_setup'
    const hasChanged = selections ? setupChanged(selections, value) : true

    setSelections(value)
    localPersistence.saveOnboardingSelections(value)
    updateLanguage(value.language)

    if (isEditing && !hasChanged) {
      updateScreen('home')
      return
    }

    const nextSeries = createInitialSeriesState(value)
    setSeriesState(nextSeries)
    setEpisode(null)
    localPersistence.saveSeriesState(nextSeries)
    localPersistence.clearEpisodeAndScreen()
    updateScreen('home')
  }

  const handleStartStory = () => {
    setAppTab('home')
    if (!selections || !seriesState) return
    const firstEpisode = createStoryEpisode({ selections, seriesState })
    const nextSeries = { ...seriesState, episodeCount: 1 }
    setEpisode(firstEpisode)
    setSeriesState(nextSeries)
    localPersistence.saveCurrentEpisode(firstEpisode)
    localPersistence.saveSeriesState(nextSeries)
    updateScreen('story')
  }

  const handleChoiceSelected = (choice: EpisodeChoice) => {
    if (!seriesState || !episode || seriesState.choiceHistory.some((entry) => entry.episode_id === episode.episode_id)) return
    const nextSeriesState = applyChoiceToSeriesState(seriesState, episode, choice)
    setSeriesState(nextSeriesState)
    localPersistence.saveSeriesState(nextSeriesState)
  }

  const handleContinueNextEpisode = () => {
    if (!selections || !seriesState || selections.storyMode !== 'series' || seriesState.choiceHistory.length === 0) return
    const secondEpisode = createStoryEpisode({ selections, seriesState })
    const nextSeriesState = { ...seriesState, episodeCount: 2 }
    setEpisode(secondEpisode)
    setSeriesState(nextSeriesState)
    localPersistence.saveCurrentEpisode(secondEpisode)
    localPersistence.saveSeriesState(nextSeriesState)
    updateScreen('story')
  }



  const handleOpenStory = () => {
    if (
      selections?.storyMode === 'series' &&
      episode?.episode_id.startsWith('ep-1') &&
      seriesState?.choiceHistory.some((entry) => entry.episode_id === episode.episode_id)
    ) {
      handleContinueNextEpisode()
      return
    }

    updateScreen('story')
  }

  const handleResetStory = () => {
    if (!selections) return
    const nextSeries = createInitialSeriesState(selections)
    setSeriesState(nextSeries)
    setEpisode(null)
    localPersistence.saveSeriesState(nextSeries)
    localPersistence.clearEpisodeAndScreen()
    updateScreen('home')
  }

  const handleOpenOnboarding = (mode: OnboardingMode) => {
    setOnboardingMode(mode)
    updateScreen('onboarding')
  }

  const handleExitOnboarding = () => {
    if (onboardingMode === 'edit_setup' && selections) {
      updateScreen('home')
      return
    }
    updateScreen('welcome')
  }

  const savedChoiceEntryForCurrentEpisode =
    seriesState && episode
      ? seriesState.choiceHistory.find((entry) => entry.episode_id === episode.episode_id) ?? null
      : null

  useEffect(() => {
    if (screen === 'story' && !episode) updateScreen('home')
  }, [screen, episode])

  return (
    <div className="relative min-h-screen text-[#1f241d]">
      <div className={`mx-auto max-w-[430px] px-4 py-5 sm:px-6 ${screen === 'home' && selections ? 'pb-32' : ''}`}>
        <header className="mb-5 flex items-center justify-between">
          <h1 className="q-heading text-xl font-bold tracking-tight">{t(language, 'app.title')}</h1>
          <select value={language} onChange={(e) => updateLanguage(e.target.value as Language)} className="rounded-full border border-[#dfd3bc] bg-[#fffdf7]/90 px-3 py-2 text-sm font-semibold text-[#3d382c] shadow-sm">
            <option value="ru">RU</option>
            <option value="uz">UZ</option>
            <option value="kz">KZ</option>
          </select>
        </header>

        {screen === 'welcome' && <WelcomeScreen language={language} onStart={() => handleOpenOnboarding('first_launch')} />}

        {screen === 'onboarding' && (
          <OnboardingFlow
            language={language}
            onLanguageChange={updateLanguage}
            onComplete={handleOnboardingComplete}
            onExit={handleExitOnboarding}
            mode={onboardingMode}
            initialSelections={onboardingMode === 'edit_setup' ? selections ?? undefined : undefined}
          />
        )}

        {screen === 'home' && selections && appTab === 'home' && (
          <HomeScreen
            language={language}
            selections={selections}
            seriesState={seriesState}
            episode={episode}
            onCreateFirstSeries={handleStartStory}
            onContinueStory={handleOpenStory}
            onResetStory={handleResetStory}
            onEditSetup={() => handleOpenOnboarding('edit_setup')}
          />
        )}


        {screen === 'home' && selections && appTab === 'library' && (
          <LibraryScreen
            language={language}
            selections={selections}
            seriesState={seriesState}
            episode={episode}
            onOpenStory={handleOpenStory}
            onCreateStory={handleStartStory}
          />
        )}

        {screen === 'home' && selections && appTab === 'parent' && (
          <ParentScreen
            language={language}
            selections={selections}
            episode={episode}
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={updateReaderPreferences}
            onEditSetup={() => handleOpenOnboarding('edit_setup')}
            onResetStory={handleResetStory}
          />
        )}

        {screen === 'story' && episode && (
          <StoryScreen
            language={language}
            episode={episode}
            storyMode={selections?.storyMode ?? 'series'}
            onChoiceSelected={handleChoiceSelected}
            onContinueNextEpisode={handleContinueNextEpisode}
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={updateReaderPreferences}
            isChoiceSavedForCurrentEpisode={Boolean(savedChoiceEntryForCurrentEpisode)}
            savedChoiceIdForCurrentEpisode={savedChoiceEntryForCurrentEpisode?.choice_id ?? null}
            onBackHome={() => { setAppTab('home'); updateScreen('home') }}
            onStartNewStory={handleResetStory}
          />
        )}
        {screen === 'home' && selections ? <AppBottomNav language={language} tab={appTab} onTab={setAppTab} /> : null}
      </div>
    </div>
  )
}

export default App
