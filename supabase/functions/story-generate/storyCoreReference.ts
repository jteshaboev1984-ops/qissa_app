import type { Language, NormalizedStoryContext } from './contracts.ts'
import { magicGardenContinuation, magicGardenEpisodeOne, magicGardenTitle } from './storyMagicGardenBedtime.ts'
import { spaceContinuationRu, spaceEpisodeOneRu } from './storySpaceReference.ts'
import { spaceBedtimeContinuation, spaceBedtimeEpisodeOne, spaceBedtimeTitle } from './storySpaceBedtime.ts'

const cozyForestEpisodeOneRu = `Вечером в уютном лесу светлячки зажигались один за другим, а между деревьями пахло мокрой травой и тёплой корой. {{HERO}} шёл к старому пеньку, где лесные жители собирались пожелать друг другу доброй ночи. После короткого дождя на тропинке потускнели маленькие указатели, поэтому несколько зверят остановились у развилки и не знали, куда повернуть. Никто не испугался: рядом были друзья, а до сна оставалось достаточно времени.

Маленькая белка прижимала корзинку с орехами, кролик бережно поддерживал младшего брата, а черепаха спокойно отдыхала у камня. Всем хотелось дойти вместе, не торопясь и никого не оставляя позади.

{{HERO}} внимательно осмотрел дорогу. На ветках висели пустые бумажные фонарики, которые можно было зажечь мягким светом. Неподалёку светлячки кружились в ритме тихой мелодии; если спеть её вместе, лесные жители могли бы услышать друг друга и собраться у тропинки. Оба способа были добрыми и спокойными.

Листья едва шелестели, зверята терпеливо ждали, а над старым пеньком уже поднималась круглая луна. {{HERO}} понял, что решение не нужно принимать в спешке. Можно было осветить путь фонариками или позвать друзей спокойной песней. Лес был готов запомнить любой из этих выборов.`

const cozyForestContinuationRu = {
  'choice-a': `Утром у старого пенька всё ещё светился тот самый фонарик, который {{HERO}} оставил после вечерней прогулки. Его тёплый луч лежал на листьях и показывал начало освещённой тропинки. Сова Нура уже ждала на низкой ветке. Она заметила, что один маленький бельчонок не вернулся к своему дереву после раннего сбора шишек.

{{HERO}} и Нура пошли по дорожке, где вчера зажглись фонарики. Каждый огонёк напоминал, куда повернуть, поэтому друзья двигались спокойно и никого не торопили. За папоротником они услышали тихий шорох и нашли бельчонка возле незнакомого камня. Он просто свернул раньше времени и теперь ждал знакомого света.

Друзья проводили бельчонка к дому. По пути он сам узнавал фонарики и улыбался всё увереннее. У старого пенька Нура поблагодарила {{HERO}}: вчерашний выбор помог не только вечером, но и утром. Последний фонарик стал светить тише, словно понял, что его работа закончена. Лесные жители устроились рядом, разделили несколько орехов и спокойно встретили новый день.`,
  'choice-b': `Утром с нижней ветки прозвучала та самая тихая мелодия, которую {{HERO}} выбрал для лесных друзей вечером. Сова Нура запомнила первые ноты, а ёжик Топа всю дорогу домой негромко повторял припев. Теперь песня снова собрала друзей у тропинки.

Топа рассказал, что не может найти корзинку с мягкими листьями для своей норки. Он помнил, что поставил её где-то возле развилки, но все кусты казались похожими. {{HERO}} предложил пройти вчерашний путь и петь мелодию по частям. У каждого места находилась своя строка: у берёзы начинался первый куплет, возле ручья звучал припев, а у большого камня светлячки кружились в знакомом ритме.

Когда друзья дошли до поворота, Топа вспомнил последнюю ноту и заметил корзинку под широким листом. Он обрадовался, но говорил тихо, чтобы не тревожить утренний лес. Вместе они отнесли листья к норке и закончили песню совсем спокойно. Топа поблагодарил {{HERO}}: вчерашний выбор превратился в общую память, которая помогла найти дорогу. Лес ещё немного слушал знакомую мелодию, а потом мягко затих.`,
} as const

