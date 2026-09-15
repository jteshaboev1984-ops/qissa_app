from pathlib import Path

p = Path('supabase/functions/story-generate/split-index.ts')
text = p.read_text()
old = "const fearDetail = safety.notes.find((note) => /^fear_adjudication:[a-z_]+$/u.test(note)) ?? ''"
new = "const fearDetail = evaluation.notes.find((note) => /^fear_adjudication:[a-z_]+$/u.test(note)) ?? ''"
if text.count(old) != 1:
    raise SystemExit(f'expected one safety notes trace marker, got {text.count(old)}')
p.write_text(text.replace(old, new, 1))
