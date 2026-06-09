// Local deterministic mock Story Agent implementation (no network/model calls).
// NOTE: Return payload shape intentionally mirrors future backend/edge function contract outputs.
import { stylePacks } from '../data/stylePacks'
import type { StoryGenerationInput, StoryGenerationOutput } from '../contracts/agentContracts'
import type { Episode, EpisodeChoice, Language, OnboardingSelections, SeriesState, VocabularyItem } from '../types/qissa'
import { runEpisodeSafetyCheck } from './safetyAgent'

const heroByType: Record<OnboardingSelections['heroType'], Record<Language, string>> = {
  girl_hero: { ru: 'девочка Алия', uz: 'qizaloq Aliya', kz: 'Алия есімді қыз' },
  boy_hero: { ru: 'мальчик Тимур', uz: 'o‘g‘il bola Timur', kz: 'Тимур есімді ұл' },
  animal: { ru: 'маленький снежный барс', uz: 'kichik qor barsi', kz: 'кішкентай қар барысы' },
  magical_hero: { ru: 'добрый звёздный проводник', uz: 'mehribon yulduz yo‘lboshchi', kz: 'мейірімді жұлдыз жетекші' },
  custom: { ru: 'юный герой', uz: 'kichik qahramon', kz: 'жас кейіпкер' },
}

function polishStoryText(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed

  const capitalized = trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1)
  return /[.!?…]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

function vocabularyFor(language: Language): VocabularyItem[] {
  if (language === 'ru') {
    return [
      { word: 'фонарик', translation: 'flashlight', example: 'Фонарик мягко осветил тропинку.', sourceLanguage: 'ru', targetLanguage: 'en' },
      { word: 'бережно', translation: 'carefully', example: 'Герой бережно помог ростку.', sourceLanguage: 'ru', targetLanguage: 'en' },
      { word: 'дружба', translation: 'friendship', example: 'Дружба сделала путь легче.', sourceLanguage: 'ru', targetLanguage: 'en' },
    ]
  }

  return []
}


type WorldTemplate = {
  intro: Record<Language, string>
  choiceA: Record<Language, { text: string; effect: string; resolution: string; seed: string; icon: string; friend?: string }>
  choiceB: Record<Language, { text: string; effect: string; resolution: string; seed: string; icon: string; friend?: string }>
  episodeTwo: Record<Language, { a: string; b: string; fallback: string }>
}

const worldTemplates: Record<OnboardingSelections['stylePackId'], WorldTemplate> = {
  cozy_forest: { intro: { ru: 'Вечером в лесу мерцали фонарики, шуршали листья и мягко светились светлячки.', uz: 'Kechqurun o‘rmonda chiroqlar miltilladi, barglar shivirladi.', kz: 'Кешке орманда шамдар жылтырап, жапырақтар сыбдырлады.' }, choiceA: { ru: { text: 'Зажечь фонарики вдоль лесной тропинки', effect: 'Тропинка станет понятной и спокойной для маленьких друзей.', resolution: 'Герой зажёг фонарики вдоль тропинки. Тёплый свет лёг на листья, и маленькие зверята спокойнее нашли путь к тёплому пеньку. Сова тихо кивнула с ветки, а светлячки мягко закружились рядом.', seed: 'У старого пенька остался один огонёк. В следующий раз он подскажет новое доброе место в лесу.', icon: '🏮', friend: 'сова Нура' }, uz: { text: 'O‘rmon yo‘liga mayin chiroqlar yoqish', effect: 'Kichik do‘stlar yo‘lni xotirjam topadi.', resolution: 'Qahramon yo‘l bo‘ylab chiroqlar yoqdi. Barglar ustiga iliq nur tushdi va kichik do‘stlar xotirjam yetib olishdi.', seed: 'Eski dumaloq to‘nkada bitta mayin chiroq qoldi. Keyingi safar u yangi yo‘lni ko‘rsatadi.', icon: '🏮' }, kz: { text: 'Орман соқпағына жұмсақ шамдар жағу', effect: 'Кішкентай достар жолды сенімді табады.', resolution: 'Кейіпкер соқпақ бойына шам жақты. Жапырақтарға жылы жарық түсіп, кішкентай достар жайлы жетті.', seed: 'Ескі томар қасында бір шам жанып қалды. Келесі жолы ол жаңа ізді көрсетеді.', icon: '🏮' } }, choiceB: { ru: { text: 'Спеть тихую песню лесным друзьям', effect: 'Спокойная песня соберёт друзей рядом.', resolution: 'Герой тихо запел, и лес стал спокойнее. Светлячки зависли над тропой, маленький ёжик подошёл ближе, а сова слушала с нижней ветки. Вечер стал особенно тёплым.', seed: 'Сова запомнила мелодию. В следующий раз она позовёт героя туда, где песня снова поможет.', icon: '🎵', friend: 'ёжик Топа' }, uz: { text: 'O‘rmon do‘stlariga sokin qo‘shiq aytish', effect: 'Mayin qo‘shiq do‘stlarni birlashtiradi.', resolution: 'Qahramon sokin qo‘shiq aytdi va o‘rmon tinchidi. Do‘stlar yaqinlashib, birga yo‘lni davom ettirishdi.', seed: 'Kichik boyqush kuyini eslab qoldi. Keyingi safar u qahramonni yangi joyga chorlaydi.', icon: '🎵' }, kz: { text: 'Орман достарына баяу ән айту', effect: 'Жұмсақ әуен достарды жақындатады.', resolution: 'Кейіпкер баяу ән айтты да, орман тынышталды. Достар жақындап, жолды бірге жалғастырды.', seed: 'Кішкентай үкі әуенді есте сақтады. Келесі жолы ол кейіпкерді жаңа орынға шақырады.', icon: '🎵' } }, episodeTwo: { ru: { a: 'Утром лесная тропинка ещё мягко светилась: фонарики всё ещё тихо светили.', b: 'Утром в лесу тихо звучала знакомая мелодия: вчерашняя песня всё ещё согревала друзей.', fallback: 'Утром лес встретил героя тёпло: у вчерашнего выбора остался тёплый след.' }, uz: { a: 'Ertalab o‘rmon yo‘li hali ham mayin yoritilgan edi: kechagi iz hali sezilib turardi.', b: 'Ertalab o‘rmonda tanish qo‘shiq mayin yangradi: kechagi iz hali sezilib turardi.', fallback: 'Ertalab o‘rmon qahramonni iliq kutib oldi: tanlovdan mayin iz qoldi.' }, kz: { a: 'Таңертең орман соқпағы әлі де жұмсақ жарықтанып тұрды: кешегі із әлі сезіліп тұрды.', b: 'Таңертең орманда таныс әуен жай естілді: кешегі із әлі сезіліп тұрды.', fallback: 'Таңертең орман кейіпкерді жылы қарсы алды: таңдаудан жылы із қалды.' } } },
  magic_garden: undefined as any,
  silk_road: undefined as any,
  stars_and_space: undefined as any,
  animal_world: undefined as any,
  sea_islands: undefined as any,
  castle_mystery: undefined as any,
  brave_adventure: undefined as any,
}

