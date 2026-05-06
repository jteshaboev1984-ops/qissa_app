import { useState } from 'react'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { createInitialSeriesState, applyChoiceToSeriesState } from './lib/memoryAgent'
import { t } from './lib/i18n'
import { createStoryEpisode } from './lib/storyAgent'
import { HomeScreen } from './screens/HomeScreen'
import { StoryScreen } from './screens/StoryScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import type { Episode, EpisodeChoice, Language, OnboardingSelections, SeriesState } from './types/qissa'

type Screen = 'welcome' | 'onboarding' | 'home' | 'story'

function App() {
  const [language, setLanguage] = useState<Language>('ru')
  const [screen, setScreen] = useState<Screen>('welcome')
  const [selections, setSelections] = useState<OnboardingSelections | null>(null)
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [seriesState, setSeriesState] = useState<SeriesState | null>(null)

  const handleCreateFirstSeries = () => {
    if (!selections) return
    const initialSeries = createInitialSeriesState(selections)
    const firstEpisode = createStoryEpisode(selections, initialSeries)
    setSeriesState({ ...initialSeries, episodeCount: 1 })
    setEpisode(firstEpisode)
    setScreen('story')
  }

  const handleChoiceSelected = (choice: EpisodeChoice) => {
    if (!seriesState || !episode || seriesState.choiceHistory.some((entry) => entry.episode_id === episode.episode_id)) {
      return
    }

    setSeriesState(applyChoiceToSeriesState(seriesState, episode, choice))
  }

  const isChoiceSavedForCurrentEpisode = Boolean(
    seriesState && episode && seriesState.choiceHistory.some((entry) => entry.episode_id === episode.episode_id),
  )

  const handleContinueNextEpisode = () => {
    if (!selections || !seriesState || seriesState.choiceHistory.length === 0) return
    const secondEpisode = createStoryEpisode(selections, seriesState)
    setEpisode(secondEpisode)
    setSeriesState({ ...seriesState, episodeCount: Math.max(seriesState.episodeCount, 2) })
  }

  return (
    <div className="min-h-screen bg-[#f6f1e7] text-slate-900">
      <div className="mx-auto max-w-xl p-4 sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t(language, 'app.title')}</h1>
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="rounded-lg border bg-white px-3 py-2 text-sm">
            <option value="ru">RU</option><option value="uz">UZ</option><option value="kz">KZ</option>
          </select>
        </header>

        {screen === 'welcome' && <WelcomeScreen language={language} onStart={() => setScreen('onboarding')} />}
        {screen === 'onboarding' && <OnboardingFlow language={language} onLanguageChange={setLanguage} onComplete={(value) => { setSelections(value); setSeriesState(createInitialSeriesState(value)); setScreen('home') }} />}
        {screen === 'home' && selections && <HomeScreen language={language} selections={selections} seriesState={seriesState} episode={episode} onCreateFirstSeries={handleCreateFirstSeries} onContinueStory={() => setScreen('story')} />}
        {screen === 'story' && episode && <StoryScreen
            language={language}
            episode={episode}
            onChoiceSelected={handleChoiceSelected}
            onContinueNextEpisode={episode.episode_id.startsWith('ep-1') ? handleContinueNextEpisode : undefined}
            isChoiceSavedForCurrentEpisode={isChoiceSavedForCurrentEpisode}
          />}
      </div>
    </div>
  )
}

export default App
