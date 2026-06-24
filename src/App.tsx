import { useEffect, useMemo, useRef, useState } from 'react'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { createInitialSeriesState, applyChoiceToSeriesState } from './lib/memoryAgent'
import { t } from './lib/i18n'
import { localPersistence, type AppScreen } from './lib/localPersistence'
import { storyService } from './lib/storyService'
import { storyArchive, type StoryArchiveItem } from './lib/storyArchive'
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

type OnboardingMode = 'first_launch' | 'edit_setup' | 'new_story'
type GenerationStatus = 'idle' | 'starting' | 'continuing'

const generationCopy: Record<
  Language,
  {
    starting: string
    continuing: string
    error: string
  }
> = {
  ru: {
    starting: 'Создаём историю…',
    continuing: 'Готовим продолжение…',
    error: 'Не удалось создать историю. Проверьте соединение и попробуйте ещё раз.',
  },
  uz: {
    starting: 'Hikoya yaratilmoqda…',
    continuing: 'Davomi tayyorlanmoqda…',
    error: 'Hikoyani yaratib bo‘lmadi. Internetni tekshirib, yana urinib ko‘ring.',
  },
  kz: {
    starting: 'Оқиға жасалып жатыр…',
    continuing: 'Жалғасы дайындалып жатыр…',
    error: 'Оқиғаны жасау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.',
  },
}

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
  const [archiveItems, setArchiveItems] = useState<StoryArchiveItem[]>(() => storyArchive.load())
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle')
  const [generationError, setGenerationError] = useState(false)
  const generationLockRef = useRef(false)

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

  const archiveCurrentStory = () => {
    const saved = storyArchive.saveSnapshot(selections, seriesState, episode)
    if (saved) setArchiveItems(storyArchive.load())
  }

  const setupChanged = (a: OnboardingSelections, b: OnboardingSelections) => JSON.stringify(a) !== JSON.stringify(b)

  const handleOnboardingComplete = (value: OnboardingSelections) => {
    const isEditing = onboardingMode === 'edit_setup'
    const hasChanged = selections ? setupChanged(selections, value) : true

    if ((isEditing && hasChanged) || onboardingMode === 'new_story') {
      archiveCurrentStory()
    }

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

  const handleStartStory = async () => {
    setAppTab('home')
    if (!selections || !seriesState || generationLockRef.current) return

    generationLockRef.current = true
    setGenerationError(false)
    setGenerationStatus('starting')

    try {
      const { episode: firstEpisode } = await storyService.generateEpisode({ selections, seriesState })
      const nextSeries = { ...seriesState, episodeCount: 1 }

      setEpisode(firstEpisode)
      setSeriesState(nextSeries)
      localPersistence.saveCurrentEpisode(firstEpisode)
      localPersistence.saveSeriesState(nextSeries)
      updateScreen('story')
    } catch (error) {
      console.error('Failed to generate first story episode', error)
      setGenerationError(true)
    } finally {
      generationLockRef.current = false
      setGenerationStatus('idle')
    }
  }

  const handleChoiceSelected = (choice: EpisodeChoice) => {
    if (!seriesState || !episode || seriesState.choiceHistory.some((entry) => entry.episode_id === episode.episode_id)) return
    const nextSeriesState = applyChoiceToSeriesState(seriesState, episode, choice)
    setSeriesState(nextSeriesState)
    localPersistence.saveSeriesState(nextSeriesState)
  }

  const handleContinueNextEpisode = async () => {
    if (
      !selections ||
      !seriesState ||
      selections.storyMode !== 'series' ||
      seriesState.choiceHistory.length === 0 ||
      generationLockRef.current
    ) return

    generationLockRef.current = true
    setGenerationError(false)
    setGenerationStatus('continuing')

    try {
      const { episode: secondEpisode } = await storyService.generateEpisode({ selections, seriesState })
      const nextSeriesState = { ...seriesState, episodeCount: 2 }

      setEpisode(secondEpisode)
      setSeriesState(nextSeriesState)
      localPersistence.saveCurrentEpisode(secondEpisode)
      localPersistence.saveSeriesState(nextSeriesState)
      updateScreen('story')
    } catch (error) {
      console.error('Failed to generate story continuation', error)
      setGenerationError(true)
    } finally {
      generationLockRef.current = false
      setGenerationStatus('idle')
    }
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
    if (!selections || generationLockRef.current) return
    setGenerationError(false)
    archiveCurrentStory()
    const nextSeries = createInitialSeriesState(selections)
    setSeriesState(nextSeries)
    setEpisode(null)
    localPersistence.saveSeriesState(nextSeries)
    localPersistence.clearEpisodeAndScreen()
    updateScreen('home')
  }

  const handleOpenArchivedStory = (item: StoryArchiveItem) => {
    if (
      generationLockRef.current ||
      !item.selections ||
      !item.seriesState ||
      !item.episode
    ) return

    setGenerationError(false)
    archiveCurrentStory()

    setSelections(item.selections)
    setSeriesState(item.seriesState)
    setEpisode(item.episode)
    updateLanguage(item.selections.language)

    localPersistence.saveOnboardingSelections(item.selections)
    localPersistence.saveSeriesState(item.seriesState)
    localPersistence.saveCurrentEpisode(item.episode)

    setAppTab('library')
    updateScreen('story')
  }

  const handleOpenOnboarding = (mode: OnboardingMode) => {
    if (generationLockRef.current) return
    setGenerationError(false)
    setOnboardingMode(mode)
    updateScreen('onboarding')
  }

  const handleOpenNewStorySetup = () => {
    if (!selections) return
    setAppTab('home')
    handleOpenOnboarding('new_story')
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

  const currentGenerationCopy = generationCopy[language]
  const isGenerating = generationStatus !== 'idle'
  const generationLabel =
    generationStatus === 'continuing'
      ? currentGenerationCopy.continuing
      : currentGenerationCopy.starting
  const generationErrorMessage = generationError ? currentGenerationCopy.error : null

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
            initialSelections={onboardingMode !== 'first_launch' ? selections ?? undefined : undefined}
          />
        )}

        {screen === 'home' && selections && appTab === 'home' && (
          <HomeScreen
            language={language}
            selections={selections}
            seriesState={seriesState}
            episode={episode}
            isGenerating={isGenerating}
            generationLabel={generationLabel}
            generationErrorMessage={generationErrorMessage}
            onCreateFirstSeries={handleStartStory}
            onContinueStory={handleOpenStory}
            onResetStory={handleResetStory}
            onEditSetup={() => handleOpenOnboarding('edit_setup')}
            onCreateNewStorySetup={handleOpenNewStorySetup}
          />
        )}


        {screen === 'home' && selections && appTab === 'library' && (
          <LibraryScreen
            language={language}
            selections={selections}
            seriesState={seriesState}
            episode={episode}
            archiveItems={archiveItems}
            isGenerating={isGenerating}
            generationLabel={generationLabel}
            generationErrorMessage={generationErrorMessage}
            onOpenStory={handleOpenStory}
            onOpenArchivedStory={handleOpenArchivedStory}
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
            onCreateNewStorySetup={handleOpenNewStorySetup}
          />
        )}

        {screen === 'story' && episode && (
          <StoryScreen
            language={language}
            episode={episode}
            storyMode={selections?.storyMode ?? 'series'}
            isGenerating={isGenerating}
            generationLabel={generationLabel}
            generationErrorMessage={generationErrorMessage}
            onChoiceSelected={handleChoiceSelected}
            onContinueNextEpisode={handleContinueNextEpisode}
            readerPreferences={readerPreferences}
            onReaderPreferencesChange={updateReaderPreferences}
            isChoiceSavedForCurrentEpisode={Boolean(savedChoiceEntryForCurrentEpisode)}
            savedChoiceIdForCurrentEpisode={savedChoiceEntryForCurrentEpisode?.choice_id ?? null}
            onBackHome={() => { setAppTab('home'); updateScreen('home') }}
            onStartNewStory={handleOpenNewStorySetup}
          />
        )}
        {screen === 'home' && selections ? <AppBottomNav language={language} tab={appTab} onTab={setAppTab} /> : null}
      </div>
    </div>
  )
}

export default App
