import { useState } from 'react'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { t } from './lib/i18n'
import { HomeScreen } from './screens/HomeScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import type { Language, OnboardingSelections } from './types/qissa'

type Screen = 'welcome' | 'onboarding' | 'home'

function App() {
  const [language, setLanguage] = useState<Language>('ru')
  const [screen, setScreen] = useState<Screen>('welcome')
  const [selections, setSelections] = useState<OnboardingSelections | null>(null)

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
        {screen === 'onboarding' && <OnboardingFlow language={language} onLanguageChange={setLanguage} onComplete={(value) => { setSelections(value); setScreen('home') }} />}
        {screen === 'home' && selections && <HomeScreen language={language} selections={selections} />}
      </div>
    </div>
  )
}

export default App
