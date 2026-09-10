import type { CandidatePatch, Language, NormalizedStoryContext } from './contracts.ts'
import { referenceContinuationStory } from './storyCoreReference.ts'

type Localized = Record<Language, string>
type BranchId = 'a' | 'b'

type BranchCopy = {
  effect: Localized
  resolution: Localized
  seed: Localized
  continuation: Localized
  friend: Localized
  friendId: string
  artifact: Localized
}

export type FallbackChoiceMemory = {
  effectSummary: string
  resolutionText: string
  tomorrowSeed: string
  statePatch: CandidatePatch
}

export type FallbackContinuationMemory = {
  storyText: string
  statePatch: CandidatePatch
}

const localized = (ru: string, uz: string, kz: string): Localized => ({ ru, uz, kz })

const cozyForest: Record<BranchId, BranchCopy> = {
  a: {
    effect: localized(
      'Фонарики вдоль тропинки помогли маленьким зверятам спокойно добраться до старого пенька.',
      'Yo‘l bo‘ylab yoqilgan chiroqlar kichik hayvonlarga eski to‘nkagacha xotirjam yetib borishga yordam berdi.',
      'Соқпақ бойындағы шамдар кішкентай аңдарға ескі томарға тыныш жетуге көмектесті.',
    ),
    resolution: localized(
      '{{HERO}} зажёг первый фонарик у развилки, потом второй у мокрой берёзы и третий рядом с большим камнем. Друзья не побежали вперёд: они проверяли каждый новый огонёк вместе. Черепаха шла первой, чтобы никто не торопился, кролики держались рядом, а Нура перелетала с ветки на ветку и смотрела, всем ли видно дорогу. У ручья один фонарик отразился в воде, и зверята сразу узнали знакомый поворот. Так выбранный путь действительно изменил их вечер: вместо сомнений появилась цепочка понятных тёплых знаков. Когда впереди показался старый пенёк, друзья поняли, что теперь спокойно дойдут до своих домиков.',
      '{{HERO}} birinchi chiroqni chorrahada, ikkinchisini nam qayin yonida, uchinchisini esa katta tosh oldida yoqdi. Do‘stlar oldinga yugurmadi: har bir yangi chiroqni birga tekshirib bordi. Toshbaqa hech kim shoshilmasligi uchun oldinda yurdi, quyonchalar uning yonida qoldi, Nura esa shoxdan shoxga uchib, yo‘l hammaga ko‘rinayotganini kuzatdi. Ariq yonida bir chiroq suvda aks etdi va hayvonchalar tanish burilishni darrov bildi. Tanlov oqshomni aniq o‘zgartirdi: ikkilanish o‘rniga yo‘l bo‘ylab tushunarli iliq belgilar paydo bo‘ldi. Uzoqda eski to‘nka ko‘ringanda, do‘stlar endi uylariga xotirjam yetib borishini bildi.',
      '{{HERO}} шамдарды бір-бірлеп жақты. Жылы жарық жапырақтарға түсіп, достар ескі томарға сенімді жетті. Нұра үкі бұтақтан жай ғана басын изеді.',
    ),
    seed: localized(
      'У старого пенька остался один тёплый фонарик. Утром он покажет, кому ещё нужна помощь.',
      'Eski to‘nka yonida bitta iliq chiroq qoldi. Ertalab u yana kimga yordam kerakligini ko‘rsatadi.',
      'Ескі томар жанында бір жылы шам қалды. Таңертең ол тағы кімге көмек керегін көрсетеді.',
    ),
    continuation: localized(
      'Утром у старого пенька всё ещё светился тот самый фонарик. Сова Нура позвала {{HERO}} пройти по освещённой тропинке. Свет вывел друзей к маленькому бельчонку, который не мог найти дорогу домой. Они проводили его до знакомого дерева и вернулись к пеньку. Фонарик стал светить тише, будто понял, что его работа закончена. Лес снова устроился на спокойный отдых.',
      'Ertalab eski to‘nka yonida o‘sha chiroq hali ham yonib turardi. Boyqush Nura {{HERO}}ni yoritilgan yo‘ldan yurishga chaqirdi. Nur uyiga yo‘l topolmay qolgan kichik olmaxonga olib bordi. Do‘stlar uni tanish daraxtgacha kuzatib qo‘ydi va to‘nkaga qaytdi. Chiroq sekinroq porlay boshladi, go‘yo vazifasi tugaganini bilgandek. O‘rmon yana sokin dam oldi.',
      'Таңертең ескі томар жанында сол шам әлі жанып тұрды. Нұра үкі {{HERO}}ті жарық соқпақпен жүруге шақырды. Жарық үйіне жол таба алмай қалған кішкентай тиінге алып келді. Достар оны таныс ағашқа дейін шығарып салып, томарға қайтты. Шам міндеті аяқталғанын түсінгендей бәсеңдей түсті. Орман қайтадан тыныш демалды.',
    ),
    friend: localized('сова Нура', 'boyqush Nura', 'Нұра үкі'),
    friendId: 'owl_nura',
    artifact: localized('тёплый фонарик', 'iliq chiroq', 'жылы шам'),
  },
  b: {
    effect: localized(
      'Тихая песня собрала лесных друзей рядом и помогла им спокойно завершить вечер вместе.',
      'Sokin qo‘shiq o‘rmon do‘stlarini bir joyga yig‘ib, oqshomni birga xotirjam yakunlashga yordam berdi.',
      'Баяу ән орман достарын бір жерге жинап, кешті бірге тыныш аяқтауға көмектесті.',
    ),
    resolution: localized(
      '{{HERO}} запел негромко и медленно, повторяя простую строчку, которую легко было услышать даже у ручья. Нура ответила коротким свистом, а ёжик Топа подхватил последние слова. Друзья двинулись по тропинке в одном ритме: когда песня становилась тише, все останавливались и ждали черепаху, а затем снова шли вместе. Светлячки держались над группой мягким облачком, поэтому никто не отделялся от остальных. У знакомого камня кролики уже сами напевали мелодию и улыбались. Выбор сработал именно потому, что помог друзьям слышать друг друга. Когда впереди показались первые окна домиков, песня стала совсем тихой, как спокойное пожелание доброй ночи.',
      '{{HERO}} past va sekin kuylab, ariq yonidan ham eshitiladigan oddiy satrni takrorladi. Nura qisqa hushtak bilan javob berdi, tipratikan Topa esa oxirgi so‘zlarni ilib oldi. Do‘stlar bir xil ritmda yo‘lga tushdi: qo‘shiq pasayganda hamma to‘xtab toshbaqani kutdi, keyin yana birga yurdi. Yorug‘qo‘ng‘izlar guruh ustida mayin bulut bo‘lib uchdi, shuning uchun hech kim boshqalardan ajralib qolmadi. Tanish tosh yoniga kelganda quyonchalar ham kuyga qo‘shilib, jilmayardi. Tanlov aynan do‘stlarga bir-birini eshitishga yordam bergani uchun ishladi. Uzoqda uylarning birinchi derazalari ko‘ringanda, qo‘shiq juda sekinlashib, xayrli tun tilagidek yangradi.',
      '{{HERO}} жай әрі баяу ән айтты. Жарқырауықтар соқпақ үстінде қалқып тұрды, Топа кірпі жақындады, ал үкі төменгі бұтақтан тыңдады. Кеш ерекше жылы болды.',
    ),
    seed: localized(
      'Сова запомнила мелодию, а ёжик Топа тихо напевал её по дороге домой. Утром песня снова поможет друзьям.',
      'Boyqush kuyini eslab qoldi, tipratikan Topa esa uyga ketayotib uni sekin xirgoyi qildi. Ertalab qo‘shiq do‘stlarga yana yordam beradi.',
      'Үкі әуенді есте сақтады, ал Топа кірпі үйіне бара жатып оны жай ғана ыңылдады. Таңертең ән достарға қайта көмектеседі.',
    ),
    continuation: localized(
      'Утром с нижней ветки прозвучала вчерашняя мелодия. Ёжик Топа не мог найти свою корзинку с мягкими листьями, но знакомая песня помогла друзьям собраться и вспомнить вечерний путь. {{HERO}} запел первый куплет, сова Нура ответила вторым, и вскоре корзинка нашлась у поворота. Друзья отнесли листья к норке и закончили песню совсем тихо. Лес слушал ещё немного, а потом спокойно затих.',
      'Ertalab pastki shoxdan kechagi kuy eshitildi. Tipratikan Topa yumshoq barglar solingan savatini topolmay qoldi, ammo tanish qo‘shiq do‘stlarni yig‘ib, kechagi yo‘lni eslashga yordam berdi. {{HERO}} birinchi bandni kuyladi, boyqush Nura ikkinchi band bilan javob berdi va savat burilish yonidan topildi. Do‘stlar barglarni inga olib borib, qo‘shiqni juda sekin tugatdi. O‘rmon yana biroz tingladi va keyin sokinlashdi.',
      'Таңертең төменгі бұтақтан кешегі әуен естілді. Топа кірпі жұмсақ жапырақ салынған себетін таба алмай қалды, бірақ таныс ән достарды жинап, кешкі жолды еске түсіруге көмектесті. {{HERO}} бірінші шумақты айтты, Нұра үкі екінші шумақпен жауап берді, көп ұзамай себет бұрылыс маңынан табылды. Достар жапырақтарды інге апарып, әнді өте жай аяқтады. Орман тағы біраз тыңдап, кейін тынышталды.',
    ),
    friend: localized('ёжик Топа', 'tipratikan Topa', 'Топа кірпі'),
    friendId: 'hedgehog_topa',
    artifact: localized('тихая мелодия', 'sokin kuy', 'баяу әуен'),
  },
}