type SimpleWorldId = Exclude<OnboardingSelections['stylePackId'], 'cozy_forest'>

const simpleWorldTemplates: Record<SimpleWorldId, WorldTemplate> = {
  magic_garden: {
    intro: {
      ru: 'В Волшебном саду вечер лёг на лепестковые дорожки. У фонтана тихо светились лунные цветы, а над травой кружили маленькие золотые искры.',
      uz: 'Sehrli bog‘da oqshom gulbargli yo‘lakchalarga tushdi. Favvora yonida oy gullari mayin porladi.',
      kz: 'Сиқырлы бақта кеш жапырақты жолақтарға жайылды. Субұрқақ жанында ай гүлдері жұмсақ жарқырады.',
    },
    choiceA: {
      ru: { text: 'Полить лунный цветник', effect: 'Цветы расправят лепестки и осветят дорожку.', resolution: 'Герой бережно полил лунный цветник. Лепестки раскрылись один за другим, и вдоль дорожки появился мягкий серебристый свет. Маленькая бабочка села рядом и будто поблагодарила крыльями.', seed: 'У самого высокого цветка осталась капля света. Завтра она покажет новую садовую тропинку.', icon: '🌸', friend: 'лунная бабочка' },
      uz: { text: 'Oy gullariga suv quyish', effect: 'Gullar ochilib, yo‘lakni mayin yoritadi.', resolution: 'Qahramon oy gullariga ehtiyotkorlik bilan suv quydi. Gulbarglar ochilib, yo‘lak bo‘ylab kumushrang nur paydo bo‘ldi.', seed: 'Eng baland gulda kichik nur tomchisi qoldi. Ertaga u yangi yo‘lni ko‘rsatadi.', icon: '🌸' },
      kz: { text: 'Ай гүлдерін суару', effect: 'Гүлдер ашылып, жолақты жұмсақ жарықтандырады.', resolution: 'Кейіпкер ай гүлдерін абайлап суарды. Жапырақтар ашылып, жолақ бойында күміс жарық пайда болды.', seed: 'Ең биік гүлде кішкентай жарық тамшысы қалды. Ертең ол жаңа жолды көрсетеді.', icon: '🌸' },
    },
    choiceB: {
      ru: { text: 'Поставить светлячковую чашу', effect: 'Искры соберутся в тёплый круг для друзей.', resolution: 'Герой поставил светлячковую чашу у края фонтана. Искры мягко собрались над ней, и сад стал похож на тихую комнату под открытым небом. Друзья подошли ближе, чтобы погреться в этом свете.', seed: 'В чаше осталась одна золотая искра. Завтра она первой проснётся и позовёт героя к новому месту сада.', icon: '🫧', friend: 'садовый светлячок' },
      uz: { text: 'Yaltiragan chiroq kosasini qo‘yish', effect: 'Uchqunlar do‘stlar uchun iliq doira hosil qiladi.', resolution: 'Qahramon favvora chetiga chiroqli kosa qo‘ydi. Uchqunlar uning ustida muloyim yig‘ildi va bog‘ yanada sokin bo‘ldi.', seed: 'Kosada bitta oltin uchqun qoldi. Ertaga u qahramonni bog‘ning yangi joyiga chaqiradi.', icon: '🫧' },
      kz: { text: 'Жарқыраған шам тостағанын қою', effect: 'Ұшқындар достар үшін жылы шеңбер құрады.', resolution: 'Кейіпкер субұрқақ жанына шам тостағанын қойды. Ұшқындар оның үстіне жай жиналып, бақ бұрынғыдан тыныш бола түсті.', seed: 'Тостағанда бір алтын ұшқын қалды. Ертең ол кейіпкерді бақтың жаңа орнына шақырады.', icon: '🫧' },
    },
    episodeTwo: {
      ru: { a: 'Утром у лунного цветка ещё держалась светлая капля. Она дрогнула на лепестке и показала узкую тропинку между кустами жасмина.', b: 'Утром золотая искра в чаше тихо проснулась. Она поднялась над фонтаном и осветила маленькую калитку в глубине сада.', fallback: 'Утром в саду остался мягкий свет вчерашнего вечера. Он ждал героя у первой лепестковой дорожки.' },
      uz: { a: 'Ertalab oy guli bargida nur tomchisi hali ham turardi. U jasmin butalari orasidagi tor yo‘lni ko‘rsatdi.', b: 'Ertalab kosadagi oltin uchqun uyg‘ondi. U favvora ustiga ko‘tarilib, bog‘ ichidagi kichik eshikni yoritdi.', fallback: 'Ertalab bog‘da kechagi oqshomdan mayin nur qoldi.' },
      kz: { a: 'Таңертең ай гүлі жапырағында жарық тамшысы әлі тұрды. Ол жасмин бұталары арасындағы тар жолды көрсетті.', b: 'Таңертең тостағандағы алтын ұшқын оянды. Ол субұрқақ үстіне көтеріліп, бақ ішіндегі кішкентай қақпаны жарықтандырды.', fallback: 'Таңертең бақта кешегі жұмсақ жарық қалды.' },
    },
  },

  silk_road: {
    intro: {
      ru: 'У караванной стоянки вечер пах тёплым хлебом, пылью дороги и свежим чаем. На тканых навесах тихо мерцали узоры.',
      uz: 'Karvon to‘xtagan joyda oqshom iliq non, yo‘l changi va yangi choy hidiga to‘ldi.',
      kz: 'Керуен тоқтаған жерде кеш жылы нан, жол шаңы және жаңа шай иісіне толды.',
    },
    choiceA: {
      ru: { text: 'Зажечь караванный фонарь', effect: 'Стоянка станет светлее для поздних путников.', resolution: 'Герой зажёг караванный фонарь у края стоянки. Мягкий свет лёг на узорные ковры, и поздние путники сразу нашли дорогу к чаю и отдыху.', seed: 'На стекле фонаря проявился маленький узор. Завтра он подскажет, куда караван повернёт дальше.', icon: '🏺', friend: 'верблюжонок Бота' },
      uz: { text: 'Karvon chirog‘ini yoqish', effect: 'Kech kelgan yo‘lovchilar yo‘lni oson topadi.', resolution: 'Qahramon karvon chirog‘ini yoqdi. Mayin nur naqshli gilamlarga tushdi va yo‘lovchilar dam olish joyini topishdi.', seed: 'Chiroq oynasida kichik naqsh ko‘rindi. Ertaga u karvon yo‘lini ko‘rsatadi.', icon: '🏺' },
      kz: { text: 'Керуен шамын жағу', effect: 'Кеш келген жолаушылар жолды оңай табады.', resolution: 'Кейіпкер керуен шамын жақты. Жұмсақ жарық өрнекті кілемдерге түсіп, жолаушылар демалатын орынды тапты.', seed: 'Шам әйнегінде кішкентай өрнек көрінді. Ертең ол керуен жолын көрсетеді.', icon: '🏺' },
    },
    choiceB: {
      ru: { text: 'Развернуть карту узоров', effect: 'Друзья увидят спокойный путь через пески.', resolution: 'Герой развернул карту узоров на низком столике. Линии на карте мягко сложились в дорогу, а старый мастер улыбнулся: теперь путь стал понятнее и спокойнее.', seed: 'Один синий узор остался светиться на краю карты. Завтра он укажет новую остановку каравана.', icon: '🗺️', friend: 'мастер Рустам' },
      uz: { text: 'Naqshli xaritani ochish', effect: 'Do‘stlar qumlar orasidagi tinch yo‘lni ko‘radi.', resolution: 'Qahramon naqshli xaritani past stol ustiga yoydi. Chiziqlar yo‘lga aylandi va hamma keyingi manzilni ko‘rdi.', seed: 'Xarita chetida ko‘k naqsh porlab qoldi. Ertaga u yangi bekatni ko‘rsatadi.', icon: '🗺️' },
      kz: { text: 'Өрнекті картаны ашу', effect: 'Достар құм арасындағы тыныш жолды көреді.', resolution: 'Кейіпкер өрнекті картаны аласа үстелге жайды. Сызықтар жолға айналып, бәрі келесі бағытты көрді.', seed: 'Карта шетінде көк өрнек жарқырап қалды. Ертең ол жаңа аялдаманы көрсетеді.', icon: '🗺️' },
    },
    episodeTwo: {
      ru: { a: 'Утром на стекле караванного фонаря сиял маленький узор. Он был похож на поворот дороги к тихому городу за барханами.', b: 'Утром синий узор на карте стал ярче. Он потянулся тонкой линией к новой стоянке, где уже ждали тёплый чай и добрые вести.', fallback: 'Утром караванная стоянка проснулась спокойно. На ковре оставался узор, который звал героя в дорогу.' },
      uz: { a: 'Ertalab karvon chirog‘i oynasida kichik naqsh porladi. U sokin shaharga boradigan burilishga o‘xshardi.', b: 'Ertalab xaritadagi ko‘k naqsh yanada yorqinlashdi. U yangi bekatga tomon ingichka chiziq bo‘lib cho‘zildi.', fallback: 'Ertalab karvon joyi sokin uyg‘ondi.' },
      kz: { a: 'Таңертең керуен шамының әйнегінде кішкентай өрнек жарқырады. Ол тыныш қалаға бұрылыс сияқты еді.', b: 'Таңертең картадағы көк өрнек анық жарқырады. Ол жаңа аялдамаға қарай жіңішке сызық болып созылды.', fallback: 'Таңертең керуен орны тыныш оянды.' },
    },
  },

  stars_and_space: {
    intro: {
      ru: 'Над звёздной станцией медленно плыли тихие планеты. В иллюминаторе мягко сияла Луна, а маленький робот держал серебряную карту неба.',
      uz: 'Yulduz bekati ustida sokin sayyoralar sekin suzdi. Deraza ortida Oy mayin yoritdi.',
      kz: 'Жұлдыз бекеті үстінде тыныш ғаламшарлар баяу қалқып жүрді. Терезе сыртында Ай жұмсақ жарқырады.',
    },
    choiceA: {
      ru: { text: 'Настроить звёздный маяк', effect: 'Маяк поможет маленьким кораблям найти станцию.', resolution: 'Герой настроил звёздный маяк. Луч поднялся над станцией спокойно и ровно, и маленькие корабли на дальних орбитах увидели дорогу домой.', seed: 'В луче маяка осталась серебряная точка. Завтра она покажет новую звезду на карте.', icon: '⭐', friend: 'робот Нури' },
      uz: { text: 'Yulduz mayog‘ini sozlash', effect: 'Mayoq kichik kemalarga bekatni topishga yordam beradi.', resolution: 'Qahramon yulduz mayog‘ini sozladi. Nur bekat ustiga sokin ko‘tarildi va uzoqdagi kichik kemalar uy yo‘lini ko‘rdi.', seed: 'Mayoq nurida kumush nuqta qoldi. Ertaga u xaritada yangi yulduzni ko‘rsatadi.', icon: '⭐' },
      kz: { text: 'Жұлдыз шамшырағын баптау', effect: 'Шамшырақ кішкентай кемелерге бекетті табуға көмектеседі.', resolution: 'Кейіпкер жұлдыз шамшырағын баптады. Сәуле бекет үстіне тыныш көтеріліп, алыстағы кішкентай кемелер үй жолын көрді.', seed: 'Шамшырақ сәулесінде күміс нүкте қалды. Ертең ол картадан жаңа жұлдызды көрсетеді.', icon: '⭐' },
    },
    choiceB: {
      ru: { text: 'Сложить новую созвездную линию', effect: 'На карте появится спокойный знак для друзей.', resolution: 'Герой соединил три тихие звезды на карте. Они сложились в мягкую линию, похожую на улыбку, и робот Нури бережно сохранил новый знак.', seed: 'Созвездная линия осталась мерцать у края карты. Завтра она приведёт героя к маленькой синей планете.', icon: '🌙', friend: 'робот Нури' },
      uz: { text: 'Yangi yulduz chizig‘ini tuzish', effect: 'Xaritada do‘stlar uchun sokin belgi paydo bo‘ladi.', resolution: 'Qahramon xaritada uchta sokin yulduzni bog‘ladi. Ular tabassumga o‘xshash mayin chiziqqa aylandi.', seed: 'Yulduz chizig‘i xarita chetida miltillab qoldi. Ertaga u qahramonni kichik ko‘k sayyoraga olib boradi.', icon: '🌙' },
      kz: { text: 'Жаңа жұлдыз сызығын құрау', effect: 'Картада достарға арналған тыныш белгі пайда болады.', resolution: 'Кейіпкер картада үш тыныш жұлдызды қосты. Олар күлімсіреуге ұқсайтын жұмсақ сызыққа айналды.', seed: 'Жұлдыз сызығы карта шетінде жымыңдап қалды. Ертең ол кейіпкерді кішкентай көк ғаламшарға апарады.', icon: '🌙' },
    },
    episodeTwo: {
      ru: { a: 'Утром серебряная точка в луче маяка стала ярче. Она указала на новую звезду, которая тихо ждала на краю карты.', b: 'Утром созвездная линия мягко мерцала. Её край тянулся к маленькой синей планете, где уже зажёгся приветственный огонёк.', fallback: 'Утром звёздная станция светилась спокойно. На карте остался знак, который звал героя дальше.' },
      uz: { a: 'Ertalab mayoq nuridagi kumush nuqta yorqinlashdi. U xarita chetida kutayotgan yangi yulduzni ko‘rsatdi.', b: 'Ertalab yulduz chizig‘i mayin miltilladi. Uning cheti kichik ko‘k sayyoraga cho‘zildi.', fallback: 'Ertalab yulduz bekati sokin yoritildi.' },
      kz: { a: 'Таңертең шамшырақ сәулесіндегі күміс нүкте жарығырақ болды. Ол карта шетінде күткен жаңа жұлдызды көрсетті.', b: 'Таңертең жұлдыз сызығы жұмсақ жымыңдады. Оның шеті кішкентай көк ғаламшарға созылды.', fallback: 'Таңертең жұлдыз бекеті тыныш жарқырады.' },
    },
  },

  animal_world: {
    intro: {
      ru: 'На тёплой поляне собирались звери: снежный барс лежал у камня, черепаха дремала в траве, а маленький орёл чистил крыло на низкой ветке.',
      uz: 'Iliq yaylovda jonivorlar yig‘ildi: qor barsi tosh yonida yotdi, toshbaqa maysada mudradi.',
      kz: 'Жылы алаңқайда жануарлар жиналды: қар барысы тас жанында жатты, тасбақа шөпте қалғып тұрды.',
    },
    choiceA: {
      ru: { text: 'Наполнить поилку у поляны', effect: 'Животные спокойно подойдут к воде.', resolution: 'Герой наполнил поилку чистой водой. Черепаха первой подошла к краю, за ней снежный барс тихо опустил голову, а орёл благодарно расправил крылья.', seed: 'У поилки остался круглый след лапы. Завтра он покажет, кто приходил ночью.', icon: '🐾', friend: 'черепаха Сума' },
      uz: { text: 'Yaylovdagi suv idishini to‘ldirish', effect: 'Jonivorlar suvga xotirjam yaqinlashadi.', resolution: 'Qahramon suv idishini toza suv bilan to‘ldirdi. Toshbaqa birinchi bo‘lib yaqinlashdi, keyin qor barsi ham sokin boshini egdi.', seed: 'Suv yonida dumaloq panja izi qoldi. Ertaga u tunda kim kelganini ko‘rsatadi.', icon: '🐾' },
      kz: { text: 'Алаңқайдағы суатты толтыру', effect: 'Жануарлар суға тыныш жақындайды.', resolution: 'Кейіпкер суатты таза сумен толтырды. Тасбақа бірінші болып жақындады, кейін қар барысы да басын жай түсірді.', seed: 'Суат жанында дөңгелек із қалды. Ертең ол түнде кім келгенін көрсетеді.', icon: '🐾' },
    },
    choiceB: {
      ru: { text: 'Собрать мягкие листья для гнезда', effect: 'Птенцу станет теплее и спокойнее.', resolution: 'Герой собрал мягкие листья и положил их у корня дерева. Маленький орёл устроил из них тёплое гнездо, а вся поляна стала тише, будто берегла его сон.', seed: 'Один золотой лист остался у дерева. Завтра он тихо повернётся к новому следу.', icon: '🍃', friend: 'орлёнок Арча' },
      uz: { text: 'Uya uchun yumshoq barglar yig‘ish', effect: 'Polapon issiqroq va xotirjamroq bo‘ladi.', resolution: 'Qahramon yumshoq barglarni yig‘ib, daraxt ildizi yoniga qo‘ydi. Kichik burgut ulardan iliq uya yasadi.', seed: 'Daraxt yonida bitta oltin barg qoldi. Ertaga u yangi iz tomonga buriladi.', icon: '🍃' },
      kz: { text: 'Ұяға жұмсақ жапырақтар жинау', effect: 'Балапан жылырақ әрі тынышырақ болады.', resolution: 'Кейіпкер жұмсақ жапырақтарды жинап, ағаш түбіне қойды. Кішкентай бүркіт олардан жылы ұя жасады.', seed: 'Ағаш жанында бір алтын жапырақ қалды. Ертең ол жаңа ізге қарай бұрылады.', icon: '🍃' },
    },
    episodeTwo: {
      ru: { a: 'Утром у поилки блестел круглый след лапы. Он вёл к высокой траве, где кто-то тихо оставил маленькое перо.', b: 'Утром золотой лист у дерева повернулся к узкой тропинке. В тени уже ждал орлёнок Арча с новым тихим знаком.', fallback: 'Утром тёплая поляна проснулась спокойно. В траве остался маленький знак для героя.' },
      uz: { a: 'Ertalab suv yonida dumaloq panja izi yaltiradi. U baland maysa tomonga olib bordi.', b: 'Ertalab oltin barg tor yo‘l tomonga burildi. Soyada kichik burgut yangi belgi bilan kutdi.', fallback: 'Ertalab iliq yaylov sokin uyg‘ondi.' },
      kz: { a: 'Таңертең суат жанында дөңгелек із жылтырады. Ол биік шөпке қарай алып барды.', b: 'Таңертең алтын жапырақ тар соқпаққа бұрылды. Көлеңкеде кішкентай бүркіт жаңа белгімен күтті.', fallback: 'Таңертең жылы алаңқай тыныш оянды.' },
    },
  },

  sea_islands: {
    intro: {
      ru: 'На тёплом берегу маленький маяк дышал мягким светом. Волны шептали у песка, лодка тихо покачивалась, а рядом лежала ракушка с голубым отблеском.',
      uz: 'Iliq sohilda kichik mayoq mayin nur sochdi. To‘lqinlar qum yonida shivirladi.',
      kz: 'Жылы жағалауда кішкентай шамшырақ жұмсақ жарық шашты. Толқындар құм жанында сыбырлады.',
    },
    choiceA: {
      ru: { text: 'Зажечь маленький береговой фонарик', effect: 'Берег станет виднее для друзей в лодке.', resolution: 'Герой зажёг маленький фонарик у берега. Свет лёг на мокрый песок, и лодка сразу нашла спокойное место у причала. Волны стали звучать тише.', seed: 'Огонёк фонарика отразился в воде. Завтра этот отблеск покажет путь к дальнему островку.', icon: '🐚', friend: 'чайка Лола' },
      uz: { text: 'Sohil chirog‘ini yoqish', effect: 'Qayiqdagi do‘stlar qirg‘oqni oson ko‘radi.', resolution: 'Qahramon sohil yonidagi kichik chiroqni yoqdi. Nur nam qumga tushdi va qayiq sokin joyni topdi.', seed: 'Chiroq nuri suvda aks etdi. Ertaga shu aks uzoq orolga yo‘l ko‘rsatadi.', icon: '🐚' },
      kz: { text: 'Жағалау шамын жағу', effect: 'Қайықтағы достар жағалауды оңай көреді.', resolution: 'Кейіпкер жағалаудағы кішкентай шамды жақты. Жарық дымқыл құмға түсіп, қайық тыныш орынды тапты.', seed: 'Шам жарығы суда шағылысты. Ертең сол шағылыс алыс аралға жол көрсетеді.', icon: '🐚' },
    },
    choiceB: {
      ru: { text: 'Положить светящуюся ракушку у воды', effect: 'Волны понесут мягкий свет вдоль берега.', resolution: 'Герой положил светящуюся ракушку у самой воды. Волна осторожно коснулась её края, и вдоль берега побежала голубая дорожка света.', seed: 'Голубая дорожка не исчезла полностью. Завтра она приведёт героя к тихой бухте.', icon: '🌊', friend: 'маленькая черепаха Мира' },
      uz: { text: 'Yorqin chig‘anoqni suv yoniga qo‘yish', effect: 'To‘lqinlar mayin nurni sohil bo‘ylab olib ketadi.', resolution: 'Qahramon yorqin chig‘anoqni suv yoniga qo‘ydi. To‘lqin unga sekin tegdi va sohil bo‘ylab ko‘k nurli yo‘l paydo bo‘ldi.', seed: 'Ko‘k nurli yo‘l butunlay yo‘qolmadi. Ertaga u qahramonni sokin ko‘rfazga olib boradi.', icon: '🌊' },
      kz: { text: 'Жарқыраған қабыршақты су жанына қою', effect: 'Толқындар жұмсақ жарықты жағалау бойымен алып кетеді.', resolution: 'Кейіпкер жарқыраған қабыршақты су жанына қойды. Толқын оған жай тиіп, жағалау бойымен көк жарық жолы пайда болды.', seed: 'Көк жарық жолы толық жоғалмады. Ертең ол кейіпкерді тыныш шығанаққа алып барады.', icon: '🌊' },
    },
    episodeTwo: {
      ru: { a: 'Утром в воде всё ещё дрожал отблеск фонарика. Он тянулся к дальнему островку, где на песке виднелась новая ракушка.', b: 'Утром голубая дорожка света вела к тихой бухте. Там маленькая черепаха Мира уже ждала у гладкого камня.', fallback: 'Утром море было спокойным. На мокром песке остался мягкий светлый след.' },
      uz: { a: 'Ertalab suvda chiroq aksi hali ham titradi. U uzoq orol tomonga cho‘zildi.', b: 'Ertalab ko‘k nurli yo‘l sokin ko‘rfazga olib bordi. U yerda kichik toshbaqa kutib turardi.', fallback: 'Ertalab dengiz sokin edi.' },
      kz: { a: 'Таңертең суда шамның шағылысы әлі дірілдеп тұрды. Ол алыс аралға қарай созылды.', b: 'Таңертең көк жарық жолы тыныш шығанаққа алып барды. Онда кішкентай тасбақа күтіп тұрды.', fallback: 'Таңертең теңіз тыныш еді.' },
    },
  },

  castle_mystery: {
    intro: {
      ru: 'Во дворе мягкого замка вечер звенел маленькими флажками. В галерее стояли тёплые лампы, а у старой двери лежал ключ с голубой ленточкой.',
      uz: 'Muloyim qasr hovlisida oqshom kichik bayroqchalar bilan jarangladi. Yo‘lakda iliq chiroqlar turdi.',
      kz: 'Жұмсақ қамал ауласында кеш кішкентай жалаушалармен сыңғырлады. Дәлізде жылы шамдар тұрды.',
    },
    choiceA: {
      ru: { text: 'Зажечь лампу у галереи', effect: 'Галерея станет светлой и не будет казаться таинственной.', resolution: 'Герой зажёг лампу у галереи. Тени на стенах стали мягкими, картины будто улыбнулись, а старая дверь перестала казаться далёкой и незнакомой.', seed: 'На полу появилась тонкая светлая полоска. Завтра она покажет, какая дверь ждёт героя.', icon: '🏰', friend: 'котёнок Люм' },
      uz: { text: 'Yo‘lakdagi chiroqni yoqish', effect: 'Yo‘lak yorug‘ va xotirjam bo‘ladi.', resolution: 'Qahramon yo‘lakdagi chiroqni yoqdi. Devor soyasi yumshadi, rasmlar iliq ko‘rindi, eski eshik endi begona tuyulmadi.', seed: 'Polda ingichka yorug‘ chiziq paydo bo‘ldi. Ertaga u qaysi eshik kutayotganini ko‘rsatadi.', icon: '🏰' },
      kz: { text: 'Дәліздегі шамды жағу', effect: 'Дәліз жарық әрі тыныш болады.', resolution: 'Кейіпкер дәліздегі шамды жақты. Қабырға көлеңкелері жұмсарып, суреттер жылы көрінді, ескі есік енді бөтен сезілмеді.', seed: 'Еденде жіңішке жарық сызық пайда болды. Ертең ол қай есік күтіп тұрғанын көрсетеді.', icon: '🏰' },
    },
    choiceB: {
      ru: { text: 'Оставить добрую записку в зале', effect: 'Тот, кто её найдёт, почувствует поддержку.', resolution: 'Герой оставил добрую записку на маленьком столике. Сквозняк осторожно поднял её край, и в зале стало так тихо, будто замок слушал хорошие слова.', seed: 'У записки появился синий отблеск. Завтра он приведёт героя к полке со старой книгой.', icon: '🕯️', friend: 'хранительница Мина' },
      uz: { text: 'Zalda mehrli xat qoldirish', effect: 'Uni topgan kishi qo‘llab-quvvatlashni his qiladi.', resolution: 'Qahramon kichik stol ustiga mehrli xat qoldirdi. Yengil shamol uning chetini ko‘tardi va zal yanada sokinlashdi.', seed: 'Xatda ko‘k nur paydo bo‘ldi. Ertaga u qahramonni eski kitob tokchasiga olib boradi.', icon: '🕯️' },
      kz: { text: 'Залда мейірімді хат қалдыру', effect: 'Оны тапқан адам қолдауды сезеді.', resolution: 'Кейіпкер кішкентай үстелге мейірімді хат қалдырды. Жеңіл жел оның шетін көтеріп, зал бұрынғыдан тыныш болды.', seed: 'Хатта көк жарық пайда болды. Ертең ол кейіпкерді ескі кітап сөресіне апарады.', icon: '🕯️' },
    },
    episodeTwo: {
      ru: { a: 'Утром светлая полоска на полу тянулась к старой двери. За ней тихо звякнул маленький колокольчик.', b: 'Утром синий отблеск на записке повёл героя к книжной полке. Между книгами лежала новая добрая подсказка.', fallback: 'Утром замок был тихим и светлым. В галерее оставался маленький знак для героя.' },
      uz: { a: 'Ertalab poldagi yorug‘ chiziq eski eshik tomonga cho‘zildi. Uning ortida kichik qo‘ng‘iroq jarangladi.', b: 'Ertalab xatdagi ko‘k nur qahramonni kitob tokchasiga olib bordi. Kitoblar orasida yangi ishora yotdi.', fallback: 'Ertalab qasr sokin va yorug‘ edi.' },
      kz: { a: 'Таңертең едендегі жарық сызық ескі есікке қарай созылды. Оның ар жағында кішкентай қоңырау сыңғырлады.', b: 'Таңертең хаттағы көк жарық кейіпкерді кітап сөресіне апарды. Кітаптар арасында жаңа белгі жатты.', fallback: 'Таңертең қамал тыныш әрі жарық еді.' },
    },
  },

  brave_adventure: {
    intro: {
      ru: 'На тропе приключений вечерний ветер шевелил ленточки-указатели. У поворота лежал круглый камень, а за мостиком тихо светилась карта.',
      uz: 'Sarguzasht yo‘lida oqshom shamoli rangli belgi lentalarini tebratdi. Burilishda dumaloq tosh yotdi.',
      kz: 'Шытырман жолында кешкі жел түрлі белгі таспаларын тербетті. Бұрылыста дөңгелек тас жатты.',
    },
    choiceA: {
      ru: { text: 'Поставить дорожный фонарь у поворота', effect: 'Следующим друзьям будет легче найти безопасный путь.', resolution: 'Герой поставил дорожный фонарь у поворота. Свет лёг на камень и мостик, и тропа сразу стала спокойнее. Даже ветер стал тише шевелить ленточки.', seed: 'На круглом камне появился светлый знак. Завтра он покажет, куда ведёт тропа после мостика.', icon: '🧭', friend: 'птичка Сафо' },
      uz: { text: 'Burilishga yo‘l chirog‘ini qo‘yish', effect: 'Keyingi do‘stlar xavfsiz yo‘lni oson topadi.', resolution: 'Qahramon burilishga yo‘l chirog‘ini qo‘ydi. Nur tosh va ko‘prikka tushdi, yo‘l darrov sokinroq ko‘rindi.', seed: 'Dumaloq toshda yorug‘ belgi paydo bo‘ldi. Ertaga u ko‘prikdan keyingi yo‘lni ko‘rsatadi.', icon: '🧭' },
      kz: { text: 'Бұрылыста жол шамын қою', effect: 'Келесі достар қауіпсіз жолды оңай табады.', resolution: 'Кейіпкер бұрылыста жол шамын қойды. Жарық тас пен көпірге түсіп, соқпақ бірден тынышырақ көрінді.', seed: 'Дөңгелек таста жарық белгі пайда болды. Ертең ол көпірден кейінгі жолды көрсетеді.', icon: '🧭' },
    },
    choiceB: {
      ru: { text: 'Спеть бодрую походную песенку', effect: 'Друзья почувствуют смелость и пойдут вместе.', resolution: 'Герой запел бодрую походную песенку. Ленты на указателях закачались в такт, а друзья улыбнулись и пошли рядом, не торопясь и не боясь.', seed: 'У мостика осталась тихая мелодия. Завтра она подскажет, где начинается новая тропа.', icon: '🎶', friend: 'птичка Сафо' },
      uz: { text: 'Quvnoq yo‘l qo‘shig‘ini aytish', effect: 'Do‘stlar dadilroq bo‘lib, birga yuradi.', resolution: 'Qahramon quvnoq yo‘l qo‘shig‘ini aytdi. Belgilar lentalari ohangga mos tebrandi, do‘stlar esa yonma-yon yurdi.', seed: 'Ko‘prik yonida sokin ohang qoldi. Ertaga u yangi yo‘l qayerdan boshlanishini ko‘rsatadi.', icon: '🎶' },
      kz: { text: 'Көңілді жол әнін айту', effect: 'Достар батылырақ болып, бірге жүреді.', resolution: 'Кейіпкер көңілді жол әнін айтты. Белгі таспалары әуенге сай тербелді, достар қатар жүрді.', seed: 'Көпір жанында тыныш әуен қалды. Ертең ол жаңа жолдың қайдан басталатынын көрсетеді.', icon: '🎶' },
    },
    episodeTwo: {
      ru: { a: 'Утром светлый знак на камне указывал за мостик. Там начиналась узкая тропа с новыми ленточками.', b: 'Утром тихая мелодия у мостика снова прозвучала. Она повела героя к тропе, где на ветке ждала птичка Сафо.', fallback: 'Утром тропа приключений была спокойной. У поворота остался знак, который звал героя дальше.' },
      uz: { a: 'Ertalab toshdagi yorug‘ belgi ko‘prik ortini ko‘rsatdi. U yerda yangi lentalar bilan tor yo‘l boshlanardi.', b: 'Ertalab ko‘prik yonidagi sokin ohang yana eshitildi. U qahramonni yangi yo‘lga boshladi.', fallback: 'Ertalab sarguzasht yo‘li sokin edi.' },
      kz: { a: 'Таңертең тастағы жарық белгі көпірдің ар жағын көрсетті. Онда жаңа таспалары бар тар жол басталды.', b: 'Таңертең көпір жанындағы тыныш әуен қайта естілді. Ол кейіпкерді жаңа жолға бастады.', fallback: 'Таңертең шытырман жолы тыныш еді.' },
    },
  },
}

