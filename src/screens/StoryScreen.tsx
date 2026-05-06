import { useMemo, useState } from 'react'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Episode, Language } from '../types/qissa'

export function StoryScreen({ language, episode }: { language: Language; episode: Episode }) {
  const [viewMode, setViewMode] = useState<'read' | 'listen'>('read')
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const stylePack = useMemo(() => stylePacks.find((pack) => pack.id === episode.stylePackId) ?? stylePacks[0], [episode.stylePackId])

  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${stylePack.palette.primary}, ${stylePack.palette.secondary})`, color: stylePack.palette.text }}>
        <p className="text-sm opacity-90">{stylePack.title[language]}</p>
        <h2 className="text-2xl font-semibold">{episode.title}</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
        <button onClick={() => setViewMode('read')} className={`rounded-xl px-4 py-3 text-sm font-medium ${viewMode === 'read' ? 'bg-white shadow-sm' : ''}`}>{t(language, 'story.read_mode')}</button>
        <button onClick={() => setViewMode('listen')} className={`rounded-xl px-4 py-3 text-sm font-medium ${viewMode === 'listen' ? 'bg-white shadow-sm' : ''}`}>{t(language, 'story.listen_mode')}</button>
      </div>

      {viewMode === 'read' ? (
        <article className="rounded-2xl bg-amber-50 p-4 leading-7 text-slate-800">
          {episode.story_text}
        </article>
      ) : (
        <div className="space-y-3 rounded-2xl bg-slate-900/95 p-4 text-slate-100">
          <div className="h-28 rounded-xl bg-gradient-to-r from-slate-700 to-slate-500" />
          <p className="text-sm">{t(language, 'story.listen_placeholder')}</p>
          <div className="flex items-center justify-between rounded-xl bg-slate-800 p-3 text-sm">
            <span>{t(language, 'story.audio_controls')}</span><span>00:00 / 06:00</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t(language, 'story.make_choice')}</h3>
        {episode.choices.map((choice) => (
          <button
            key={choice.choice_id}
            onClick={() => setSelectedChoiceId(choice.choice_id)}
            className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm ${selectedChoiceId === choice.choice_id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}
          >
            <p className="font-medium text-slate-800">{choice.text}</p>
            <p className="mt-1 text-sm text-slate-600">{choice.effect_summary}</p>
          </button>
        ))}
      </div>

      {selectedChoiceId && (
        <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          {t(language, 'story.choice_confirmation')}
        </p>
      )}

      {episode.vocabulary.length > 0 && (
        <div className="rounded-2xl bg-emerald-50 p-4">
          <h4 className="font-semibold text-emerald-900">{t(language, 'story.words_preview')}</h4>
          <ul className="mt-2 space-y-1 text-sm text-emerald-900">
            {episode.vocabulary.map((item) => <li key={item.word}>• {item.word} — {item.translation}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}