const isRuBedtime57 = (context: NormalizedStoryContext) =>
  context.language === 'ru' && context.ageGroup === '5-7' && context.storyMood === 'bedtime'

type MagicGardenLanguage = 'ru' | 'uz'

const getMagicGardenLanguage = (context: NormalizedStoryContext): MagicGardenLanguage | null => {
  if (context.stylePackId !== 'magic_garden') return null
  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null
  return context.language === 'ru' || context.language === 'uz' ? context.language : null
}

type SpaceBedtimeLanguage = 'ru' | 'uz'

const getSpaceBedtimeLanguage = (context: NormalizedStoryContext): SpaceBedtimeLanguage | null => {
  if (context.stylePackId !== 'stars_and_space') return null
  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null
  return context.language === 'ru' || context.language === 'uz' ? context.language : null
}

const isCozyForestReference = (context: NormalizedStoryContext) =>
  isRuBedtime57(context) && context.stylePackId === 'cozy_forest'

const isSpaceReference = (context: NormalizedStoryContext) =>
  isRuBedtime57(context) && context.stylePackId === 'stars_and_space'

const branchFromChoice = (choiceId: string) => choiceId === 'choice-a' || choiceId === 'path_a'
  ? 'choice-a'
  : choiceId === 'choice-b' || choiceId === 'path_b'
    ? 'choice-b'
    : null

export const referenceEpisodeOneStory = (
  context: NormalizedStoryContext,
  fallbackText: string,
): string => {
  const magicLanguage = getMagicGardenLanguage(context)
  const spaceLanguage = getSpaceBedtimeLanguage(context)

  if (isCozyForestReference(context)) return cozyForestEpisodeOneRu
  if (spaceLanguage) return spaceBedtimeEpisodeOne[spaceLanguage]
  if (isSpaceReference(context)) return spaceEpisodeOneRu
  if (magicLanguage) return magicGardenEpisodeOne[magicLanguage]
  return fallbackText
}

export const referenceContinuationStory = (
  context: NormalizedStoryContext,
  choiceId: string,
  fallbackText: string,
): string => {
  const branch = branchFromChoice(choiceId)
  const magicLanguage = getMagicGardenLanguage(context)
  const spaceLanguage = getSpaceBedtimeLanguage(context)

  if (!branch) return fallbackText
  if (isCozyForestReference(context)) return cozyForestContinuationRu[branch]
  if (spaceLanguage) return spaceBedtimeContinuation[spaceLanguage][branch]
  if (isSpaceReference(context)) return spaceContinuationRu[branch]
  if (magicLanguage) return magicGardenContinuation[magicLanguage][branch]
  return fallbackText
}

export const referenceEpisodeTitle = (
  context: NormalizedStoryContext,
  fallbackTitle: string,
): string => {
  const magicLanguage = getMagicGardenLanguage(context)
  const spaceLanguage = getSpaceBedtimeLanguage(context)

  if (spaceLanguage) {
    if (!context.isContinuation) return spaceBedtimeTitle[spaceLanguage].one
    const branch = branchFromChoice(context.choiceHistory[context.choiceHistory.length - 1]?.choice_id ?? '')
    return branch === 'choice-b' ? spaceBedtimeTitle[spaceLanguage].b : spaceBedtimeTitle[spaceLanguage].a
  }

  if (magicLanguage) {
    if (!context.isContinuation) return magicGardenTitle[magicLanguage].one
    const branch = branchFromChoice(context.choiceHistory[context.choiceHistory.length - 1]?.choice_id ?? '')
    return branch === 'choice-b' ? magicGardenTitle[magicLanguage].b : magicGardenTitle[magicLanguage].a
  }

  if (!isSpaceReference(context)) return fallbackTitle
  if (!context.isContinuation) return 'Маяк над станцией «Люмен»'

  const choiceId = context.choiceHistory[context.choiceHistory.length - 1]?.choice_id
  return choiceId === 'choice-b' || choiceId === 'path_b'
    ? 'Созвездие «Дорога домой»'
    : 'Золотой сигнал для лунной почты'
}
