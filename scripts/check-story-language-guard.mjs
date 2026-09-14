import { hasSingleLanguageMismatch } from '../supabase/functions/story-generate/language.ts'

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

assert(hasSingleLanguageMismatch('ru', ['В лесу {{HERO}} увидел green light.']), 'RU must reject Latin language leakage')
assert(!hasSingleLanguageMismatch('ru', ['В лесу {{HERO}} увидел зелёный огонёк.']), 'RU should accept Russian prose')
assert(hasSingleLanguageMismatch('uz', ['{{HERO}} o‘rmonda yurdi. Потом стало тихо.']), 'UZ must reject Cyrillic language leakage')
assert(!hasSingleLanguageMismatch('uz', ['{{HERO}} o‘rmonda yurdi va mayin chiroqni ko‘rdi.']), 'UZ should accept Uzbek Latin prose')
assert(hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кірді. Then the light moved.']), 'KZ must reject Latin language leakage')
assert(!hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кіріп, жарыққа жақындады. Құстар үнсіз қалды, өйткені түн тыныш еді.']), 'KZ should accept Kazakh Cyrillic prose')

console.log('selected-language guard regression passed for RU/UZ/KZ')
