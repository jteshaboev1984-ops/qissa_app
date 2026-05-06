import { useMemo, useState } from 'react'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { createInitialSeriesState, applyChoiceToSeriesState } from './lib/memoryAgent'
import { t } from './lib/i18n'
import { localPersistence, type AppScreen } from './lib/localPersistence'
import { createStoryEpisode } from './lib/storyAgent'
import { HomeScreen } from './screens/HomeScreen'
import { StoryScreen } from './screens/StoryScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import type { Episode, EpisodeChoice, Language, OnboardingSelections, ReaderPreferences, SeriesState } from './types/qissa'

function resolveHydratedState() {
  const language = localPersistence.loadLanguage() ?? 'ru'
  const selections = localPersistence.loadOnboardingSelections()
  const seriesState = localPersistence.loadSeriesState()
  const episode = localPersistence.loadCurrentEpisode()
  const savedScreen = localPersistence.loadScreen()
  const readerPreferences = localPersistence.loadReaderPreferences()

  if (!selections) {
    return { language, selections: null, seriesState: null, episode: null, screen: 'welcome' as AppScreen, readerPreferences }
  }

  if (!seriesState) {
    if (episode || savedScreen === 'story') {
      localPersistence.clearEpisodeAndScreen()
    }
    return { language, selections, seriesState: null, episode: null, screen: 'home' as AppScreen, readerPreferences }
  }

  if (!episode) {
    return { language, selections, seriesState, episode: null, screen: 'home' as AppScreen, readerPreferences }
  }

  const screen: AppScreen = savedScreen === 'story' || savedScreen === 'home' ? savedScreen : 'home'
  return { language, selections, seriesState, episode, screen, readerPreferences }
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

  const handleOnboardingComplete = (value: OnboardingSelections) => {
    const initialSeries = createInitialSeriesState(value)
    setSelections(value)
    setSeriesState(initialSeries)
    setEpisode(null)
    localPersistence.saveOnboardingSelections(value)
    localPersistence.saveSeriesState(initialSeries)
    updateScreen('home')
  }

  const handleCreateFirstSeries = () => {
    if (!selections) return
    const initialSeries = createInitialSeriesState(selections)
    const firstEpisode = createStoryEpisode(selections, initialSeries)
    const nextSeriesState = { ...initialSeries, episodeCount: 1 }
    setSeriesState(nextSeriesState)
    setEpisode(firstEpisode)
    localPersistence.saveSeriesState(nextSeriesState)
    localPersistence.saveCurrentEpisode(firstEpisode)
    updateScreen('story')
  }

  const handleChoiceSelected = (choice: EpisodeChoice) => {
    if (!seriesState || !episode || seriesState.choiceHistory.some((entry) => entry.episode_id === episode.episode_id)) {
      return
    }

    const nextSeriesState = applyChoiceToSeriesState(seriesState, episode, choice)
    setSeriesState(nextSeriesState)
    localPersistence.saveSeriesState(nextSeriesState)
  }

  const isChoiceSavedForCurrentEpisode = Boolean(
    seriesState && episode && seriesState.choiceHistory.some((entry) => entry.episode_id === episode.episode_id),
  )

  const handleContinueNextEpisode = () => {
    if (!selections || !seriesState || seriesState.choiceHistory.length === 0) return
    const secondEpisode = createStoryEpisode(selections, seriesState)
    const nextSeriesState = { ...seriesState, episodeCount: Math.max(seriesState.episodeCount, 2) }
    setEpisode(secondEpisode)
    setSeriesState(nextSeriesState)
    localPersistence.saveCurrentEpisode(secondEpisode)
    localPersistence.saveSeriesState(nextSeriesState)
  }

  const handleResetStory = () => {
    localPersistence.clearQissaStorage()
    setLanguage('ru')
    setSelections(null)
    setSeriesState(null)
    setEpisode(null)
    setScreen('welcome')
    setReaderPreferences(defaultReaderPreferences)
  }

  return (
    <div className="min-h-screen bg-[#f6f1e7] text-slate-900">
      <div className="mx-auto max-w-md p-4 sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t(language, 'app.title')}</h1>
          <select value={language} onChange={(e) => updateLanguage(e.target.value as Language)} className="rounded-lg border bg-white px-3 py-2 text-sm">
            <option value="ru">RU</option><option value="uz">UZ</option><option value="kz">KZ</option>
          </select>
        </header>

        {screen === 'welcome' && <WelcomeScreen language={language} onStart={() => updateScreen('onboarding')} />}
        {screen === 'onboarding' && <OnboardingFlow language={language} onLanguageChange={updateLanguage} onComplete={handleOnboardingComplete} />}
        {screen === 'home' && selections && <HomeScreen language={language} selections={selections} seriesState={seriesState} episode={episode} onCreateFirstSeries={handleCreateFirstSeries} onContinueStory={() => updateScreen('story')} onResetStory={handleResetStory} />}
        {screen === 'story' && episode && <StoryScreen
            language={language}
            episode={episode}
            onChoiceSelected={handleChoiceSelected}
            onContinueNextEpisode={episode.episode_id.startsWith('ep-1') ? handleContinueNextEpisode : undefined}
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={updateReaderPreferences}
            isChoiceSavedForCurrentEpisode={isChoiceSavedForCurrentEpisode}
          />}
      </div>
    </div>
  )
}

export default App
