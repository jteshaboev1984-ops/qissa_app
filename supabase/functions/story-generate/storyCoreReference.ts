import type { NormalizedStoryContext } from './contracts.ts'
import { bedtimeEpisodeOneExpansion } from './storyBedtimeExpansion.ts'
import { cozyForestBedtimeContinuation, cozyForestBedtimeEpisodeOne } from './storyCozyForestBedtime.ts'
import { cozyForestBedtimeArcContinuation } from './storyCozyForestBedtimeArc.ts'
import { magicGardenContinuation, magicGardenEpisodeOne, magicGardenTitle } from './storyMagicGardenBedtime.ts'
import { spaceBedtimeContinuation, spaceBedtimeEpisodeOne, spaceBedtimeTitle } from './storySpaceBedtime.ts'

type ClosedBetaLanguage = 'ru' | 'uz'
type ClosedBetaWorld = 'cozy_forest' | 'magic_garden' | 'stars_and_space'
type Branch = 'choice-a' | 'choice-b'

const getClosedBetaLanguage = (
  context: NormalizedStoryContext,
  stylePackId: ClosedBetaWorld,
): ClosedBetaLanguage | null => {
  if (context.stylePackId !== stylePackId) return null
  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null
  return context.language === 'ru' || context.language === 'uz' ? context.language : null
}

const branchFromChoice = (choiceId: string): Branch | null => choiceId === 'choice-a' || choiceId === 'path_a'
  ? 'choice-a'
  : choiceId === 'choice-b' || choiceId === 'path_b'
    ? 'choice-b'
    : null

const preChoiceReflection: Record<ClosedBetaWorld, Record<ClosedBetaLanguage, string>> = {
  cozy_forest: {
    ru: `После этой короткой остановки всё стало понятнее. Друзья уже знали, где находятся, и никто не волновался. Теперь оставалось просто выбрать самый удобный способ пройти знакомую дорогу вместе. {{HERO}} посмотрел на сонных зверят и понял, что решение должно помочь каждому, даже самому медленному.`,
    uz: `Shu qisqa damdan keyin hamma narsa aniqroq bo‘ldi. Do‘stlar qayerda turganini bilardi, hech kim xavotirlanmasdi. Endi tanish yo‘lni birga bosib o‘tishning eng qulay usulini tanlash kerak edi. {{HERO}} uyqusi kelayotgan hayvonchalarga qarab, qaror eng sekin yuradigan do‘stga ham yordam berishi kerakligini tushundi.`,
  },
  magic_garden: {
    ru: `Теперь {{HERO}} понимал, что саду не нужна новая загадка или большое приключение. Одна небольшая забота могла вернуть цветам их спокойный вечерний порядок. Вода и свет действовали по-разному, но оба пути вели к одной цели: помочь лунным цветам раскрыться и снова увидеть свою дорожку.`,
    uz: `Endi {{HERO}} bog‘ga yangi jumboq yoki katta sarguzasht kerak emasligini tushundi. Bitta kichik g‘amxo‘rlik oy gullariga sokin kechki tartibini qaytarishi mumkin edi. Suv va nur turlicha yordam berardi, ammo ikkala yo‘lning maqsadi bir edi: gullarni ochish va gulbargli yo‘lakni yana ko‘rsatish.`,
  },
  stars_and_space: {
    ru: `После проверки карты задача стала совсем ясной. Капсула была исправна, станция двигалась спокойно, а облако пыли можно было обойти. Нужно было только выбрать один понятный знак и довести его до конца. {{HERO}} больше не думал о двух разных приключениях: это были два способа помочь одной и той же лунной почте найти дорогу к «Люмену».`,
    uz: `Xaritani tekshirgach, vazifa aniq bo‘ldi. Kapsula soz edi, bekat sokin harakatlanardi, chang bulutini esa aylanib o‘tish mumkin edi. Faqat bitta tushunarli belgini tanlab, ishni oxirigacha yetkazish kerak edi. {{HERO}} endi ikki xil sarguzasht haqida emas, oy pochtasini «Lyumen»ga olib keladigan ikki usul haqida o‘ylardi.`,
  },
}

