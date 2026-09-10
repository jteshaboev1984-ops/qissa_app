from pathlib import Path
import re

story_path = Path('supabase/functions/story-generate/storySixMinuteEditorial.ts')
story = story_path.read_text(encoding='utf-8')

replacements = {
    "ru: `Мирай напомнила, что после помощи цветам друзья не будут искать новое дело. Они только проверят дорожку, попрощаются с садом и отправятся домой. От этих слов вечер словно стал ещё тише. {{HERO}} услышал ровный плеск фонтана и понял: вся сегодняшняя история уже помещается в одну простую заботу.`":
        "ru: `Мирай напомнила, что после помощи цветам друзья только проверят дорожку, попрощаются с садом и отправятся домой. В фонтане ровно плеснула вода, серебряные лепестки качнулись, и стало понятно, чем закончится сегодняшняя забота о цветах.`",
    "ru: `Пико поставил рядом с картой маленький таймер без тревожного звука. Времени было достаточно. Если действовать спокойно, капсула успеет получить знак и войти в стыковочный коридор точно по расписанию. {{HERO}} увидел это на экране и окончательно успокоился: впереди была не опасность, а аккуратная работа, которую можно закончить сегодня.`":
        "ru: `Пико поставил рядом с картой маленький таймер без тревожного звука. Времени хватало: капсула успевала заметить знак и подлететь к нужному окну. На экране мигала серебряная точка, а рядом уже лежали фонарь и светящиеся звёздочки.`",
    "{ word: `развилка`, translation: `fork in the road`, example: `У развилки рядом с {{HERO}} собрались друзья.` }":
        "{ word: `развилка`, translation: `fork in the road`, example: `У развилки собрались друзья.` }",
    "{ word: `шелест`, translation: `rustle`, example: `Рядом с {{HERO}} был слышен шелест мокрых листьев.` }":
        "{ word: `шелест`, translation: `rustle`, example: `В лесу был слышен шелест мокрых листьев.` }",
    "{ word: `лепесток`, translation: `petal`, example: `Перед {{HERO}} у фонтана блеснул серебряный лепесток.` }":
        "{ word: `лепесток`, translation: `petal`, example: `У фонтана блеснул серебряный лепесток.` }",
    "{ word: `созвездие`, translation: `constellation`, example: `Перед {{HERO}} на окне сложилось простое созвездие.` }":
        "{ word: `созвездие`, translation: `constellation`, example: `На окне сложилось простое созвездие.` }",
    "ru: `После выбора ты сухие корни получили воду, и первый лунный цветок раскрыл серебряный лепесток.`":
        "ru: `После твоего выбора сухие корни получили воду, и первый лунный цветок раскрыл серебряный лепесток.`",
    "ru: `После выбора ты светлячки вылетели из чаши, и их танец помог лунным цветам повернуться к свету.`":
        "ru: `После твоего выбора светлячки вылетели из чаши, и их танец помог лунным цветам повернуться к свету.`",
    "ru: `После выбора ты у окна зажёгся золотой маяк, и ночная почта увидела окно «Люмена».`":
        "ru: `После твоего выбора у окна зажёгся золотой маяк, и ночная почта увидела окно «Люмена».`",
}

for old, new in replacements.items():
    if old not in story:
        raise SystemExit(f'missing story replacement anchor: {old[:90]}')
    story = story.replace(old, new, 1)

child_start = story.index('const childFirstStories:')
child = story[child_start:]
ru_literals = list(re.finditer(r'ru: `([\s\S]*?)`,', child))
if not ru_literals:
    raise SystemExit('no RU child-first literals found')
for match in ru_literals:
    value = match.group(1)
    scrubbed = value.replace('— {{HERO}},', '')
    if '{{HERO}}' in scrubbed or 'QISSA_HERO' in scrubbed:
        raise SystemExit('RU child-first hero token remains outside direct address')
for match in re.finditer(r'example: `([^`]*)`', child):
    if '{{HERO}}' in match.group(1) or 'QISSA_HERO' in match.group(1):
        raise SystemExit('RU vocabulary example still contains raw hero token')