const branchIdFromChoice = (choiceId: string): BranchId | null => {
  if (choiceId === 'choice-a' || choiceId === 'path_a') return 'a'
  if (choiceId === 'choice-b' || choiceId === 'path_b') return 'b'
  return null
}

const genericChoiceCopy = (
  language: Language,
  choiceText: string,
): Pick<FallbackChoiceMemory, 'effectSummary' | 'resolutionText' | 'tomorrowSeed'> => {
  if (language === 'ru') {
    return {
      effectSummary: `Выбор «${choiceText}» помог друзьям и оставил в мире заметный добрый след.`,
      resolutionText: `{{HERO}} выбрал: «${choiceText}». Друзья увидели результат и спокойно завершили начатое дело вместе.`,
      tomorrowSeed: `Мир запомнил выбор «${choiceText}». В следующей истории его последствие станет заметно сразу.`,
    }
  }
  if (language === 'uz') {
    return {
      effectSummary: `«${choiceText}» tanlovi do‘stlarga yordam berdi va dunyoda aniq mehribon iz qoldirdi.`,
      resolutionText: `{{HERO}} «${choiceText}» yo‘lini tanladi. Do‘stlar natijani ko‘rib, boshlangan ishni birga sokin tugatdi.`,
      tomorrowSeed: `Dunyo «${choiceText}» tanlovini eslab qoldi. Keyingi hikoyada uning natijasi darhol ko‘rinadi.`,
    }
  }
  return {
    effectSummary: `«${choiceText}» таңдауы достарға көмектесіп, әлемде анық мейірімді із қалдырды.`,
    resolutionText: `{{HERO}} «${choiceText}» жолын таңдады. Достар нәтижесін көріп, басталған істі бірге тыныш аяқтады.`,
    tomorrowSeed: `Әлем «${choiceText}» таңдауын есте сақтады. Келесі оқиғада оның салдары бірден көрінеді.`,
  }
}

