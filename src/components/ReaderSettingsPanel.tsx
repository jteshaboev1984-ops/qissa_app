import type { ReactNode } from 'react'
import { t } from '../lib/i18n'
import type { Language, ReaderPreferences } from '../types/qissa'

interface ReaderSettingsPanelProps {
  language: Language
  preferences: ReaderPreferences
  onChange: (patch: Partial<ReaderPreferences>) => void
  onClose: () => void
}

const textSizes: ReaderPreferences['textSize'][] = ['small', 'medium', 'large', 'extra_large']
const fontModes: ReaderPreferences['fontMode'][] = ['standard', 'soft', 'dyslexia_friendly']
const lineSpacings: ReaderPreferences['lineSpacing'][] = ['normal', 'relaxed', 'wide']
const themes: ReaderPreferences['theme'][] = ['light', 'warm', 'night']

export function ReaderSettingsPanel({ language, preferences, onChange, onClose }: ReaderSettingsPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{t(language, 'reader.open_settings')}</h3>
        <button type="button" className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" onClick={onClose}>{t(language, 'reader.close_settings')}</button>
      </div>

      <SettingRow label={t(language, 'reader.text_size')}>
        {textSizes.map((value) => (
          <ChoicePill
            key={value}
            active={preferences.textSize === value}
            onClick={() => onChange({ textSize: value })}
          >
            {t(language, `reader.text_size.${value}`)}
          </ChoicePill>
        ))}
      </SettingRow>

      <SettingRow label={t(language, 'reader.font')}>
        {fontModes.map((value) => <ChoicePill key={value} active={preferences.fontMode === value} onClick={() => onChange({ fontMode: value })}>{t(language, `reader.font.${value}`)}</ChoicePill>)}
      </SettingRow>

      <SettingRow label={t(language, 'reader.line_spacing')}>
        {lineSpacings.map((value) => <ChoicePill key={value} active={preferences.lineSpacing === value} onClick={() => onChange({ lineSpacing: value })}>{t(language, `reader.line_spacing.${value}`)}</ChoicePill>)}
      </SettingRow>

      <SettingRow label={t(language, 'reader.theme')}>
        {themes.map((value) => <ChoicePill key={value} active={preferences.theme === value} onClick={() => onChange({ theme: value })}>{t(language, `reader.theme.${value}`)}</ChoicePill>)}
      </SettingRow>
    </div>
  )
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function ChoicePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${active ? 'border-amber-400 bg-amber-100 text-amber-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{children}</button>
}