story_path.write_text(story, encoding='utf-8')

safety_path = Path('supabase/functions/story-generate/safety.ts')
safety = safety_path.read_text(encoding='utf-8')
anchor = """const startsWithNextDayReset = (context: NormalizedStoryContext, text: string) => {\n  if (!isFiveToSevenBedtimeSeries(context) || context.episodeIndex !== 2) return false\n  const first = text.trim().slice(0, 80).toLocaleLowerCase()\n  return /^утром\\b/u.test(first) || /^на следующее утро\\b/u.test(first) || /^tongda\\b/u.test(first) || /^ertasi tongda\\b/u.test(first) || /^таңертең\\b/u.test(first)\n}\n\n"""
if anchor not in safety:
    raise SystemExit('safety insertion anchor missing')
helper = """const russianHeroTokenNeedsRewrite = (text: string) => {\n  const token = '(?:\\\\{\\\\{HERO\\\\}\\\\}|QISSA_HERO)'\n  const preposition = new RegExp(\n    `(?:^|[\\\\s(«„\"—-])(?:у|к|ко|с|со|от|до|для|без|про|о|об|обо|около|возле|вокруг|перед|за|под|над|между|рядом\\\\s+с)\\\\s+${token}(?=[\\\\s,.:;!?»”\")—-]|$)`,\n    'iu',\n  )\n  const genderedAgreement = new RegExp(\n    `${token}\\\\s+(?:сказал|сказала|подошёл|подошла|увидел|увидела|услышал|услышала|понял|поняла|решил|решила|оказался|оказалась|остановился|остановилась|улыбнулся|улыбнулась|засмеялся|засмеялась|пожелал|пожелала)\\\\b`,\n    'iu',\n  )\n  return preposition.test(text) || genderedAgreement.test(text)\n}\n\n"""
safety = safety.replace(anchor, anchor + helper, 1)
value_anchor = "  const value = candidate as StoryCandidate\n\n"
if value_anchor not in safety:
    raise SystemExit('candidate value anchor missing')
validation = """  if (context.language === 'ru') {\n    const choiceText = Array.isArray(value.choices)\n      ? value.choices.flatMap((choice) => isRecord(choice)\n          ? [choice.text, choice.effect_summary, choice.resolution_text, choice.tomorrow_seed]\n              .filter((item): item is string => typeof item === 'string')\n          : []).join(' ')\n      : ''\n    const vocabularyText = Array.isArray(value.vocabulary)\n      ? value.vocabulary.flatMap((item) => isRecord(item)\n          ? [item.word, item.translation, item.example]\n              .filter((entry): entry is string => typeof entry === 'string')\n          : []).join(' ')\n      : ''\n    const heroGrammarText = [value.title, value.story_text, value.nextEpisodePreview, choiceText, vocabularyText]\n      .filter((item): item is string => typeof item === 'string')\n      .join(' ')\n    if (russianHeroTokenNeedsRewrite(heroGrammarText)) errors.push('russian_hero_requires_rewrite')\n  }\n\n"""
safety = safety.replace(value_anchor, value_anchor + validation, 1)
safety_path.write_text(safety, encoding='utf-8')

check_path = Path('scripts/check-story-ai-safety.mjs')
check = check_path.read_text(encoding='utf-8')
check_anchor = "  \"errors.push('bedtime_coda_too_long')\",\n])"
if check_anchor not in check:
    raise SystemExit('story safety contract anchor missing')
check = check.replace(
    check_anchor,
    "  \"errors.push('bedtime_coda_too_long')\",\n  'russianHeroTokenNeedsRewrite',\n  \"errors.push('russian_hero_requires_rewrite')\",\n])",
    1,
)
check_path.write_text(check, encoding='utf-8')

matrix_path = Path('scripts/check-closed-beta-content-matrix.mjs')
matrix = matrix_path.read_text(encoding='utf-8')
matrix_anchor = "const nextDayReset = /^(?:утром\\b|на следующее утро\\b|tongda\\b|ertasi tongda\\b)/iu\n\n"
if matrix_anchor not in matrix:
    raise SystemExit('matrix helper anchor missing')
