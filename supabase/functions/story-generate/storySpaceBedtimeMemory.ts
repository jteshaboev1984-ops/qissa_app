import type { CandidatePatch, NormalizedStoryContext } from './contracts.ts'

type SpaceLanguage = 'ru' | 'uz'
type BranchId = 'choice-a' | 'choice-b'

type ChoiceMemory = {
  effectSummary: string
  resolutionText: string
  tomorrowSeed: string
  statePatch: CandidatePatch
}

const spaceLanguage = (context: NormalizedStoryContext): SpaceLanguage | null => {
  if (context.stylePackId !== 'stars_and_space') return null
  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null
  return context.language === 'ru' || context.language === 'uz' ? context.language : null
}

const text = {
  'choice-a': {
    ru: {
      effect: 'Золотой маяк снова нашёл лунную почту и оставил на окне три тёплых отблеска.',
      resolution: '{{HERO}} повернул первое световое кольцо, затем второе и сделал луч широким и мягким, чтобы он не слепил капсулу. Пико следил за картой и называл расстояние до стыковочного окна. Через несколько секунд капсула ответила тремя маленькими огоньками и изменила курс. Она шла не прямо: сначала обогнула край облака звёздной пыли, потом выровнялась по золотому сигналу. {{HERO}} не трогал настройки, пока Пико не подтвердил, что маршрут устойчив. Так выбор превратился в настоящее решение задачи: маяк дал почте знакомый ориентир и спокойно довёл её до безопасного коридора станции. Когда на панели появилась ровная зелёная линия, друзья приглушили яркость маяка до ночного режима.',
      seed: 'Три золотых отблеска останутся на окне и помогут продолжить путь лунной почты.',
      artifact: 'три золотых отблеска маяка',
      friend: 'робот Пико',
    },
    uz: {
      effect: 'Oltin mayoq oy pochtasini yana topdi va oynada uchta iliq shu’la qoldirdi.',
      resolution: '{{HERO}} birinchi yorug‘lik halqasini, keyin ikkinchisini burib, kapsulani ko‘zni qamashtirmaydigan keng va mayin nur bilan yo‘naltirdi. Piko xaritani kuzatib, ulanish oynasigacha qolgan masofani aytib turdi. Bir necha soniyadan keyin kapsula uchta kichik chiroq bilan javob berib, yo‘nalishini o‘zgartirdi. U to‘g‘ri kelmadi: avval yulduz changi bulutining chetini aylanib o‘tdi, keyin oltin signal bo‘yicha tekislandi. Piko yo‘l barqarorligini tasdiqlamaguncha {{HERO}} sozlamalarga tegmadi. Shu tariqa tanlov muammoning haqiqiy yechimiga aylandi: mayoq pochtaga tanish belgi berib, uni bekatning xavfsiz yo‘lagigacha olib keldi. Panelda tekis yashil chiziq paydo bo‘lgach, do‘stlar mayoqni tungi rejimgacha xiralashtirdi.',
      seed: 'Uchta oltin shu’la oynada qoladi va oy pochtasining yo‘lini davom ettirishga yordam beradi.',
      artifact: 'mayoqning uchta oltin shu’lasi',
      friend: 'robot Piko',
    },
  },
  'choice-b': {
    ru: {
      effect: 'Новая линия созвездия стала тихой картой для серебряной капсулы.',
      resolution: '{{HERO}} выбрал на карте четыре спокойные звезды и соединил их в простую фигуру птицы, крыло которой указывало в сторону станции. Пико проверил, что рисунок хорошо виден с курса капсулы, и убрал все лишние линии. Серебряная капсула заметила новый знак, мигнула один раз и начала плавный поворот. На карте было видно, как она обходит тёмное облако звёздной пыли именно по нарисованной дорожке. У последней звезды {{HERO}} добавил короткий световой штрих к стыковочному окну. Выбор стал не украшением, а рабочей картой: каждый участок созвездия помогал сделать следующий безопасный шаг. Когда капсула вышла на прямой курс, Пико сохранил рисунок в атласе, а остальные линии экрана медленно погасли.',
      seed: 'Звёздная птица останется в атласе и покажет продолжение дороги домой.',
      artifact: 'созвездие «Дорога домой»',
      friend: 'робот Пико',
    },
    uz: {
      effect: 'Yangi yulduz turkumi kumush kapsula uchun sokin xaritaga aylandi.',
      resolution: '{{HERO}} xaritada to‘rtta sokin yulduzni tanlab, ularni qanoti bekat tomon yo‘nalgan oddiy qush shakliga birlashtirdi. Piko rasm kapsula yo‘lidan yaxshi ko‘rinishini tekshirib, ortiqcha chiziqlarni o‘chirdi. Kumush kapsula yangi belgini ko‘rib, bir marta miltilladi va asta burila boshladi. Xaritada uning qorong‘i yulduz changi bulutini aynan chizilgan yo‘l bo‘ylab aylanib o‘tayotgani ko‘rindi. Oxirgi yulduz yonida {{HERO}} ulanish oynasiga olib boradigan qisqa yorug‘ chiziq qo‘shdi. Tanlov bezak emas, ishlaydigan xaritaga aylandi: yulduz turkumining har bir qismi keyingi xavfsiz qadamni ko‘rsatdi. Kapsula to‘g‘ri yo‘lga chiqqach, Piko rasmni atlasga saqladi, ekrandagi boshqa chiziqlar esa asta o‘chdi.',
      seed: 'Yulduz qushi atlasda qoladi va uyga qaytish yo‘lining davomini ko‘rsatadi.',
      artifact: '«Uyga yo‘l» yulduz turkumi',
      friend: 'robot Piko',
    },
  },
} as const

const patch = (
  choiceId: BranchId,
  language: SpaceLanguage,
): CandidatePatch => ({
  last_event: choiceId,
  new_friend: text[choiceId][language].friend,
  hero_trait: 'patient_and_curious',
  open_arc: `continue-stars_and_space-${choiceId}`,
  relationship_updates: [{
    key: 'robot_piko',
    value: 'trust_started_through_shared_navigation',
  }],
  canon_updates: [
    { key: 'last_choice', value: choiceId },
    { key: 'remembered_artifact', value: text[choiceId][language].artifact },
  ],
})

export const spaceBedtimeChoiceMemory = (
  context: NormalizedStoryContext,
  choiceId: string,
): ChoiceMemory | null => {
  const language = spaceLanguage(context)
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
