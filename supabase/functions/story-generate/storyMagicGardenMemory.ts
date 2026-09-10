import type { CandidatePatch, NormalizedStoryContext } from './contracts.ts'

type MagicLanguage = 'ru' | 'uz'
type BranchId = 'choice-a' | 'choice-b'

type ChoiceMemory = {
  effectSummary: string
  resolutionText: string
  tomorrowSeed: string
  statePatch: CandidatePatch
}

const magicLanguage = (context: NormalizedStoryContext): MagicLanguage | null => {
  if (context.stylePackId !== 'magic_garden') return null
  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null
  return context.language === 'ru' || context.language === 'uz' ? context.language : null
}

const text = {
  'choice-a': {
    ru: {
      effect: 'У лунных цветов появились голубые капли, которые показали дорогу к тихой беседке.',
      resolution: '{{HERO}} начал с самого сухого места и поливал землю маленькими кругами, чтобы вода не стекала мимо корней. Мирай показывала, где почва уже стала тёмной и прохладной, а Лило перелетала к следующему цветку. Сначала раскрылся один бутон, затем второй, и вскоре голубые капли появились на целой линии лепестков. Друзья увидели прямой результат выбора: вода вернула цветам силы, а дорожка снова стала различимой от фонтана до маленькой калитки. Они прошли вдоль неё ещё раз и убедились, что ни один цветок не остался в сухой земле. Только после этого {{HERO}} поставил лейку рядом с фонтаном, а сад начал постепенно затихать.',
      seed: 'Голубые капли останутся на дорожке и приведут друзей к семечку спокойного сна.',
      artifact: 'голубые капли на лепестковой дорожке',
      friend: 'улитка Мирай',
    },
    uz: {
      effect: 'Oy gullarida ko‘k tomchilar paydo bo‘lib, sokin ayvon tomon yo‘l ko‘rsatdi.',
      resolution: '{{HERO}} eng quruq joydan boshlab, suv ildizlardan chetga oqib ketmasligi uchun tuproqni kichik doiralar bilan sug‘ordi. Miroy qaysi joy allaqachon qorayib, salqinlashganini ko‘rsatdi, Lilo esa keyingi gul tomon uchdi. Avval bitta g‘uncha, keyin ikkinchisi ochildi va tez orada ko‘k tomchilar butun gulbargli yo‘lak bo‘ylab ko‘rindi. Do‘stlar tanlovning aniq natijasini ko‘rdi: suv gullarga kuch qaytardi, yo‘lak esa favvoradan kichik darvozagacha yana ravshan bo‘ldi. Ular yo‘lak bo‘ylab yana bir marta yurib, hech bir gul quruq tuproqda qolmaganini tekshirdi. Shundan keyingina {{HERO}} sug‘orgichni favvora yoniga qo‘ydi, bog‘ esa asta tinchlana boshladi.',
      seed: 'Ko‘k tomchilar yo‘lakda qoladi va do‘stlarni sokin uyqu urug‘i tomon boshlab boradi.',
      artifact: 'gulbargli yo‘lakdagi ko‘k tomchilar',
      friend: 'shilliqqurt Miroy',
    },
  },
  'choice-b': {
    ru: {
      effect: 'Светлячки превратили потерянный узор в тихую вечернюю карту.',
      resolution: '{{HERO}} поставил чашу у первого поворота лепестковой дорожки и прикрыл ладонью слишком яркий край. Светлячки поднялись не все сразу: несколько остались у чаши, другие выстроились дальше, показывая следующий участок пути. Мирай прошла за этой мягкой цепочкой и заметила, как лунные цветы один за другим поворачиваются к свету. Лило перенесла чашу чуть ближе к фонтану, и рисунок продолжился до самой калитки. Выбранный свет не просто украсил сад: он снова связал отдельные клумбы в понятную дорожку. Друзья проверили её от начала до конца, поправили один сбившийся огонёк и только потом остановились. Светлячки стали мерцать медленнее, а фонтан звучал всё тише.',
      seed: 'Светлая цепочка останется у фонтана и приведёт друзей к колыбельной светлячков.',
      artifact: 'светлая цепочка у фонтана',
      friend: 'птица Лило',
    },
    uz: {
      effect: 'Yorug‘qo‘ng‘izlar yo‘qolgan naqshni sokin kechki xaritaga aylantirdi.',
      resolution: '{{HERO}} kosani gulbargli yo‘lakning birinchi burilishiga qo‘yib, juda yorqin chetini kafti bilan to‘sdi. Yorug‘qo‘ng‘izlar birdaniga emas, asta ko‘tarildi: bir nechtasi kosa yonida qoldi, boshqalari esa yo‘lning keyingi qismini ko‘rsatib saf tortdi. Miroy shu mayin zanjir ortidan yurib, oy gullari birin-ketin nur tomon burilayotganini ko‘rdi. Lilo kosani favvoraga yaqinroq surdi va naqsh kichik darvozagacha davom etdi. Tanlangan nur bog‘ni shunchaki bezamadi: u alohida gulzorlarni yana tushunarli yo‘lakka birlashtirdi. Do‘stlar yo‘lni boshidan oxirigacha tekshirib, bitta adashgan chiroqni joyiga qo‘ydi. Shundan keyin yorug‘qo‘ng‘izlar sekinroq miltillay boshladi, favvoraning ovozi esa pasaydi.',
      seed: 'Yorug‘ zanjir favvora yonida qoladi va do‘stlarni yorug‘qo‘ng‘izlar allasi tomon boshlab boradi.',
      artifact: 'favvora yonidagi yorug‘ zanjir',
      friend: 'Lilo qushi',
    },
  },
} as const

const patch = (
  choiceId: BranchId,
  language: MagicLanguage,
): CandidatePatch => ({
  last_event: choiceId,
  new_friend: text[choiceId][language].friend,
  hero_trait: 'calm_and_caring',
  open_arc: `continue-magic_garden-${choiceId}`,
  relationship_updates: [{
    key: choiceId === 'choice-a' ? 'snail_miroy' : 'bird_lilo',
    value: 'trust_started_through_gentle_help',
  }],
  canon_updates: [
    { key: 'last_choice', value: choiceId },
    { key: 'remembered_artifact', value: text[choiceId][language].artifact },
  ],
})

export const magicGardenChoiceMemory = (
  context: NormalizedStoryContext,
  choiceId: string,
): ChoiceMemory | null => {
  const language = magicLanguage(context)
  if (!language) return null
  if (choiceId !== 'choice-a' && choiceId !== 'choice-b') return null

  const copy = text[choiceId][language]
  return {
    effectSummary: copy.effect,
    resolutionText: copy.resolution,
    tomorrowSeed: copy.seed,
    statePatch: patch(choiceId, language),
  }
}
