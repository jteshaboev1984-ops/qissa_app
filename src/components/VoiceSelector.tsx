import { voicePresets } from '../data/voicePresets'
import { t } from '../lib/i18n'
import type { Language, VoicePresetId } from '../types/qissa'

interface VoiceSelectorProps {
  language: Language
  selectedVoiceId: VoicePresetId
  onSelect: (voiceId: VoicePresetId) => void
}

export function VoiceSelector({ language, selectedVoiceId, onSelect }: VoiceSelectorProps) {
  return (
    <div className="space-y-2 rounded-xl bg-slate-800/80 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-300">{t(language, 'listen.change_voice')}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {voicePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={`rounded-xl border px-3 py-3 text-left text-sm ${
              selectedVoiceId === preset.id
                ? 'border-amber-300 bg-amber-100/95 text-amber-900'
                : 'border-slate-600 bg-slate-900/60 text-slate-100'
            }`}
          >
            {t(language, `voice.${preset.id}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
