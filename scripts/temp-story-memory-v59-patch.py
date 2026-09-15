from pathlib import Path

arch = Path('supabase/functions/story-generate/story-architecture.ts')
text = arch.read_text()
old = "  if (stableMemoryKey.test(candidate)) return candidate"
new = "  if (asciiSlug && stableMemoryKey.test(candidate)) return candidate"
if text.count(old) != 1:
    raise SystemExit(f'architecture match count: {text.count(old)}')
arch.write_text(text.replace(old, new, 1))

check = Path('scripts/check-story-ai-split.mjs')
text = check.read_text()
old_import = "import { hasSingleLanguageMismatch } from '../supabase/functions/story-generate/language.ts'"
new_import = old_import + "\nimport { normalizeStoryBlueprintMemoryKeys } from '../supabase/functions/story-generate/story-architecture.ts'"
if text.count(old_import) != 1:
    raise SystemExit('check import mismatch')
text = text.replace(old_import, new_import, 1)

marker = "requireLanguageGuard(!hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кіріп, жарыққа жақындады. Құстар үнсіз қалды, өйткені түн тыныш еді.']), 'KZ must accept Kazakh Cyrillic prose')\n"
regression = """

const memoryKeyRegression = normalizeStoryBlueprintMemoryKeys(
  { canonState: {}, relationshipState: {} },
  {
    state_patch: {
      last_event: '', new_friend: null, hero_trait: null, open_arc: null,
      relationship_updates: [{ key: 'дружба Топы', value: 'Топа доверяет героине.' }],
      canon_updates: [
        { key: 'узор у ручья', value: 'На камнях появился узор.' },
        { key: 'семечко у ручья', value: 'У воды появилось семечко.' },
      ],
    },
    choices: [],
  },
).blueprint
const normalizedCanonKeys = memoryKeyRegression.state_patch.canon_updates.map((entry) => entry.key)
const normalizedRelationshipKeys = memoryKeyRegression.state_patch.relationship_updates.map((entry) => entry.key)
requireLanguageGuard(normalizedCanonKeys.every((key) => key !== 'canon' && /^canon_[a-z0-9]+$/u.test(key)), 'Cyrillic canon keys must hash to stable unique ASCII identifiers')
requireLanguageGuard(new Set(normalizedCanonKeys).size === normalizedCanonKeys.length, 'distinct Cyrillic canon keys must not collapse to the same identifier')
requireLanguageGuard(normalizedRelationshipKeys.every((key) => key !== 'rel' && /^rel_[a-z0-9]+$/u.test(key)), 'Cyrillic relationship keys must hash to stable ASCII identifiers')
"""
if text.count(marker) != 1:
    raise SystemExit('check regression marker mismatch')
check.write_text(text.replace(marker, marker + regression, 1))