// A short, plot-bearing pause before the choice raises the deterministic beta
// stories above the bare five-minute floor without padding. Each beat reinforces
// the one existing goal, gives a bedtime-sized sensory pause, and makes the
// choice feel earned rather than merely delayed.
const sixMinutePreChoiceBeat: Record<ClosedBetaWorld, Record<ClosedBetaLanguage, string>> = {
  cozy_forest: {
    ru: `Перед тем как двинуться дальше, {{HERO}} предложил проверить, все ли готовы. Белка крепче взялась за корзинку, кролики встали рядом с черепахой, чтобы не уйти вперёд, а Нура посмотрела на тропу с нижней ветки. Вдалеке уже виднелись тёплые окна лесных домиков. Осталось не искать новое приключение, а спокойно довести друзей до этих огоньков.`,
    uz: `Yo‘lga tushishdan oldin {{HERO}} hamma tayyormi, deb so‘radi. Olmaxon savatini mahkamroq ushladi, quyonchalar toshbaqadan oldinga ketib qolmaslik uchun uning yoniga turdi, Nura esa past shoxdan yo‘lga qaradi. Uzoqda o‘rmon uylarining iliq derazalari ko‘rinardi. Endi yangi sarguzasht izlash emas, do‘stlarni shu chiroqlargacha xotirjam olib borish kerak edi.`,
  },
  magic_garden: {
    ru: `Перед решением {{HERO}} ещё раз прошёл взглядом от фонтана до последнего цветка. Лепестковая дорожка никуда не исчезла — ей просто не хватало заботы, чтобы снова стать заметной. Мирай поправила маленький камешек у края клумбы, Лило устроилась на ветке, а вода в фонтане успокоилась. Сад словно ждал одного простого действия, после которого вечер снова пойдёт своим тихим порядком.`,
    uz: `Tanlovdan oldin {{HERO}} favvoradan eng oxirgi gulgacha yana bir bor qarab chiqdi. Gulbargli yo‘lak yo‘qolmagan edi, unga yana ko‘rinish uchun ozgina g‘amxo‘rlik yetishmasdi. Miroy gulzor chetidagi kichik toshni to‘g‘riladi, Lilo shoxga joylashdi, favvoradagi suv ham tinchidi. Bog‘ go‘yo kechki sokin tartibni qaytaradigan bitta oddiy ishni kutayotgandek edi.`,
  },
  stars_and_space: {
    ru: `Пико уменьшил карту до одной спокойной линии маршрута. На ней было видно, как капсула медленно приближается к станции и сколько времени остаётся до стыковочного окна. {{HERO}} проверил, что оба выбранных инструмента работают исправно, а затем выключил лишние сигналы на панели. В рубке стало тише. Теперь требовалось не спасать весь космос, а помочь одной почтовой капсуле завершить знакомый путь.`,
    uz: `Piko xaritani bitta sokin yo‘nalish chizig‘igacha kichraytirdi. Unda kapsulaning bekatga asta yaqinlashayotgani va ulanish vaqtigacha qancha qolganini ko‘rish mumkin edi. {{HERO}} ikkala asbob ham sozligini tekshirib, paneldagi ortiqcha signallarni o‘chirdi. Boshqaruv xonasi tinchidi. Endi butun koinotni qutqarish emas, bitta pochta kapsulasiga tanish yo‘lini tugatishga yordam berish kerak edi.`,
  },
}

