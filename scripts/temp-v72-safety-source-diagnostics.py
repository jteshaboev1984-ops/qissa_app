from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

split = 'supabase/functions/story-generate/split-index.ts'
old = """    if (!safety.approved) {
      lastFailureClass = 'semantic-safety'
      const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
      const fearDetail = evaluation.notes.find((note) => /^fear_adjudication:[a-z_]+$/u.test(note)) ?? ''
      trace.push(`semantic-safety:${flags.join(',') || safety.required_action}${fearDetail ? `:${fearDetail}` : ''}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
"""
new = """    if (!safety.approved) {
      lastFailureClass = 'semantic-safety'
      const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
      const evaluationFlags = Object.entries(evaluation.flags).filter(([, value]) => value).map(([key]) => key)
      const moderationCategories = Object.entries(moderation.categories)
        .filter(([, value]) => value)
        .map(([key]) => key.replace(/[^a-z0-9_-]/giu, '_').slice(0, 48))
        .slice(0, 6)
      const fearDetail = evaluation.notes.find((note) => /^fear_adjudication:[a-z_]+$/u.test(note)) ?? ''
      const sourceDetail = [
        evaluationFlags.length > 0 ? `eval=${evaluationFlags.join(',')}` : 'eval=clear',
        moderation.flagged || moderationCategories.length > 0
          ? `mod=${moderationCategories.join(',') || 'flagged'}`
          : 'mod=clear',
      ].join(';')
      trace.push(`semantic-safety:${flags.join(',') || safety.required_action}${fearDetail ? `:${fearDetail}` : ''}[${sourceDetail}]`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
"""
replace_once(split, old, new)

test = 'scripts/check-story-ai-split.mjs'
old = """  'fear_adjudication:[a-z_]+',
  \"'X-QISSA-Provider-Calls'\",
"""
new = """  'fear_adjudication:[a-z_]+',
  'evaluationFlags',
  'moderationCategories',
  \"'eval=clear'\",
  \"'mod=clear'\",
  \"'X-QISSA-Provider-Calls'\",
"""
replace_once(test, old, new)
