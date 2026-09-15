from pathlib import Path
p = Path('supabase/functions/story-generate/storySixMinuteEditorial.ts')
text = p.read_text()
old = "Puf akasiga sovg‘ani ko‘rsatadigan payt juda yaqin edi."
new = "Momiq akasiga sovg‘ani ko‘rsatadigan payt juda yaqin edi."
if text.count(old) != 1:
    raise SystemExit(f'expected one preview marker, got {text.count(old)}')
p.write_text(text.replace(old, new, 1))
