import { magicGardenContinuation } from './storyMagicGardenBedtime.ts'

type Language = 'ru' | 'uz'
type Branch = 'choice-a' | 'choice-b'

const closedCoda: Record<Language, Record<Branch, string>> = {
  ru: {
    'choice-a': `Когда на небе появились ещё две звезды, работа в саду уже была закончена. Мирай пожелала всем доброй ночи, Лило спрятала голову под крыло, а {{HERO}} ещё немного посидел у фонтана. Лунные цветы медленно сложили лепестки, вода стала почти неслышной, и маленький голубой листочек у фонтана перестал качаться. Сад больше ни о чём не просил. Он просто отдыхал после спокойного вечера, а друзья знали: цветам помогли, дорожка снова видна, и теперь можно идти спать.`,
    'choice-b': `Когда тихая песня закончилась, саду больше ничего не требовалось. Лунные цветы один за другим сложили лепестки, светлячки приглушили огоньки, а фонтан зазвучал едва слышно. {{HERO}} посидел рядом с Лило и Мирай ещё одну спокойную минуту. Потом друзья попрощались с садом и направились домой по восстановленной лепестковой дорожке. За спиной оставался только мягкий свет чаши. Вечерняя задача была закончена, все нужные огоньки стояли на своих местах, и Волшебный сад тихо засыпал.`,
  },
  uz: {
    'choice-a': `Osmonda yana ikki yulduz ko‘ringanda, bog‘dagi ish allaqachon tugagan edi. Miroy hammaga xayrli tun tiladi, Lilo boshini qanoti ostiga yashirdi, {{HERO}} esa favvora yonida yana bir oz o‘tirdi. Oy gullari gulbarglarini sekin yopdi, suvning ovozi deyarli eshitilmay qoldi, favvora yonidagi kichik moviy yaproq ham qimirlamay qoldi. Bog‘ endi hech narsa so‘ramasdi. Gullarga yordam berildi, yo‘lak yana ko‘rinar edi, endi do‘stlar xotirjam uyquga ketishi mumkin edi.`,
    'choice-b': `Sokin kuy tugagach, bog‘ga boshqa hech narsa kerak emasdi. Oy gullari birin-ketin gulbarglarini yopdi, yorug‘qo‘ng‘izlar chiroqlarini xiralashtirdi, favvoraning ovozi esa juda mayin bo‘lib qoldi. {{HERO}} Lilo va Miroy bilan yana bir tinch daqiqa yonma-yon o‘tirdi. Keyin do‘stlar bog‘ bilan xayrlashib, qayta tiklangan gulbargli yo‘lakdan uy tomon yurdi. Orqada faqat kosaning yumshoq nuri qoldi. Kechki vazifa tugagan, barcha chiroqlar o‘z joyida, Sehrli bog‘ esa sekin uyquga cho‘mardi.`,
  },
}

const replaceFinalParagraph = (story: string, coda: string) => {
  const paragraphs = story.trim().split(/\n\s*\n/u).filter(Boolean)
  return [...paragraphs.slice(0, -1), coda].join('\n\n')
}

export const magicGardenBedtimeArcContinuation: Record<Language, Record<Branch, string>> = {
  ru: {
    'choice-a': replaceFinalParagraph(magicGardenContinuation.ru['choice-a'], closedCoda.ru['choice-a']),
    'choice-b': replaceFinalParagraph(magicGardenContinuation.ru['choice-b'], closedCoda.ru['choice-b']),
  },
  uz: {
    'choice-a': replaceFinalParagraph(magicGardenContinuation.uz['choice-a'], closedCoda.uz['choice-a']),
    'choice-b': replaceFinalParagraph(magicGardenContinuation.uz['choice-b'], closedCoda.uz['choice-b']),
  },
}