const choicePatch = (
  context: NormalizedStoryContext,
  choiceId: string,
  friend: string | null,
  relationshipKey: string | null,
  artifact: string | null,
): CandidatePatch => ({
  last_event: choiceId,
  new_friend: friend,
  hero_trait: 'kind_and_attentive',
  open_arc: `continue-${context.stylePackId}-${choiceId}`,
  relationship_updates: relationshipKey
    ? [{ key: relationshipKey, value: 'trust_started_through_choice' }]
    : [{ key: 'friends', value: 'trust_increased' }],
  canon_updates: [
    { key: 'last_choice', value: choiceId },
    ...(artifact ? [{ key: 'remembered_artifact', value: artifact }] : []),
  ],
})

const closedContinuationPatch = (
  choiceId: string,
  friend: string | null,
  relationshipKey: string | null,
  artifact: string | null,
): CandidatePatch => ({
  last_event: `continued_${choiceId}`,
  new_friend: friend,
  hero_trait: 'kind_and_attentive',
  open_arc: null,
  relationship_updates: relationshipKey
    ? [{ key: relationshipKey, value: 'trust_strengthened_by_remembered_choice' }]
    : [{ key: 'friends', value: 'trust_strengthened_by_remembered_choice' }],
  canon_updates: [
    { key: 'remembered_choice', value: choiceId },
    ...(artifact ? [{ key: 'remembered_artifact', value: artifact }] : []),
  ],
})

