import { voicePresets } from '../data/voicePresets'
import { t } from '../lib/i18n'
import type { Language, VoicePresetId } from '../types/qissa'

interface VoiceSelectorProps {
  language: Language
  selectedVoiceId: VoicePresetId
  onSelect: (voiceId: VoicePresetId) => void
  tone?: 'dark' | 'light'
}

export function VoiceSelector({ language, selectedVoiceId, onSelect, tone = 'dark' }: VoiceSelectorProps) {
  const light = tone === 'light'
  return (
    <div className={`space-y-3 rounded-[1.5rem] border p-3 ${light ? 'border-[#eadfc9] bg-[#fff8e9]' : 'border-slate-700 bg-slate-900/75'}`}>
      <p className={`q-label ${light ? '' : 'text-slate-300'}`}>{t(language, 'listen.change_voice')}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {voicePresets.map((preset) => {
          const active = selectedVoiceId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              className={`rounded-[1.25rem] border px-3 py-3 text-left text-sm font-semibold leading-snug transition active:scale-[0.98] ${
                active
                  ? 'border-[#d4af37] bg-[#fff1bd] text-[#3b2d00] shadow-sm'
                  : light
                    ? 'border-[#eadfc9] bg-white/80 text-[#4d4635] hover:bg-white'
                    : 'border-slate-600 bg-slate-900/60 text-slate-100 hover:bg-slate-800'
              }`}
            >
              {t(language, `voice.${preset.id}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
