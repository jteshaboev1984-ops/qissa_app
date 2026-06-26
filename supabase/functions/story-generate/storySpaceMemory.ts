import type { Language } from './contracts.ts'

type Localized = Record<Language, string>
export type SpaceBranchId = 'a' | 'b'

export type SpaceBranchMemory = {
  effect: Localized
  resolution: Localized
  seed: Localized
  friend: Localized
  friendId: string
  artifact: Localized
  fallbackContinuation: Localized
}

const localized = (ru: string, uz: string, kz: string): Localized => ({ ru, uz, kz })

export const spaceBranches: Record<SpaceBranchId, SpaceBranchMemory> = {
  a: {
    effect: localized(
      'Золотой маяк снова засиял над станцией и показал лунной почте дорогу к причалу.',
      'Oltin mayoq yana porlab, oy pochtasiga bekat yo‘lini ko‘rsatdi.',
      'Алтын шамшырақ қайта жанып, ай поштасына станса жолын көрсетті.',
    ),
    resolution: localized(
      '{{HERO}} медленно повернул три световых кольца. Их лучи встретились над станцией, и в темноте появилась ровная золотая дорожка. Робот Пико радостно поднял маленький ключ настройки.',
      '{{HERO}} uchta yorug‘lik halqasini sekin burdi. Nurlar bekat ustida uchrashib, qorong‘ida oltin yo‘l paydo bo‘ldi. Robot Piko sozlash kalitini quvonib ko‘tardi.',
      '{{HERO}} үш жарық сақинасын баяу бұрды. Сәулелер станса үстінде тоғысып, қараңғыда алтын жол пайда болды. Пико робот баптау кілтін қуана көтерді.',
    ),
    seed: localized(
      'Маяк оставил на стекле три золотых отблеска. На следующем витке они помогут лунной почте узнать станцию.',
      'Mayoq oynada uchta oltin shu’la qoldirdi. Keyingi aylanishda ular oy pochtasiga bekatni tanishga yordam beradi.',
      'Шамшырақ әйнекте үш алтын сәуле қалдырды. Келесі айналымда олар ай поштасына стансаны тануға көмектеседі.',
    ),
    friend: localized('робот Пико', 'robot Piko', 'Пико робот'),
    friendId: 'robot_piko',
    artifact: localized('золотой сигнал маяка', 'mayoqning oltin signali', 'шамшырақтың алтын белгісі'),
    fallbackContinuation: localized(
      'На следующем витке знакомый золотой луч помог почтовой капсуле найти станцию. {{HERO}} и робот Пико встретили её у причала и бережно разобрали письма.',
      'Keyingi aylanishda tanish oltin nur pochta kapsulasiga bekatni topishga yordam berdi. {{HERO}} va robot Piko uni kutib olib, xatlarni ehtiyotkorlik bilan joyladi.',
      'Келесі айналымда таныс алтын сәуле пошта капсуласына стансаны табуға көмектесті. {{HERO}} пен Пико робот оны қарсы алып, хаттарды ұқыпты орналастырды.',
    ),
  },
  b: {
    effect: localized(
      'Новая линия созвездия стала небесной дорожкой, по которой лунная почта увидела станцию.',
      'Yangi yulduz turkumi oy pochtasi bekatni topadigan osmon yo‘liga aylandi.',
      'Жаңа шоқжұлдыз ай поштасы стансаны табатын аспан жолына айналды.',
    ),
    resolution: localized(
      '{{HERO}} соединил семь спокойных звёзд. На карте появилась птица с раскрытыми крыльями, а серебряная капсула мягко повернула к станции. Робот Пико сохранил рисунок в атласе.',
      '{{HERO}} yetti sokin yulduzni birlashtirdi. Xaritada qanotlari ochilgan qush paydo bo‘ldi, kumush kapsula esa bekat tomon burildi. Robot Piko rasmni atlasga saqladi.',
      '{{HERO}} жеті тыныш жұлдызды қосты. Картада қанатын жайған құс пайда болып, күміс капсула стансаға бұрылды. Пико робот суретті атласқа сақтады.',
    ),
    seed: localized(
      'Звёздная птица осталась на карте. На следующем витке её новое крыло покажет обходной путь.',
      'Yulduz qushi xaritada qoldi. Keyingi aylanishda uning yangi qanoti aylanma yo‘lni ko‘rsatadi.',
      'Жұлдыз құс картада қалды. Келесі айналымда оның жаңа қанаты айналма жолды көрсетеді.',
    ),
    friend: localized('робот Пико', 'robot Piko', 'Пико робот'),
    friendId: 'robot_piko',
    artifact: localized('созвездие «Дорога домой»', '«Uyga yo‘l» yulduz turkumi', '«Үйге жол» шоқжұлдызы'),
    fallbackContinuation: localized(
      'На следующем витке знакомое созвездие показало почтовой капсуле обходной путь. {{HERO}} и робот Пико добавили к звёздной птице ещё одно светлое крыло.',
      'Keyingi aylanishda tanish yulduz turkumi pochta kapsulasiga aylanma yo‘l ko‘rsatdi. {{HERO}} va robot Piko yulduz qushiga yana bir yorug‘ qanot qo‘shdi.',
      'Келесі айналымда таныс шоқжұлдыз пошта капсуласына айналма жол көрсетті. {{HERO}} пен Пико робот жұлдыз құсына тағы бір жарық қанат қосты.',
    ),
  },
}