const sixMinuteClosingBeat: Record<ClosedBetaWorld, Record<ClosedBetaLanguage, string>> = {
  cozy_forest: {
    ru: `Когда последний зверёк оказался у своего домика, {{HERO}} и Нура неспешно пошли обратно к развилке. Теперь она выглядела совсем обычной: на влажных листьях лежал лунный свет, ручей ровно шептал за кустами, а в окнах один за другим гасли огоньки. Нура тихо сказала, что сегодня никто не остался один на дороге. {{HERO}} улыбнулся, пожелал лесу доброй ночи и тоже направился отдыхать.`,
    uz: `Oxirgi hayvoncha ham uyiga yetgach, {{HERO}} va Nura chorraha tomon sekin qaytdi. Endi u juda oddiy ko‘rinardi: nam barglarda oy nuri yotar, butalar ortidagi ariq bir maromda shivirlar, derazalardagi chiroqlar esa bittadan o‘chardi. Nura bu oqshom yo‘lda hech kim yolg‘iz qolmaganini sekin aytdi. {{HERO}} jilmayib, o‘rmonga xayrli tun tiladi va o‘zi ham dam olishga ketdi.`,
  },
  magic_garden: {
    ru: `Перед уходом {{HERO}} оглянулся на сад ещё раз. Лепестковая дорожка мягко светлела между клумбами, и теперь по ней можно было пройти, не торопясь и не сбиваясь. Мирай закрыла маленькую калитку, Лило устроилась поудобнее, а фонтан оставил только самый тихий плеск. Всё, ради чего друзья пришли сюда вечером, было сделано. {{HERO}} пожелал саду доброй ночи и ушёл домой в спокойной тишине.`,
    uz: `Ketishdan oldin {{HERO}} bog‘ga yana bir bor qaradi. Gulbargli yo‘lak gulzorlar orasida mayin ko‘rinib turar, endi undan shoshmasdan va adashmasdan yurish mumkin edi. Miroy kichik darvozani yopdi, Lilo qulayroq joylashdi, favvora esa faqat juda mayin shovullab qoldi. Do‘stlar bu yerga kechqurun nima uchun kelgan bo‘lsa, hammasi bajarildi. {{HERO}} bog‘ga xayrli tun tilab, sokinlik ichida uyga yo‘l oldi.`,
  },
  stars_and_space: {
    ru: `Когда почтовая капсула наконец пристыковалась, на панели загорелась одна маленькая зелёная точка. Пико убрал карту, а {{HERO}} ещё немного посмотрел в окно на медленно уходящую ночную Землю. Письма теперь были на станции и утром отправятся дальше своим адресатам. В рубке погасли лишние лампы, остался только мягкий дежурный свет. Задача была закончена, космос никуда не спешил, и «Люмен» спокойно продолжил свой ночной круг.`,
    uz: `Pochta kapsulasi nihoyat bekatga ulanganda, panelda bitta kichik yashil nuqta yondi. Piko xaritani yopdi, {{HERO}} esa oynadan asta uzoqlashayotgan tungi Yerga yana bir oz qaradi. Xatlar endi bekatda edi va ertalab o‘z manzillariga yo‘l olardi. Boshqaruv xonasidagi ortiqcha chiroqlar o‘chib, faqat mayin navbatchi nuri qoldi. Vazifa tugagan, koinot hech qayerga shoshmas, «Lyumen» esa tungi aylanishini sokin davom ettirardi.`,
  },
}

const magicGardenClosedCoda: Record<ClosedBetaLanguage, Record<Branch, string>> = {
  ru: {
    'choice-a': `Когда на небе появились ещё две звезды, работа в саду уже была закончена. Мирай пожелала всем доброй ночи, Лило спрятала голову под крыло, а {{HERO}} ещё немного посидел у фонтана. Лунные цветы медленно сложили лепестки, вода стала почти неслышной, и маленький голубой листочек у фонтана перестал качаться. Сад больше ни о чём не просил. Он просто отдыхал после спокойного вечера, а друзья знали: цветам помогли, дорожка снова видна, и теперь можно идти спать.`,
    'choice-b': `Когда тихая песня закончилась, саду больше ничего не требовалось. Лунные цветы один за другим сложили лепестки, светлячки приглушили огоньки, а фонтан зазвучал едва слышно. {{HERO}} посидел рядом с Лило и Мирай ещё одну спокойную минуту. Потом друзья попрощались с садом и направились домой по восстановленной лепестковой дорожке. За спиной оставался только мягкий свет чаши. Вечерняя задача была закончена, все нужные огоньки стояли на своих местах, и Волшебный сад тихо засыпал.`,
  },
  uz: {
    'choice-a': `Osmonda yana ikki yulduz ko‘ringanda, bog‘dagi ish allaqachon tugagan edi. Miroy hammaga xayrli tun tiladi, Lilo boshini qanoti ostiga yashirdi, {{HERO}} esa favvora yonida yana bir oz o‘tirdi. Oy gullari gulbarglarini sekin yopdi, suvning ovozi deyarli eshitilmay qoldi, favvora yonidagi kichik moviy yaproq ham qimirlamay qoldi. Bog‘ endi hech narsa so‘ramasdi. Gullarga yordam berildi, yo‘lak yana ko‘rinar edi, endi do‘stlar xotirjam uyquga ketishi mumkin edi.`,
    'choice-b': `Sokin kuy tugagach, bog‘ga boshqa hech narsa kerak emasdi. Oy gullari birin-ketin gulbarglarini yopdi, yorug‘qo‘ng‘izlar chiroqlarini xiralashtirdi, favvoraning ovozi esa juda mayin bo‘lib qoldi. {{HERO}} Lilo va Miroy bilan yana bir tinch daqiqa yonma-yon o‘tirdi. Keyin do‘stlar bog‘ bilan xayrlashib, qayta tiklangan gulbargli yo‘lakdan uy tomon yurdi. Orqada faqat kosaning yumshoq nuri qoldi. Kechki vazifa tugagan, barcha chiroqlar o‘z joyida, Sehrli bog‘ esa sekin uyquga cho‘mardi.`,
  },
}