export const fallbackChoiceMemory = (
  context: NormalizedStoryContext,
  choiceId: string,
  choiceText: string,
): FallbackChoiceMemory => {
  const branchId = branchIdFromChoice(choiceId)
  const branch = context.stylePackId === 'cozy_forest' && branchId
    ? cozyForest[branchId]
    : null

  if (branch) {
    return {
      effectSummary: branch.effect[context.language],
      resolutionText: branch.resolution[context.language],
      tomorrowSeed: branch.seed[context.language],
      statePatch: choicePatch(
        context,
        choiceId,
        branch.friend[context.language],
        branch.friendId,
        branch.artifact[context.language],
      ),
    }
  }

  const generic = genericChoiceCopy(context.language, choiceText)
  return {
    ...generic,
    statePatch: choicePatch(context, choiceId, null, null, choiceText),
  }
}

export const fallbackContinuationMemory = (
  context: NormalizedStoryContext,
): FallbackContinuationMemory => {
  const latestChoice = context.choiceHistory[context.choiceHistory.length - 1]
  const choiceId = latestChoice?.choice_id || 'continued_saved_choice'
  const branchId = branchIdFromChoice(choiceId)
  const branch = context.stylePackId === 'cozy_forest' && branchId
    ? cozyForest[branchId]
    : null

  if (branch && latestChoice) {
    const friend = branch.friend[context.language]
    const artifact = branch.artifact[context.language]
    return {
      storyText: referenceContinuationStory(context, choiceId, branch.continuation[context.language]),
      statePatch: closedContinuationPatch(choiceId, friend, branch.friendId, artifact),
    }
  }

  const remembered = latestChoice?.tomorrow_seed || latestChoice?.effect_summary || latestChoice?.choice_text || ''
  const rememberedPrefix = remembered ? `${remembered} ` : ''
  const continuation = context.language === 'ru'
    ? `Утром последствие выбора стало заметно сразу. ${rememberedPrefix}{{HERO}} узнал знакомый след, помог друзьям завершить начатое дело и спокойно вернулся в уютное место.`
    : context.language === 'uz'
      ? `Ertalab tanlov natijasi darhol ko‘rindi. ${rememberedPrefix}{{HERO}} tanish izni ko‘rib, do‘stlariga ishni tugatishda yordam berdi va shinam joyga qaytdi.`
      : `Таңертең таңдаудың салдары бірден көрінді. ${rememberedPrefix}{{HERO}} таныс ізді көріп, достарына істі аяқтауға көмектесті де, жайлы жерге оралды.`

  return {
    storyText: continuation.trim(),
    statePatch: closedContinuationPatch(choiceId, null, null, latestChoice?.choice_text || null),
  }
}