matrix_helper = r"""const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const assertRussianHeroFinalization = (label, heroName, fields) => {
  const name = escapeRegExp(heroName)
  const afterPreposition = new RegExp(
    `(?:^|[\\s(«„"—-])(?:у|к|ко|с|со|от|до|для|без|про|о|об|обо|около|возле|вокруг|перед|за|под|над|между|рядом\\s+с)\\s+${name}(?=[\\s,.:;!?»”")—-]|$)`,
    'iu',
  )
  const genderedAgreement = new RegExp(
    `${name}\\s+(?:сказал|сказала|подошёл|подошла|увидел|увидела|услышал|услышала|понял|поняла|решил|решила|оказался|оказалась|остановился|остановилась|улыбнулся|улыбнулась|засмеялся|засмеялась|пожелал|пожелала)\\b`,
    'iu',
  )
  for (const field of fields.filter((item) => typeof item === 'string')) {
    assert(!afterPreposition.test(field), `${label}: finalized Russian hero name appears after a preposition and would require declension.`)
    assert(!genderedAgreement.test(field), `${label}: finalized Russian hero name is followed by gendered agreement.`)
  }
}

const finalEpisodeFields = (episode) => [
  episode.title,
  episode.story_text,
  episode.nextEpisodePreview,
  ...episode.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.resolution_text, choice.tomorrow_seed]),
  ...episode.vocabulary.flatMap((item) => [item.word, item.translation, item.example]),
]

const storyEditorialSource = await readFile(join(root, 'supabase/functions/story-generate/storySixMinuteEditorial.ts'), 'utf8')
const childFirstSourceStart = storyEditorialSource.indexOf('const childFirstStories:')
assert(childFirstSourceStart >= 0, 'child-first story source missing')
const childFirstSource = storyEditorialSource.slice(childFirstSourceStart)
for (const match of childFirstSource.matchAll(/ru: `([\s\S]*?)`,/gu)) {
  const raw = match[1].replace(/— \{\{HERO\}\},/gu, '')
  assert(!raw.includes('{{HERO}}') && !raw.includes('QISSA_HERO'), 'RU deterministic source must keep the raw hero token in direct address only.')
}
for (const match of childFirstSource.matchAll(/example: `([^`]*)`/gu)) {
  assert(!match[1].includes('{{HERO}}') && !match[1].includes('QISSA_HERO'), 'RU vocabulary examples must not require hero-name declension.')
}

"""
matrix = matrix.replace(matrix_anchor, matrix_anchor + matrix_helper, 1)
matrix = matrix.replace("  heroType: 'boy_hero',\n  heroName: 'Timur',", "  heroType: language === 'ru' ? 'custom' : 'boy_hero',\n  heroName: language === 'ru' ? 'Алия' : 'Timur',", 1)

ep1_anchor = "      minimumEpisodeOneWords = Math.min(minimumEpisodeOneWords, episodeOneWords)\n\n"
if ep1_anchor not in matrix:
    raise SystemExit('episode one assertion anchor missing')
matrix = matrix.replace(
    ep1_anchor,
    ep1_anchor + "      if (language === 'ru') assertRussianHeroFinalization(`${label}/episode-1`, context.heroName, finalEpisodeFields(episodeOne))\n\n",
    1,
)
ep2_anchor = "        minimumEpisodeTwoWords = Math.min(minimumEpisodeTwoWords, episodeTwoWords)\n"
if ep2_anchor not in matrix:
    raise SystemExit('episode two assertion anchor missing')
matrix = matrix.replace(
    ep2_anchor,
    ep2_anchor + "        if (language === 'ru') assertRussianHeroFinalization(`${label}/${branch}/episode-2`, context.heroName, finalEpisodeFields(episodeTwo))\n",
    1,
)
matrix_path.write_text(matrix, encoding='utf-8')

print('final child-first grammar hardening applied')
