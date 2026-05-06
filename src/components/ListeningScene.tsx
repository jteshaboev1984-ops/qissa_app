import { useState } from 'react'
import { t } from '../lib/i18n'
import type { Episode, Language, ReaderPreferences } from '../types/qissa'
import { VoiceSelector } from './VoiceSelector'

interface ListeningSceneProps {
  language: Language
  episode: Episode
  preferences: ReaderPreferences
  onPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  worldTitle: string
  palette: { primary: string; secondary: string; text: string }
}

export function ListeningScene({ language, episode, preferences, onPreferencesChange, worldTitle, palette }: ListeningSceneProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="space-y-4 rounded-2xl bg-slate-950 p-4 text-slate-100">
      <div className="rounded-2xl p-4" style={{ background: `linear-gradient(145deg, ${palette.primary}, ${palette.secondary})`, color: palette.text }}>
        <p className="text-xs opacity-90">{worldTitle}</p>
        <h3 className="text-xl font-semibold">{episode.title}</h3>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 rounded-xl bg-slate-900 p-2 text-xs">
        <button className="rounded-lg bg-slate-800 px-2 py-2">{t(language, 'listen.back_10')}</button>
        <button
          className="rounded-lg bg-amber-300 px-2 py-2 font-semibold text-slate-900"
          onClick={() => setIsPlaying((prev) => !prev)}
        >
          {isPlaying ? t(language, 'listen.pause') : t(language, 'listen.play')}
        </button>
        <button className="rounded-lg bg-slate-800 px-2 py-2">{t(language, 'listen.forward_10')}</button>
      </div>

      <div className="space-y-2 rounded-xl bg-slate-900 p-3">
        <p className="text-xs text-slate-300">{t(language, 'listen.progress')}</p>
        <div className="h-2 rounded-full bg-slate-700">
          <div className="h-2 w-1/3 rounded-full bg-amber-300" />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>01:24</span>
          <span>04:10</span>
        </div>
      </div>

      <div className="space-y-2 rounded-xl bg-slate-900 p-3">
        <p className="text-xs text-slate-300">{t(language, 'listen.speed')}</p>
        <div className="flex gap-2">
          {['0.8x', '1x', '1.2x'].map((speed) => (
            <button
              key={speed}
              className={`rounded-full px-3 py-1.5 text-xs ${speed === '1x' ? 'bg-amber-200 text-amber-900' : 'bg-slate-800 text-slate-100'}`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      <VoiceSelector
        language={language}
        selectedVoiceId={preferences.voicePresetId}
        onSelect={(voicePresetId) => onPreferencesChange({ voicePresetId })}
      />
    </div>
  )
}
