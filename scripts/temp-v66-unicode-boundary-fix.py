from pathlib import Path
p = Path('supabase/functions/story-generate/safety.ts')
text = p.read_text()
old = """const futureSessionPatterns: Record<string, RegExp[]> = {
  ru: [/\\bзавтра\\b/iu, /\\bутром\\b/iu, /\\bна\\s+следующ(?:ий|ее)\\s+(?:день|утро)\\b/iu],
  uz: [/\\bertaga\\b/iu, /\\bertalab\\b/iu, /\\bertasi\\s+(?:kuni|tongda)\\b/iu, /\\bkeyingi\\s+kuni\\b/iu],
  kz: [/\\bертең\\b/iu, /\\bтаңертең\\b/iu, /\\bкелесі\\s+күні\\b/iu],
}
"""
new = """const futureSessionPatterns: Record<string, RegExp[]> = {
  ru: [
    /(?<![\\p{L}\\p{M}\\p{N}_])завтра(?![\\p{L}\\p{M}\\p{N}_])/iu,
    /(?<![\\p{L}\\p{M}\\p{N}_])утром(?![\\p{L}\\p{M}\\p{N}_])/iu,
    /(?<![\\p{L}\\p{M}\\p{N}_])на\\s+следующ(?:ий|ее)\\s+(?:день|утро)(?![\\p{L}\\p{M}\\p{N}_])/iu,
  ],
  uz: [
    /(?<![\\p{L}\\p{M}\\p{N}_])ertaga(?![\\p{L}\\p{M}\\p{N}_])/iu,
    /(?<![\\p{L}\\p{M}\\p{N}_])ertalab(?![\\p{L}\\p{M}\\p{N}_])/iu,
    /(?<![\\p{L}\\p{M}\\p{N}_])ertasi\\s+(?:kuni|tongda)(?![\\p{L}\\p{M}\\p{N}_])/iu,
    /(?<![\\p{L}\\p{M}\\p{N}_])keyingi\\s+kuni(?![\\p{L}\\p{M}\\p{N}_])/iu,
  ],
  kz: [
    /(?<![\\p{L}\\p{M}\\p{N}_])ертең(?![\\p{L}\\p{M}\\p{N}_])/iu,
    /(?<![\\p{L}\\p{M}\\p{N}_])таңертең(?![\\p{L}\\p{M}\\p{N}_])/iu,
    /(?<![\\p{L}\\p{M}\\p{N}_])келесі\\s+күні(?![\\p{L}\\p{M}\\p{N}_])/iu,
  ],
}
"""
if text.count(old) != 1:
    raise SystemExit(f'futureSessionPatterns marker mismatch: {text.count(old)}')
p.write_text(text.replace(old, new, 1))
