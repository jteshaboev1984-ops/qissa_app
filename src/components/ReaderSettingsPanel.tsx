import type { ReactNode } from 'react'
import { t } from '../lib/i18n'
import type { Language, ReaderPreferences } from '../types/qissa'

interface ReaderSettingsPanelProps {
  language: Language
  preferences: ReaderPreferences
  onChange: (patch: Partial<ReaderPreferences>) => void
  onClose: () => void
  showClose?: boolean
}

const textSizes: ReaderPreferences['textSize'][] = ['small', 'medium', 'large', 'extra_large']
const fontModes: ReaderPreferences['fontMode'][] = ['standard', 'soft', 'dyslexia_friendly']
const lineSpacings: ReaderPreferences['lineSpacing'][] = ['normal', 'relaxed', 'wide']
const themes: ReaderPreferences['theme'][] = ['light', 'warm', 'night']

export function ReaderSettingsPanel({ language, preferences, onChange, onClose, showClose = true }: ReaderSettingsPanelProps) {
  return (
    <div className="space-y-5 rounded-[1.75rem] border border-[#eadfc9] bg-[#fffdf7]/95 p-4 shadow-[0_12px_32px_-26px_rgba(115,92,0,.55)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="q-label mb-1">Aa</p>
          <h3 className="text-base font-bold text-[#24261f]">{t(language, 'reader.open_settings')}</h3>
        </div>
        {showClose ? (
          <button
            type="button"
            className="rounded-full border border-[#eadfc9] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#665d49] hover:bg-white"
            onClick={onClose}
          >
            {t(language, 'reader.close_settings')}
          </button>
        ) : null}
      </div>

      <SettingRow label={t(language, 'reader.text_size')}>
        {textSizes.map((value) => (
          <ChoicePill key={value} active={preferences.textSize === value} onClick={() => onChange({ textSize: value })}>
            {t(language, `reader.text_size.${value}`)}
          </ChoicePill>
        ))}
      </SettingRow>

      <SettingRow label={t(language, 'reader.font')}>
        {fontModes.map((value) => (
          <ChoicePill key={value} active={preferences.fontMode === value} onClick={() => onChange({ fontMode: value })}>
            {t(language, `reader.font.${value}`)}
          </ChoicePill>
        ))}
      </SettingRow>

      <SettingRow label={t(language, 'reader.line_spacing')}>
        {lineSpacings.map((value) => (
          <ChoicePill key={value} active={preferences.lineSpacing === value} onClick={() => onChange({ lineSpacing: value })}>
            {t(language, `reader.line_spacing.${value}`)}
          </ChoicePill>
        ))}
      </SettingRow>

      <SettingRow label={t(language, 'reader.theme')}>
        {themes.map((value) => (
          <ChoicePill key={value} active={preferences.theme === value} onClick={() => onChange({ theme: value })}>
            {t(language, `reader.theme.${value}`)}
          </ChoicePill>
        ))}
      </SettingRow>
    </div>
  )
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#7d704e]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function ChoicePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-[0.98] ${
        active
          ? 'border-[#d4af37] bg-[#fff1bd] text-[#3b2d00] shadow-sm'
          : 'border-[#eadfc9] bg-white/80 text-[#5f5848] hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}
