import { useState } from 'react'
import { t } from '../lib/i18n'
import type { Episode, Language, ReaderPreferences, StylePack } from '../types/qissa'
import { VoiceSelector } from './VoiceSelector'
import { StylePackCover } from './StylePackCover'

interface ListeningSceneProps {
  language: Language
  episode: Episode
  preferences: ReaderPreferences
  onPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  stylePack: StylePack
}

export function ListeningScene({ language, episode, preferences, onPreferencesChange, stylePack }: ListeningSceneProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="space-y-4 rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-slate-100 shadow-inner">
      <StylePackCover stylePack={stylePack} variant="listening" title={episode.title} subtitle={stylePack.title[language]} />

      <div className="grid grid-cols-3 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 p-2 text-sm">
        <button className="rounded-lg bg-slate-800 px-2 py-3">{t(language, 'listen.back_10')}</button>
        <button className="rounded-lg bg-amber-300 px-2 py-3 font-semibold text-slate-900" onClick={() => setIsPlaying((prev) => !prev)}>
          {isPlaying ? t(language, 'listen.pause') : t(language, 'listen.play')}
        </button>
        <button className="rounded-lg bg-slate-800 px-2 py-3">{t(language, 'listen.forward_10')}</button>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/90 p-3">
        <p className="text-xs text-slate-300">{t(language, 'listen.progress')}</p>
        <div className="h-2 rounded-full bg-slate-700"><div className="h-2 w-1/3 rounded-full bg-amber-300" /></div>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/90 p-3">
        <p className="text-xs text-slate-300">{t(language, 'listen.speed')}</p>
        <div className="flex gap-2">{['0.8x', '1x', '1.2x'].map((speed) => <button key={speed} className={`rounded-full px-3 py-2 text-xs ${speed === '1x' ? 'bg-amber-200 text-amber-900' : 'bg-slate-800 text-slate-100'}`}>{speed}</button>)}</div>
      </div>

      <p className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">{t(language, 'listen.prototype_note')}</p>

      <VoiceSelector language={language} selectedVoiceId={preferences.voicePresetId} onSelect={(voicePresetId) => onPreferencesChange({ voicePresetId })} />
    </div>
  )
}
