import { useState } from 'react'
import { t } from '../lib/i18n'
import type { Episode, Language, ReaderPreferences, StylePack } from '../types/qissa'
import { StylePackCover } from './StylePackCover'
import { VoiceSelector } from './VoiceSelector'

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
    <div className="space-y-4 rounded-[2rem] border border-[#2f3a35] bg-gradient-to-b from-[#26332f] to-[#121916] p-4 text-[#f8f2e7] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_18px_45px_-30px_rgba(0,0,0,.65)]">
      <p className="rounded-[1.25rem] border border-[#4e5d54] bg-white/6 px-3 py-2 text-xs leading-5 text-[#d8d0be]">
        {t(language, 'listen.prototype_note')}
      </p>

      <StylePackCover stylePack={stylePack} variant="listening" title={episode.title} subtitle={stylePack.title[language]} />

      <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/7 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d4af37]">{t(language, 'listen.progress')}</p>
          <div className="mt-2 h-2 rounded-full bg-white/12">
            <div className="relative h-2 w-1/3 rounded-full bg-[#b9ebf2]">
              <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#b9ebf2] shadow-[0_0_14px_rgba(185,235,242,.9)]" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-2">
          <button className="rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-[#f8f2e7]">{t(language, 'listen.back_10')}</button>
          <button
            className="h-16 w-16 rounded-full bg-gradient-to-b from-[#f0cd58] to-[#d4af37] text-sm font-black text-[#2b2100] shadow-[0_18px_35px_-22px_rgba(212,175,55,.9)]"
            onClick={() => setIsPlaying((prev) => !prev)}
          >
            {isPlaying ? t(language, 'listen.pause') : t(language, 'listen.play')}
          </button>
          <button className="rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-[#f8f2e7]">{t(language, 'listen.forward_10')}</button>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-[#d8d0be]">{t(language, 'listen.speed')}</p>
          <div className="flex gap-2">
            {['0.8x', '1x', '1.2x'].map((speed) => (
              <button key={speed} className={`rounded-full px-3 py-1.5 text-xs font-bold ${speed === '1x' ? 'bg-[#b9ebf2] text-[#12373b]' : 'border border-white/10 text-[#f8f2e7]'}`}>
                {speed}
              </button>
            ))}
          </div>
        </div>
      </div>

      <VoiceSelector language={language} selectedVoiceId={preferences.voicePresetId} onSelect={(voicePresetId) => onPreferencesChange({ voicePresetId })} />
    </div>
  )
}