const withoutRepeatedChoiceParagraph = (text: string) => {
  const paragraphs = text.trim().split(/\n\s*\n/u).filter(Boolean)
  return paragraphs.length > 1 ? paragraphs.slice(0, -1) : paragraphs
}

const replaceFinalParagraph = (story: string, replacement: string) => {
  const paragraphs = story.trim().split(/\n\s*\n/u).filter(Boolean)
  return [...paragraphs.slice(0, -1), replacement].join('\n\n')
}

const appendClosingBeat = (
  story: string,
  world: ClosedBetaWorld,
  language: ClosedBetaLanguage,
) => `${story.trim()}\n\n${sixMinuteClosingBeat[world][language]}`

const withoutChoiceMeta = (text: string, language: ClosedBetaLanguage) => language === 'ru'
  ? text.replace(' Лес был готов запомнить любой из этих выборов.', '')
  : text.replace(' O‘rmon esa bu kechadagi tanlovni eslab qolishga tayyor edi.', '')

const withBedtimeExpansion = (
  baseStory: string,
  world: ClosedBetaWorld,
  language: ClosedBetaLanguage,
) => {
  const baseParagraphs = baseStory.trim().split(/\n\s*\n/u).filter(Boolean)
  const finalChoiceParagraph = baseParagraphs.pop() ?? ''
  const expansionParagraphs = withoutRepeatedChoiceParagraph(bedtimeEpisodeOneExpansion[world][language])

  return [
    ...baseParagraphs,
    ...expansionParagraphs,
    preChoiceReflection[world][language],
    sixMinutePreChoiceBeat[world][language],
    withoutChoiceMeta(finalChoiceParagraph, language),
  ].filter(Boolean).join('\n\n')
}

export const referenceEpisodeOneStory = (
  context: NormalizedStoryContext,
  fallbackText: string,
): string => {
  const cozyLanguage = getClosedBetaLanguage(context, 'cozy_forest')
  const magicLanguage = getClosedBetaLanguage(context, 'magic_garden')
  const spaceLanguage = getClosedBetaLanguage(context, 'stars_and_space')

  if (cozyLanguage) return withBedtimeExpansion(cozyForestBedtimeEpisodeOne[cozyLanguage], 'cozy_forest', cozyLanguage)
  if (magicLanguage) return withBedtimeExpansion(magicGardenEpisodeOne[magicLanguage], 'magic_garden', magicLanguage)
  if (spaceLanguage) return withBedtimeExpansion(spaceBedtimeEpisodeOne[spaceLanguage], 'stars_and_space', spaceLanguage)
  return fallbackText
}

export const referenceContinuationStory = (
  context: NormalizedStoryContext,
  choiceId: string,
  fallbackText: string,
): string => {
  const branch = branchFromChoice(choiceId)
  if (!branch) return fallbackText

  const cozyLanguage = getClosedBetaLanguage(context, 'cozy_forest')
  const magicLanguage = getClosedBetaLanguage(context, 'magic_garden')
  const spaceLanguage = getClosedBetaLanguage(context, 'stars_and_space')

  if (cozyLanguage) {
    return appendClosingBeat(
      cozyForestBedtimeArcContinuation[cozyLanguage][branch],
      'cozy_forest',
      cozyLanguage,
    )
  }
  if (magicLanguage) {
    const closedStory = replaceFinalParagraph(
      magicGardenContinuation[magicLanguage][branch],
      magicGardenClosedCoda[magicLanguage][branch],
    )
    return appendClosingBeat(closedStory, 'magic_garden', magicLanguage)
  }
  if (spaceLanguage) {
    return appendClosingBeat(
      spaceBedtimeContinuation[spaceLanguage][branch],
      'stars_and_space',
      spaceLanguage,
    )
  }
  return fallbackText
}

export const referenceEpisodeTitle = (
  context: NormalizedStoryContext,
  fallbackTitle: string,
): string => {
  const magicLanguage = getClosedBetaLanguage(context, 'magic_garden')
  const spaceLanguage = getClosedBetaLanguage(context, 'stars_and_space')

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

  return fallbackTitle
}