for (const id of Object.keys(simpleWorldTemplates) as SimpleWorldId[]) {
  worldTemplates[id] = simpleWorldTemplates[id]
}

function episodeOneChoices(selections: OnboardingSelections): EpisodeChoice[] {
  const tpl = worldTemplates[selections.stylePackId]
  const a = tpl.choiceA[selections.language]
  const b = tpl.choiceB[selections.language]
  return [
    { choice_id: 'path_a', text: a.text, effect_summary: a.effect, resolution_text: a.resolution, tomorrow_seed: a.seed, choice_icon: a.icon, state_patch: { hero_trait: selections.language === 'ru' ? 'заботливость' : 'kind', new_friend: a.friend, open_arc: 'world path a' }, value_alignment: ['kindness', 'mutual_help'] },
    { choice_id: 'path_b', text: b.text, effect_summary: b.effect, resolution_text: b.resolution, tomorrow_seed: b.seed, choice_icon: b.icon, state_patch: { hero_trait: selections.language === 'ru' ? 'доброта' : 'kind', new_friend: b.friend, open_arc: 'world path b' }, value_alignment: ['friendship', 'care_for_nature'] },
  ]
}
function createEpisodeOne(selections: OnboardingSelections, seriesState?: SeriesState): Episode {
  const stylePack = stylePacks.find((pack) => pack.id === selections.stylePackId) ?? stylePacks[0]
  const heroName = selections.heroType === 'custom' && selections.customHeroName ? selections.customHeroName : heroByType[selections.heroType][selections.language]

  return {
    episode_id: `ep-1-${selections.stylePackId}-${selections.storyMood}`,
    series_id: seriesState?.id ?? `series-${selections.stylePackId}-${selections.language}`,
    title: ({ cozy_forest: { ru: 'Фонарики на лесной тропинке', uz: 'O‘rmon yo‘lidagi chiroqlar', kz: 'Орман соқпағындағы шамдар' }, magic_garden: { ru: 'Лепестковая дорожка', uz: 'Gulbargli yo‘lakcha', kz: 'Жапырақты жолақ' }, silk_road: { ru: 'Фонарь у каравана', uz: 'Karvon yonidagi chiroq', kz: 'Керуен жанындағы шам' }, stars_and_space: { ru: 'Свет звёздного маяка', uz: 'Yulduz mayog‘i nuri', kz: 'Жұлдыз шамшырағының жарығы' }, animal_world: { ru: 'Тёплая поляна друзей', uz: 'Do‘stlar yaylovidagi iliq oqshom', kz: 'Достар алаңқайындағы жылы кеш' }, sea_islands: { ru: 'Огонёк у маяка', uz: 'Mayoq yonidagi mayin chiroq', kz: 'Шамшырақ жанындағы жарық' }, castle_mystery: { ru: 'Лампа в тихой галерее', uz: 'Sokin yo‘lakdagi chiroq', kz: 'Тыныш дәліздегі шам' }, brave_adventure: { ru: 'Знак у поворота', uz: 'Burilishdagi belgi', kz: 'Бұрылыстағы белгі' } } as Record<OnboardingSelections['stylePackId'], Record<Language, string>>)[selections.stylePackId][selections.language],
    story_text: polishStoryText((worldTemplates[selections.stylePackId] ?? worldTemplates.cozy_forest).intro[selections.language]),
    mode: selections.storyMode,
    mood: selections.storyMood,
    stylePackId: stylePack.id,
    choices: episodeOneChoices(selections),
    state_patch: { last_event: selections.language === 'ru' ? 'герой остановился перед добрым выбором' : 'gentle choice moment opened', open_arc: selections.language === 'ru' ? 'Путь добрых дел в новом мире' : 'kind path arc' },
    vocabulary: vocabularyFor(selections.language),
      nextEpisodePreview: selections.language === 'ru'
        ? `${heroName} оставит в мире маленький след. Следующая серия начнётся с него.`
        : selections.language === 'uz'
          ? `${heroName} olamda kichik iz qoldiradi. Keyingi qism shu izdan boshlanadi.`
          : `${heroName} әлемде кішкентай із қалдырады. Келесі бөлім сол ізден басталады.`,
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}

function createEpisodeTwo(selections: OnboardingSelections, seriesState: SeriesState): Episode {
  const lastChoice = seriesState.choiceHistory[seriesState.choiceHistory.length - 1]
  const friend = seriesState.recurringCharacters[seriesState.recurringCharacters.length - 1]

  const tpl = worldTemplates[selections.stylePackId]
  const idx = seriesState.choiceHistory.length - 1
  const rememberedText = selections.language === 'ru'
    ? (lastChoice.choice_id === 'path_a' ? tpl.episodeTwo.ru.a : lastChoice.choice_id === 'path_b' ? tpl.episodeTwo.ru.b : tpl.episodeTwo.ru.fallback)
    : selections.language === 'uz'
      ? (lastChoice.choice_id === 'path_a' ? tpl.episodeTwo.uz.a : lastChoice.choice_id === 'path_b' ? tpl.episodeTwo.uz.b : tpl.episodeTwo.uz.fallback)
      : (lastChoice.choice_id === 'path_a' ? tpl.episodeTwo.kz.a : lastChoice.choice_id === 'path_b' ? tpl.episodeTwo.kz.b : tpl.episodeTwo.kz.fallback)

  return {
    episode_id: `ep-2-${selections.stylePackId}-${seriesState.choiceHistory.length}`,
    series_id: seriesState.id,
    title: ({ cozy_forest: { ru: 'Огонёк у старого пенька', uz: 'Eski to‘nka yonidagi chiroq', kz: 'Ескі томар жанындағы шам' }, magic_garden: { ru: 'След у лунного цветка', uz: 'Oy guli yonidagi iz', kz: 'Ай гүлі жанындағы із' }, silk_road: { ru: 'Узор на карте каравана', uz: 'Karvon xaritasidagi naqsh', kz: 'Керуен картасындағы өрнек' }, stars_and_space: { ru: 'Луч над звёздной станцией', uz: 'Yulduz bekati ustidagi nur', kz: 'Жұлдыз бекеті үстіндегі сәуле' }, animal_world: { ru: 'Утро у поилки', uz: 'Suvdon yonidagi tong', kz: 'Суат жанындағы таң' }, sea_islands: { ru: 'Ракушка у тёплой воды', uz: 'Iliq suv yonidagi chig‘anoq', kz: 'Жылы су жанындағы қабыршақ' }, castle_mystery: { ru: 'Записка у старой двери', uz: 'Eski eshik yonidagi xat', kz: 'Ескі есік жанындағы хат' }, brave_adventure: { ru: 'След на тропе приключений', uz: 'Sarguzasht yo‘lidagi iz', kz: 'Шытырман жолындағы із' } } as Record<OnboardingSelections['stylePackId'], Record<Language, string>>)[selections.stylePackId][selections.language],
    story_text: rememberedText,
    mode: selections.storyMode,
    mood: selections.storyMood,
    stylePackId: selections.stylePackId,
    choices: [],
    state_patch: { last_event: lastChoice.effect_summary, open_arc: seriesState.activeArc },
    vocabulary: vocabularyFor(selections.language),
    nextEpisodePreview: selections.language === 'ru' ? 'Первая глава этой истории мягко завершилась.' : selections.language === 'uz' ? 'Bu hikoyaning birinchi bobi muloyim yakunlandi.' : 'Бұл оқиғаның алғашқы тарауы жылы аяқталды.',
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}

// Prototype Story Agent contract: local-only deterministic generator.
// one_time stays self-contained; series episode 2 is the current first-chapter closure without Episode 3 promise.
export function createStoryEpisode(input: StoryGenerationInput): Episode {
  const { selections, seriesState } = input
  const hasHistory = Boolean(seriesState && seriesState.choiceHistory.length > 0)
  const draftEpisode = hasHistory ? createEpisodeTwo(selections, seriesState as SeriesState) : createEpisodeOne(selections, seriesState)
  const safety = runEpisodeSafetyCheck(draftEpisode)

  if (safety.approved) {
    const output: StoryGenerationOutput = { episode: { ...draftEpisode, safety_self_check: safety } }
    return output.episode
  }

  return {
    ...draftEpisode,
    title: selections.language === 'ru'
      ? 'Тихий добрый вечер'
      : selections.language === 'uz'
        ? 'Sokin mehrli oqshom'
        : 'Тыныш мейірімді кеш',
    story_text: selections.language === 'ru'
      ? 'Герои выбрали спокойный путь, помогли друг другу и завершили день с улыбкой.'
      : selections.language === 'uz'
        ? 'Qahramonlar sokin yo‘lni tanlab, bir-biriga yordam berdi va kunni iliq kayfiyatda yakunladi.'
        : 'Кейіпкерлер тыныш жолды таңдап, бір-біріне көмектесіп, күнді жылы көңілмен аяқтады.',
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}
