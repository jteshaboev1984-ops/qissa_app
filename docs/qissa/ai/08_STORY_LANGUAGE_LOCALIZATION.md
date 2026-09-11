# Story Language Localization Contract

This contract applies to Story AI output for the first real family beta. It complements `07_STORY_AI_NARRATIVE_MODEL.md` and the QISSA Localization Guide.

The goal is not literal translation. A story should feel as though it was originally told in the selected language.

## 1. Language controls the whole story surface

The selected story language must govern:

- narration;
- dialogue;
- title;
- interjections and onomatopoeia;
- supporting-character names and nicknames created in the current story;
- place labels created in the current story;
- ordinary object names and child-facing expressions;
- humor and wordplay;
- forms of address and diminutives where natural.

Do not write native narration and then insert random English-style or cross-language character names by default.

## 2. Preserve user and memory identity

Localization must never silently rename existing story identity.

Keep unchanged:

- the selected hero name supplied by product state;
- a custom hero name;
- names of recurring characters already stored in memory;
- canon names established in earlier episodes;
- remembered objects or places whose names are already part of canon.

The language-localization rule applies when the model creates a NEW supporting character, nickname, place or phrase.

This keeps continuity stronger than cosmetic relocalization.

## 3. Russian stories

Russian output should read like natural Russian children's prose.

For newly created names and nicknames:

- use Cyrillic;
- prefer forms that are easy for a Russian-speaking child to hear and remember;
- avoid unexplained English-sounding names such as `Флип`, `Луми`, `Спарк` or similar constructions when a natural Russian-language name or nickname would work just as well;
- animal and magical nicknames may be descriptive and playful when they sound natural in Russian;
- do not force specifically Russian ethnicity into every character. Language fit is the goal, not nationality assignment.

Dialogue, jokes, diminutives and exclamations should sound spoken rather than translated.

## 4. Uzbek stories

Uzbek output must use natural Uzbek in Latin script.

For newly created names and nicknames:

- use Uzbek-friendly names or child-friendly Uzbek nicknames;
- preserve Uzbek Latin orthography, including `o‘`, `g‘`, `sh`, `ch` where needed;
- do not mechanically transliterate Russian supporting-character names;
- do not insert English-style fantasy names unless the world genuinely requires them;
- use natural Uzbek dialogue rhythm and forms of address rather than Russian sentence structure with Uzbek words.

Jokes and small expressions may differ from the Russian version. The narrative contract must stay equivalent, not sentence-by-sentence identical.

## 5. Kazakh stories

Kazakh output should use natural Kazakh in Cyrillic script for the current product configuration.

New names, nicknames, dialogue particles and forms of address should sound natural to a Kazakh-speaking child. Do not mechanically transliterate Russian or Uzbek supporting-character names when creating new canon.

## 6. Central Asian cultural fit without caricature

QISSA is intended for Central Asian families, but language localization must not become decorative stereotyping.

Do:

- use familiar everyday rhythms, family-safe humor and natural forms of address;
- allow culturally familiar objects, foods or customs when they fit the selected world and actual scene;
- keep Silk Road / regional motifs respectful and grounded.

Do not:

- insert tea, bread, carpets, bazaars or national clothing into every story merely to signal region;
- assign personality or morality from nationality, language or gender;
- turn names into ethnic caricatures;
- mix languages randomly for “local flavor”.

## 7. World fit still matters

Language fit and world fit must work together.

A space story may use a robot designation or fictional station name. A magical creature may have a fantasy nickname. These can be invented, but they should still be easy to pronounce and should not feel accidentally imported from another language.

If a deliberately non-local name is important to canon, keep it stable and let surrounding narration remain fully native.

## 8. Human review gate

Before Story AI is enabled for families, each RU/UZ representative sample must answer YES to all of these:

1. Do all newly invented supporting-character names feel natural in the selected language?
2. Are dialogue and jokes native-sounding rather than translated?
3. Are forms of address, diminutives and interjections natural?
4. Are cultural details relevant to the scene rather than decorative stereotypes?
5. Are custom/remembered names preserved exactly across sessions?
6. Would a parent reading aloud notice any phrase, name or expression that feels imported from another language without a story reason?

A sample fails localization review if its grammar is correct but the names, dialogue, humor or cultural details still feel machine-translated or randomly international.
