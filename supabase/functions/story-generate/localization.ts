import type { NormalizedStoryContext } from './contracts.ts'

export const storyLocalizationSystem = (context: NormalizedStoryContext): string => {
  const shared = [
    'Treat localization as original storytelling in the selected language, not literal translation.',
    'The selected language governs narration, dialogue, title, interjections, onomatopoeia, and any NEW supporting-character names, nicknames, place labels, or child-facing expressions created in this story.',
    'Never rename the selected hero, custom hero name, recurring characters, canon names, remembered objects, or remembered places already present in story state.',
    'When inventing a NEW name or nickname, make it easy for a child speaking the selected language to hear, pronounce, and remember.',
    'Do not insert random English-style or cross-language names merely to sound magical or international when a natural language-local name or nickname would work.',
    'Humor, forms of address, diminutives, interjections, and dialogue rhythm should sound native to the selected language rather than translated.',
    'Central Asian cultural fit should come from natural relevant details, not decorative stereotypes. Do not force tea, bread, bazaars, carpets, national clothing, or similar motifs into unrelated scenes.',
    'A deliberately fictional robot, station, magical object, or fantasy creature may have an invented name when the world needs it, but the name must still be pronounceable and consistent with the selected language unless existing canon says otherwise.',
  ]

  if (context.language === 'ru') {
    return [...shared,
      'For Russian stories, write all newly created ordinary supporting-character names and nicknames in Cyrillic and make them sound natural in Russian children\'s prose.',
      'Avoid unexplained English-sounding constructions such as Флип, Луми, Спарк, Бадди, or similar imported-sounding names unless the story world gives a clear reason for that exact canon name.',
      'Do not force specifically Russian ethnicity onto characters; natural Russian-language storytelling is the requirement.',
    ].join(' ')
  }

  if (context.language === 'uz') {
    return [...shared,
      'For Uzbek stories, use natural Uzbek in Latin script, including correct Uzbek orthography such as o‘ and g‘ where needed.',
      'New supporting-character names and nicknames should feel natural to an Uzbek-speaking child. Do not mechanically transliterate Russian names or sentence structure.',
      'Uzbek dialogue, jokes, forms of address, and small expressions may differ from a Russian version while preserving the same story contract and canon.',
    ].join(' ')
  }

  return [...shared,
    'For Kazakh stories, use natural Kazakh in Cyrillic script. New supporting-character names, nicknames, dialogue particles, and forms of address should feel natural to a Kazakh-speaking child rather than mechanically transliterated from Russian or Uzbek.',
  ].join(' ')
}
