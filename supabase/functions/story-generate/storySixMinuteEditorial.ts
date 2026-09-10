import type { CandidatePatch, NormalizedStoryContext, PositiveValue, StoryCandidate } from './contracts.ts'
type ClosedBetaLanguage = 'ru' | 'uz'
type ClosedBetaWorld = 'cozy_forest' | 'magic_garden' | 'stars_and_space'

// Additional short beat used only by the deterministic 5–7 closed-beta
// bedtime references. It deepens the existing goal before the child chooses;
// it must not introduce a new problem, character quest, or cliffhanger.
export const sixMinuteSettlingBeat: Record<ClosedBetaWorld, Record<ClosedBetaLanguage, string>> = {
  cozy_forest: {
    ru: `Зверята по очереди назвали, чей дом встретится первым, а чей — последним. Так всем стало ещё спокойнее: дорога была знакомой, друзья держались вместе, и впереди не было никакой новой загадки. Даже самый маленький кролик перестал оглядываться и просто взял старшего за лапу.`,
    uz: `Hayvonchalar navbat bilan kimning uyi avval, kimniki esa oxirida uchrashini aytdi. Shunda hamma yanada xotirjam bo‘ldi: yo‘l tanish, do‘stlar birga, oldinda esa yangi jumboq yo‘q edi. Eng kichik quyoncha ham ortiga qarashni to‘xtatib, akasining panjasidan ushladi.`,
  },
  magic_garden: {
    ru: `Мирай напомнила, что после помощи цветам друзья не будут искать новое дело. Они только проверят дорожку, попрощаются с садом и отправятся домой. От этих слов вечер словно стал ещё тише. {{HERO}} услышал ровный плеск фонтана и понял: вся сегодняшняя история уже помещается в одну простую заботу.`,
    uz: `Miroy gullarga yordam bergach, do‘stlar yangi ish izlamasligini eslatdi. Ular faqat yo‘lakni tekshiradi, bog‘ bilan xayrlashadi va uyga qaytadi. Bu gaplardan keyin oqshom yanada tinchgandek bo‘ldi. {{HERO}} favvoraning bir maromdagi shovqinini eshitib, bugungi voqea bitta oddiy g‘amxo‘rlikdan iboratligini tushundi.`,
  },
  stars_and_space: {
    ru: `Пико поставил рядом с картой маленький таймер без тревожного звука. Времени было достаточно. Если действовать спокойно, капсула успеет получить знак и войти в стыковочный коридор точно по расписанию. {{HERO}} увидел это на экране и окончательно успокоился: впереди была не опасность, а аккуратная работа, которую можно закончить сегодня.`,
    uz: `Piko xarita yoniga ovozsiz kichik taymer qo‘ydi. Vaqt yetarli edi. Shoshmasdan ishlansa, kapsula belgini olib, ulanish yo‘lagiga aynan jadval bo‘yicha kirishga ulgurardi. {{HERO}} buni ekranda ko‘rib, butunlay xotirjam bo‘ldi: oldinda xavf emas, bugun tugatish mumkin bo‘lgan aniq va ehtiyotkor ish bor edi.`,
  },
}

type ChildFirstBranch = {
  text: Record<ClosedBetaLanguage, string>
  icon: string
  effect: Record<ClosedBetaLanguage, string>
  resolution: Record<ClosedBetaLanguage, string>
  seed: Record<ClosedBetaLanguage, string>
  titleTwo: Record<ClosedBetaLanguage, string>
  episodeTwo: Record<ClosedBetaLanguage, string>
  values: PositiveValue[]
}

type ChildFirstStory = {
  titleOne: Record<ClosedBetaLanguage, string>
  episodeOne: Record<ClosedBetaLanguage, string>
  vocabulary: Array<{ word: string; translation: string; example: string }>
  choices: Record<'choice-a' | 'choice-b', ChildFirstBranch>
}
const childFirstStories: Record<ClosedBetaWorld, ChildFirstStory> = {
  cozy_forest: {
    titleOne: {
      ru: `Дорога домой после дождя`,
      uz: `Yomg‘irdan keyingi uy yo‘li`,
    },
    episodeOne: {
      ru: `Вечером дождь только что закончился, и Уютный лес пах мокрой травой, грибами и тёплой корой. У старого пенька собрались те, кто обычно желал друг другу доброй ночи. Сова Нура поправляла перья, маленький кролик Пух держал старшего брата за лапу, а черепаха терпеливо ждала у дорожки.

— Кажется, дождь съел наши стрелочки, — сказал Пух.

И правда: краска на маленьких деревянных указателях почти смылась. От пенька расходились две тропинки, и в сумерках они выглядели одинаково. Пух понюхал одну, потом другую.

— Мой дом пахнет мятой, — сообщил он. — Но после дождя весь лес пахнет мятой!

Нура фыркнула от смеха. Белка, которая несла корзинку с орехами, тоже улыбнулась и поставила корзинку на пень. Она была почти такой большой, как сама белка, и каждый раз, когда та пыталась поднять её, сверху выкатывался один орех. Пух ловил орехи и складывал обратно. Третий он поймал ушами.

— Отличная корзинка, — сказал он. — Только очень разговорчивая.

Нура показала тебе старую плетёную сумку. В ней лежали бумажные фонарики. Рядом над папоротником кружились светлячки. Они вспыхивали по очереди, будто кто-то тихонько нажимал невидимые кнопки.

У тебя появилась идея: сначала всем вместе дойти до самой развилки. По дороге компания заметила лужу в форме луны, поваленную веточку и три блестящих жёлудя. Пух хотел положить один в карман, но промахнулся и уронил его себе в капюшон. Пока он пытался достать желудь, даже черепаха успела его обогнать.

У развилки Нура поднялась на низкую ветку. С одной стороны темнела берёза, с другой слышался ручей. Где-то впереди коротко звякнул колокольчик на двери беличьего домика.

— До домов осталось совсем немного, — сказала Нура. — Можно оставить на поворотах фонарики. А можно придумать короткую песенку и петь её у знакомых мест. Тогда каждый будет слышать, где друзья.

Пух уже перестал хмуриться. Он смотрел то на сложенные фонарики, то на светлячков, которые будто ждали начала музыки. За деревьями виднелось первое круглое окно. В нём кто-то зажёг ночник, и на занавеске появилась тень чайника.

Пух подошёл поближе к тебе.

— {{HERO}}, как поведём всех домой?

Нура поставила сумку с фонариками на пень. Пух приготовился петь, хотя заранее предупредил, что знает всего три ноты. Белка прижала корзинку к животу, чтобы орехи больше не разбегались. Даже черепаха подняла голову. Теперь выбор был за тобой.`,
      uz: `Yomg‘ir endigina tinib, Shinam o‘rmon nam maysa, qo‘ziqorin va daraxt po‘stlog‘i hidiga to‘lgandi. Eski to‘nka yonida har oqshom bir-biriga xayrli tun tilaydigan do‘stlar yig‘ildi. Boyqush Nura patlarini tuzatib qo‘ydi, kichkina quyoncha Puf akasining panjasidan ushlab turardi, toshbaqa esa yo‘l chetida kutardi.

— Menimcha, yomg‘ir yo‘l ko‘rsatkichlarimizni yuvib ketibdi, — dedi Puf.

Rostdan ham, kichkina yog‘och belgilar ustidagi rang deyarli ko‘rinmay qolgan edi. To‘nka yonidan ikki so‘qmoq ajralib chiqardi, qorong‘iroqda ikkalasi ham bir xil ko‘rinardi. Puf avval bir yo‘lni, keyin boshqasini hidladi.

— Bizning uyimiz yalpiz hidiga o‘xshaydi, — dedi u. — Lekin yomg‘irdan keyin butun o‘rmon yalpiz hidiga o‘xshayapti!

Nura kulib yubordi. Yong‘oq solingan savat ko‘targan olmaxon ham jilmayib, savatini to‘nka ustiga qo‘ydi. Savat olmaxonning o‘zidan deyarli katta edi. U har safar ko‘targanda tepasidan bittadan yong‘oq dumalab tushardi. Puf yong‘oqlarni tutib, yana joyiga solardi. Uchinchisini esa quloqlari bilan tutib oldi.

— Zo‘r savat ekan, — dedi Puf. — Faqat ichidagilar sayr qilishni yaxshi ko‘radi.

Nura {{HERO}}ga eski to‘qilgan xaltani ko‘rsatdi. Ichida qog‘oz chiroqlar bor edi. Paporotnik ustida esa yorug‘qo‘ng‘izlar aylanib uchardi. Ular navbat bilan yonib-o‘char, xuddi kimdir ko‘rinmas tugmachalarni bosayotgandek edi.

{{HERO}} avval chorrahagacha birga borishni taklif qildi. Yo‘lda ular oy shaklidagi ko‘lmakni, yiqilgan novdani va uchta yaltiroq yong‘oqni ko‘rdi. Puf bittasini cho‘ntagiga solmoqchi bo‘ldi, ammo adashib kapyushoniga tashlab yubordi. Uni topguncha toshbaqa ham Pufdan o‘tib ketdi.

Chorrahaga yetmay turib, ular boshiga yaproq tutgan kichkina qo‘ng‘izni uchratdi. Puf undan yo‘lni bilasanmi, deb so‘radi. Qo‘ng‘iz juda jiddiy bosh irg‘ab, faqat qo‘ziqoringacha bo‘lgan yo‘lni bilishini aytdi. U o‘ng tomondagi ulkan qo‘ziqorinni ko‘rsatib, o‘zi ham shu yerga kelganini faxr bilan bildirdi. Puf unga xayrli tun tiladi.

Chorrahada Nura past shoxga uchib chiqdi. Bir tomonda qayin qorayib ko‘rinar, boshqa tomondan ariqning shovqini eshitilardi. Oldinda olmaxon uyining eshigidagi kichkina qo‘ng‘iroq bir marta jarangladi.

— Uylar uzoq emas, — dedi Nura. — Burilishlarga chiroqlar osib chiqishimiz mumkin. Yoki tanish joylarda aytib boradigan juda qisqa qo‘shiq o‘ylab topamiz. Shunda hamma do‘stlarining ovozini eshitib boradi.

Puf endi xafa ko‘rinmasdi. U bir chiroqlarga, bir yorug‘qo‘ng‘izlarga qarardi. Daraxtlar orasida birinchi dumaloq deraza ko‘rinib turardi. Ichkarida tungi chiroq yonib, parda ustida choynakning soyasi tushgandi.

{{HERO}} Puf yoniga cho‘kkaladi.

— Hamma uyiga qanday boradi?

Nura chiroqlar solingan xaltani to‘nka ustiga qo‘ydi. Puf esa kuylashga tayyorlandi, lekin oldindan uchta notadan boshqasini bilmasligini aytdi. Olmaxon yong‘oqlari yana qochib ketmasin deb savatini qorniga bosdi. Toshbaqa ham boshini ko‘tardi. Endi tanlov {{HERO}}da edi.`,
    },
    vocabulary: [
      { word: `развилка`, translation: `fork in the road`, example: `У развилки рядом с {{HERO}} собрались друзья.` },
      { word: `шелест`, translation: `rustle`, example: `Рядом с {{HERO}} был слышен шелест мокрых листьев.` },
    ],
    choices: {
      'choice-a': {
        text: {
          ru: `Зажечь фонарики вдоль тропинки`,
          uz: `Yo‘l bo‘ylab chiroqlar yoqish`,
        },
        effect: {
          ru: `По твоему выбору фонарики зажглись, и у друзей появилась золотая дорожка домой.`,
          uz: `{{HERO}} chiroqlarni yoqdi va do‘stlar uchun uyga boradigan oltinrang yo‘l paydo bo‘ldi.`,
        },
        resolution: {
          ru: `Ты зажигаешь первый бумажный фонарик. Из него вылетает сонный мотылёк и смешно чихает. Пух прыскает от смеха. Второй фонарик появляется у лужи-луны, третий — у берёзы. Между деревьями складывается золотая дорожка, и друзья отправляются к первому дому.`,
          uz: `{{HERO}} birinchi qog‘oz chiroqni yoqdi. Ichidan uyqusi kelgan kapalak uchib chiqib, kulgili aksirdi. Puf kulib yubordi. Ikkinchi chiroq oy shaklidagi ko‘lmak yoniga, uchinchisi qayin oldiga osildi. Daraxtlar orasida oltinrang yo‘l paydo bo‘lib, do‘stlar birinchi uy tomon yurdi.`,
        },
        seed: {
          ru: `У первого домика фонарики уже приготовили маленький сюрприз.`,
          uz: `Birinchi uy oldida chiroqlar kichkina kutilmagan voqeani boshlab berdi.`,
        },
        titleTwo: {
          ru: `Фонарики до самого дома`,
          uz: `Uyga eltgan chiroqlar`,
        },
        episodeTwo: {
          ru: `У орехового дерева их встретила белка. Она сразу узнала свою корзинку, которую оставила у пенька, и ахнула:

— Хорошо, что вы пришли! Я уже думала, мои орехи сами отправились гулять.

Пух важно передал ей корзинку. Но в этот момент один орех всё-таки выскочил и покатился вниз по корню. Орех остановился у твоего ботинка, а белка решила, что на сегодня корзинке хватит приключений. Фонарик над корнями осветил дорожку к дуплу. Белка помахала всем хвостом и скрылась внутри. Через секунду из окна высунулась только её лапка, чтобы ещё раз помахать.

Дальше тропинка повернула к ручью. Один фонарик качнулся от ветра и развернулся бумажной спинкой к дороге. На земле сразу стало темнее. До фонарика оставался один шаг, но Пух заметил золотое отражение в воде.

— {{HERO}}, смотри! Фонарик всё равно показывает нам путь, только снизу!

Они переставили его на другую ветку. Теперь свет лежал сразу и на мостике, и в ручье. Пух шагал рядом с черепахой и каждый раз первым замечал следующий огонёк. У одного фонарика он даже нашёл свой желудь из капюшона: тот выпал и лежал прямо посреди золотого круга.

Перед холмом тропинка прошла мимо старой коряги. Фонарик бросил на неё длинную тень, и Пух ахнул: на земле появился огромный ушастый зверь. Он спрятался за тобой, но через секунду понял, что это его собственные уши. Пух встал боком, тень стала ещё смешнее, и даже Нура тихо хихикнула. Потом они пошли дальше.

У холма показалась кроличья нора. Старший брат Пуха открыл маленькую дверцу. Изнутри пахнуло сухой травой и мятой.

— Вот! — обрадовался Пух. — Я же говорил про мяту!

Он уже поставил лапу на порог, но оглянулся. Черепаха всё ещё шла к своему плоскому камню.

— А она ещё не дома.

Пух снова вышел на дорожку. Оба кролика пошли вместе со всеми до ручья. Там черепаха нашла под навесом сухой лист, свернула его как одеяло и довольно вздохнула. Пух пожелал ей доброй ночи и только после этого вернулся к своей норе.

Теперь можно было идти обратно. ты и Нура гасили фонарики один за другим. Там, где исчезал золотой круг, оставались луна, мокрые листья и знакомая тропа. Мотылёк из первого фонаря уже спал на внутренней бумажной стенке, поэтому его не стали тревожить и оставили этот фонарь светиться ещё немного.

У старого пенька Нура нашла тот самый желудь, который Пух так и не забрал. Она положила его на край пенька.

— Завтра вернём владельцу.

За деревьями погасло последнее окно. Ручей шуршал за кустами, мотылёк больше не чихал, а единственный фонарик стал похож на маленькую тёплую звезду. Нура и ты пожелали друг другу доброй ночи. Потом огонёк стал совсем маленьким, и лес остался под круглой луной. Где-то далеко Пух уже наверняка спал под своим мятным одеялом, а забытый желудь тихо ждал утра на краю пенька.`,
          uz: `Olmaxonning daraxtiga yetganda, u savatini darrov tanidi.

— Yaxshi keldinglar! Men yong‘oqlarim o‘zlari sayrga chiqib ketdi, deb o‘ylab qoldim, — dedi u.

Puf savatni tantanali ravishda uzatdi. Shu payt bitta yong‘oq baribir otilib chiqib, ildiz bo‘ylab dumaladi. {{HERO}} uni oyog‘ining uchi bilan to‘xtatdi. Olmaxon bugunga savatga yetarlicha sarguzasht bo‘lganini aytdi. Pastdagi chiroq kovakka olib boradigan yo‘lni yoritdi. Olmaxon dumini silkitib xayrlashdi va ichkariga kirdi. Bir lahzadan keyin derazadan faqat panjasi chiqib, yana bir marta xayr dedi.

Keyingi burilish ariq tomonda edi. Shamol bitta chiroqni aylantirib yubordi, uning qog‘oz orqasi yo‘lga qarab qoldi. Yer birdan qorong‘iroq bo‘ldi. {{HERO}} chiroqni to‘g‘rilamoqchi edi, Puf suvdagi oltin aksni ko‘rib qoldi.

— Qarang! Chiroq yo‘lni pastdan ham ko‘rsatyapti!

Ular chiroqni boshqa shoxga ko‘chirdi. Endi nur kichik ko‘prikka ham, suvga ham tushardi. Puf toshbaqa yonida borib, keyingi chiroqni hammadan oldin topishga harakat qildi. Bir chiroq tagida u kapyushonidagi o‘sha yong‘oqni ham topdi: yo‘lda tushib qolib, oltin nur ichida yotgan ekan.

Tepalik oldidan eski quruq daraxt ildizi ko‘rindi. Chiroq uning uzun soyasini yo‘lga tashladi. Puf birdan to‘xtab qoldi: yerda ulkan quloqli maxluq paydo bo‘lgandek edi. U {{HERO}} ortiga yashirindi, keyin soyadagi quloqlar o‘zining quloqlari ekanini tushundi. Puf yon tomonga turdi, soya yanada kulgili bo‘lib ketdi. Nura ham kuldi.

Nihoyat quyonlar ini ko‘rindi. Pufning akasi kichik eshikni ochdi. Ichkaridan quruq o‘t va yalpiz hidi keldi.

— Ana! Men aytgandim-ku, yalpiz! — dedi Puf.

U ichkariga kirmoqchi bo‘lib, keyin ortiga qaradi. Toshbaqa hali o‘zining tekis toshi tomon ketayotgan edi.

— U hali uyiga yetgani yo‘q.

Puf yana yo‘lga chiqdi. Ikki quyon ham do‘stlar bilan ariqgacha bordi. Toshbaqa soyabon ostidan quruq katta yaproqni topdi, uni ko‘rpa kabi ustiga tortdi va mamnun xo‘rsindi. Puf unga xayrli tun tilab, shundan keyingina o‘z iniga qaytdi.

Endi {{HERO}} bilan Nura ortga qaytdi. Ular chiroqlarni bittadan o‘chirib borardi. Oltin doira yo‘qolgan joyda oy nuri, nam barglar va tanish so‘qmoq qolardi. Birinchi chiroq ichidagi kapalak qog‘oz devorga yopishib uxlab qolgan edi. Uni bezovta qilmaslik uchun o‘sha chiroqni yana biroz yoqib qo‘yishdi.

Qaytishda ariq yonidan mitti qurbaqa boshini chiqardi. Suvda chiroqning aksi hali ham ko‘rinib turardi. Qurbaqa bir osmonga, bir suvga qarab, bugun ikkita oy chiqqanmi, deb so‘radi. {{HERO}} unga ikkinchisi shunchaki chiroqning aksi ekanini ko‘rsatdi. Qurbaqa bundan juda mamnun bo‘lib, «bitta oy yetadi», dedi.

Eski to‘nka yonida Nura Puf tashlab ketgan yong‘oqni topdi va chetga qo‘ydi.

— Ertaga egasiga beramiz.

Daraxtlar orasidagi oxirgi deraza ham o‘chdi. Ariq shivirlab oqardi, kapalak boshqa aksirmadi, bitta chiroq esa kichkina iliq yulduzga o‘xshab qoldi. {{HERO}} Nuraga xayrli tun tiladi. Keyin chiroq ham xiralashdi va Shinam o‘rmon dumaloq oy ostida uxlab qoldi. Uzoqda Puf yalpiz hidli inida allaqachon mizg‘ib qolgan bo‘lsa kerak, to‘nka chetidagi yong‘oq esa tonggacha jim kutardi.`,
        },
        icon: `🏮`,
        values: ['mutual_help', 'kindness'],
      },
      'choice-b': {
        text: {
          ru: `Придумать дорожную песенку`,
          uz: `Yo‘l uchun kichkina qo‘shiq o‘ylab topish`,
        },
        effect: {
          ru: `Вместе с тобой друзья придумали песенку, и знакомые звуки стали вести друзей по тропинке.`,
          uz: `{{HERO}} kichkina qo‘shiq o‘ylab topdi va tanish tovushlar do‘stlarni yo‘l bo‘ylab boshlab bordi.`,
        },
        resolution: {
          ru: `Ты хлопаешь в ладоши: раз, два, пауза. Нура отвечает двумя нотами, Пух тянет смешное «пи-и», а светлячки мигают в такт. Белка стучит двумя орехами. Через минуту у компании уже есть короткая дорожная песенка, и все отправляются домой.`,
          uz: `{{HERO}} kaftini urib ritm boshladi: bir, ikki, tanaffus. Nura ikki nota bilan javob berdi, Puf kulgili «pi-i» dedi, yorug‘qo‘ng‘izlar esa ritmga mos miltilladi. Olmaxon ikki yong‘oqni «toq-toq» urdi. Bir daqiqada yo‘l qo‘shig‘i tayyor bo‘lib, do‘stlar uy tomon yurdi.`,
        },
        seed: {
          ru: `У берёзы к песенке сразу добавился новый звук.`,
          uz: `Qayin yonida qo‘shiqka darrov yangi tovush qo‘shildi.`,
        },
        titleTwo: {
          ru: `Песня, которая знала дорогу`,
          uz: `Yo‘lni bilgan qo‘shiq`,
        },
        episodeTwo: {
          ru: `У берёзы песенка получила новый звук. Дождевые капли падали с листьев: кап, кап. Пух вставил эти два «кап» между нотами, и все сразу поняли, что дошли до первого поворота.

Чуть дальше был ручей. Здесь вода добавила своё «ш-ш-ш». Нура спела начало, Пух ответил, а последняя нота осталась за тобой. Светлячки летели над головами и мигали ровно в тот момент, когда наступала пауза.

— {{HERO}}, у нашей песни уже есть берёза и ручей, — сказал Пух. — Скоро в ней будет весь лес!

Белка шла с корзинкой и отбивала ритм двумя орехами. Тук-тук, пауза. На третьем «тук» один орех выскочил из её лап и покатился по тропе. Черепаха остановила его панцирем.

— Вот почему в песне нужна пауза, — заметила Нура.

Первой домой свернула белка. Перед дверцей дупла она пропела последние две ноты и поклонилась так низко, что хвост накрыл ей голову. Пух снова рассмеялся, но уже совсем сонно. Белка поставила корзинку на пол и на прощание постучала в окно: тук-тук.

У холма пришла очередь кроликов. Старший брат открыл дверь. Пух вдохнул запах мяты, шагнул внутрь и вдруг притормозил. Он посмотрел на черепаху, которая всё ещё шла к своему плоскому камню.

— Я допою песню до конца, — решил он.

Так Пух остался с компанией ещё на один кусочек пути. У большого камня песня вдруг стала тише: светлячки разлетелись в разные стороны. До ты донеслось, как из травы отвечает один-единственный «пи». Маленький светлячок отстал от остальных и сел на мокрый лист.

Нура повторила знакомые три ноты. Пух добавил своё смешное высокое «пи». Светлячок вспыхнул и полетел к друзьям. Через мгновение над тропой снова висела целая россыпь огоньков, а Пух гордо заявил, что его самая странная нота оказалась самой полезной.

Перед самым ручьём песня отозвалась из дупла старого дерева. Пух спел «пи», а дупло ответило ему почти таким же «пи-и». Он попробовал ещё раз, теперь ниже. Эхо ответило ниже. Пух попробовал совсем шёпотом, и дерево тоже прошептало в ответ. Пух решил, что там, наверное, живёт невидимый певец. Нура объяснять ничего не стала и только подмигнула тебе.

Черепаха добралась домой последней. Она устроилась под сухим листом и сказала:

— Теперь я узнаю вашу песню даже с закрытыми глазами.

На обратном пути никто уже не пел весь припев. У берёзы Нура напела две ноты. У ручья в ответ от тебя прозвучала ещё одна нота. Белкино «тук-тук» донеслось из далёкого окна. Этого хватало, чтобы вспомнить всю дорогу.

У старого пенька Пух наконец попрощался. Он побежал к норе всего на три шага, потом вспомнил, что устал, и перешёл на обычный шаг. Нура улыбнулась. Светлячки спрятались в траве, ручей продолжил свою часть песни, и лес постепенно остался только с ночными звуками. Вдалеке один раз звякнул колокольчик у беличьей двери.`,
          uz: `Qayin yoniga yetganda qo‘shiqka yangi tovush qo‘shildi. Barglardan tomchilar tushardi: tom, tom. Puf shu ikki «tom»ni notalar orasiga qo‘shdi. Hamma birinchi burilishga kelganini darrov bildi.

Ariq yonida suv o‘zining «sh-sh-sh»ini qo‘shdi. Nura boshladi, Puf davom ettirdi, {{HERO}} esa satrni tugatdi. Yorug‘qo‘ng‘izlar boshlar ustida uchib, aynan tanaffus paytida yonardi.

— Bizning qo‘shig‘imizda qayin ham bor, ariq ham bor, — dedi Puf. — Tez orada butun o‘rmon sig‘adi!

Olmaxon savatini ko‘tarib, ikki yong‘oq bilan ritm berardi: toq-toq, tanaffus. Uchinchi «toq»da bitta yong‘oq panjasidan chiqib, yo‘l bo‘ylab dumaladi. Toshbaqa uni qobig‘i bilan to‘xtatdi.

— Qo‘shiqda tanaffus shuning uchun ham kerak, — dedi Nura.

Birinchi bo‘lib olmaxon uyiga yetdi. Kovak eshigi oldida u oxirgi ikki notani aytdi va shunaqa past egildiki, dumi boshini yopib qoldi. Puf yana kuldi, lekin endi kulgisi ham uyquli edi. Olmaxon savatini ichkariga qo‘yib, derazadan ikki marta «toq-toq» deb xayrlashdi.

Tepalik oldida quyonlar uyiga yetdi. Puf yalpiz hidini sezib, bir qadam ichkariga kirdi. Keyin toshbaqaga qaradi.

— Men qo‘shiqni oxirigacha aytib boraman.

U do‘stlar bilan yana bir oz yo‘l yurdi. Katta tosh yonida qo‘shiq birdan sustlashdi: yorug‘qo‘ng‘izlar har tomonga tarqalib ketgan edi. {{HERO}} quloq soldi. Ho‘l barg ustidan yolg‘izgina «pi»ga o‘xshagan miltillash ko‘rindi. Bitta kichik yorug‘qo‘ng‘iz ortda qolibdi.

Nura tanish uch notani aytdi. Puf o‘zining kulgili ingichka «pi»sini qo‘shdi. Yorug‘qo‘ng‘iz yonib, do‘stlari tomonga uchdi. Bir lahzadan keyin yo‘l ustida yana ko‘p mayda chiroqlar uchardi. Puf esa eng g‘alati notasi eng foydali bo‘lib chiqqanini faxr bilan aytdi.

Ariqqa yaqin eski daraxt kovagi ularning qo‘shig‘ini qaytarib yubordi. Puf «pi» dedi, kovak ham «pi-i» deb javob berdi. U pastroq ovozda sinab ko‘rdi, javob ham pastroq bo‘ldi. Puf daraxt ichida ko‘rinmas qo‘shiqchi yashasa kerak, deb pichirladi. Nura hech narsani tushuntirmay, {{HERO}}ga ko‘z qisdi.

Toshbaqa uyiga eng oxirida yetdi. U quruq yaproq ostiga joylashib:

— Endi bu qo‘shiqni ko‘zimni yumib ham taniyman, — dedi.

Ortga qaytganda hech kim qo‘shiqni boshidan oxirigacha aytmadi. Qayin yonida Nura ikki nota kuyladi. Ariq oldida {{HERO}} bitta nota bilan javob berdi. Uzoqdagi olmaxon derazasidan «toq-toq» eshitildi. Shu tovushlarning o‘zi butun yo‘lni eslatishga yetardi.

Qaytishda ariq yonidagi mitti qurbaqa qo‘shiqning «sh-sh-sh» qismini eshitib, suvdan boshini chiqardi. U ham kuylamoqchi bo‘ldi, ammo faqat «vaq» dedi. Puf bir lahza o‘ylab, bu ham yomon nota emasligini aytdi. Nura esa bugungi qo‘shiqda joy qolganini bildirib kuldi.

Eski to‘nka oldida Puf nihoyat xayrlashdi. U iniga qarab uch qadam yugurdi, keyin charchaganini eslab, oddiy yurishga o‘tdi. Nura jilmaydi. Yorug‘qo‘ng‘izlar maysa orasiga qo‘ndi, ariq qo‘shiqning o‘z qismini davom ettirdi, o‘rmon esa asta-sekin tungi tovushlar bilan qoldi. Uzoqdagi in eshigi yopildi. So‘ng faqat barglarning shitiri va suvning «sh-sh-sh»i eshitilib turdi.`,
        },
        icon: `🎵`,
        values: ['friendship', 'curiosity'],
      },
    },
  },
  magic_garden: {
    titleOne: {
      ru: `Лунные цветы у фонтана`,
      uz: `Favvora yonidagi oy gullari`,
    },
    episodeOne: {
      ru: `В Волшебном саду вечер начинался с одного и того же чуда: как только над фонтаном появлялась первая звезда, лунные цветы открывали серебряные лепестки. Для тебя их пробуждение было любимым вечерним чудом. Рядом ползла улитка Мирай, а на ручке маленькой лейки сидела птица Лило.

Но сегодня первый цветок не открылся.

Второй тоже остался закрытым. Третий чуть приподнял лепесток и снова спрятался.

— Они что, решили проспать собственный вечер? — удивилась Лило.

Мирай потрогала землю усиком. У одного куста она была сухой, у другого — прохладной. Между клумбами лежала дорожка из светлых лепестков, но без раскрытых цветов её узор почти исчез. Лило попыталась найти дорогу сверху, взмахнула крыльями и тут же вернулась: к клюву прилип маленький лепесток, и она стала похожа на птицу с розовыми усами.

Лепесток сняли, и твой смех смешался с щебетом Лило.

Возле фонтана стояли две вещи. Мирай принесла лейку с водой. А Лило собрала в круглую стеклянную чашу несколько светлячков. Они не сидели на месте и то и дело выстраивались внутри в разные фигурки: кружок, змейку, маленькую корону.

Вместе с тобой друзья прошли вдоль клумбы. Один бутон стоял у сухого камня. Другой повернулся к отражению звезды в воде. Третий едва заметно дрогнул, когда светлячок подлетел ближе к стеклу.

Вдруг из-под листа раздалось: «Плюх!»

Все трое заглянули вниз. Маленькая капля росы скатилась по стеблю и упала прямо на нос Мирай. Улитка медленно подняла глаза.

— Я всё проверяла, — сказала она. — Кроме неба.

Лило засмеялась так звонко, что один закрытый цветок чуть-чуть качнулся. Это сразу заметили и ты, и Мирай. Похоже, цветы реагировали на всё вокруг: на воду, свет, звук, даже на движение теней.

Мирай показала на сухую полоску земли у корней.

— Здесь точно хочется пить.

Лило заглянула в чашу.

— А эти пятеро очень хотят танцевать.

Она начала считать, но на «пять» один огонёк спрятался за другим, и пришлось начинать сначала. На «четыре» спрятался уже другой.

На самом маленьком цветке перед тобой блеснула тонкая серебряная полоска на бутоне. Она то появлялась, то исчезала. Будто цветок хотел открыться, но никак не решался.

Мирай подвинула лейку ближе. Лило поставила чашу рядом. Вода могла напоить сухие корни. Светлячки могли показать цветам, куда повернуться. Сад выглядел бы совсем по-разному в зависимости от решения.

У маленького бутона вся компания собралась рядом с тобой.

— {{HERO}}, с чего начнём?

Лило перестала считать. Мирай подняла усики. Даже светлячки внутри чаши на секунду собрались в ровный круг. Выбор ждал тебя.`,
      uz: `Sehrli bog‘da har oqshom bir xil kichkina mo‘jiza bo‘lardi: favvora ustida birinchi yulduz ko‘rinishi bilan oy gullari kumushrang gulbarglarini ochardi. {{HERO}} ularning uyg‘onishini tomosha qilishni yaxshi ko‘rardi. Yonida Miroy ismli shilliqqurt sekin yurardi, kichkina qush Lilo esa sug‘orgichning dastasida o‘tirardi.

Ammo bu safar birinchi gul ochilmadi.

Ikkinchisi ham yopiq qoldi. Uchinchisi bitta gulbargini sal ko‘tardi-yu, yana yopdi.

— Ular o‘z oqshomini uxlab o‘tkazmoqchimi? — dedi Lilo hayron bo‘lib.

Miroy tuproqni mo‘ylovchasi bilan tekshirdi. Bir joy quruq, boshqa joy nam edi. Gulzorlar orasidagi oqish gulbarg yo‘li ham deyarli ko‘rinmay qolgandi. Gullar ochilmasa, yo‘lning naqshi ham yo‘qolib ketardi.

Lilo tepaga uchib, yo‘lni yuqoridan ko‘rmoqchi bo‘ldi. Birpasdan so‘ng qaytib tushdi, lekin tumshug‘iga pushti gulbarg yopishib qolgan edi. U endi pushti mo‘ylovli qushga o‘xshardi.

{{HERO}} kulib, gulbargni ehtiyotkorlik bilan olib tashladi.

Favvora yonida ikki narsa tayyor turardi. Miroy suv to‘la kichkina sug‘orgich olib kelgan edi. Lilo esa dumaloq shisha kosaga bir nechta yorug‘qo‘ng‘iz yig‘ib qo‘ygandi. Ular joyida turmay, kosa ichida turli shakl yasardi: doira, uzun chiziq, keyin kichkina toj.

{{HERO}} gulzor bo‘ylab yurdi. Bitta g‘uncha quruq tosh yonida edi. Boshqasi suvdagi yulduz aksiga qarab turardi. Yana biri yorug‘qo‘ng‘iz shishaga yaqinlashganda sal qimirlagandek bo‘ldi.

Shu payt barg tagidan «plop» degan ovoz chiqdi.

Hamma pastga qaradi. Katta shudring tomchisi poyadan sirg‘alib tushib, to‘g‘ri Miroyning burniga qo‘ndi. Shilliqqurt ko‘zlarini yuqoriga ko‘tardi.

— Men hamma narsani tekshirdim, — dedi u. — Faqat osmonni emas.

Lilo kulib yubordi. Uning ovozidan yopiq gullardan biri sal tebrandi. {{HERO}} buni ko‘rib, yoniga cho‘kkaladi. Gullar atrofdagi narsalarni sezayotgandek edi: suvni, yorug‘likni, tovushni, hatto soyalarni ham.

Favvoraga yana bitta tomchi tushdi. Suv yuzidagi halqa birinchi yulduzning aksini yoyib yubordi. Lilo aks ortidan tumshug‘ini burib qaradi, keyin haqiqiy yulduzni topish uchun osmonga tikildi. U bir necha marta tepaga-pastga qarab, oxiri boshi aylanib qolgandek ko‘zini yumdi. {{HERO}} bilan Miroy kuldi. Yopiq gul esa shu payt yana sal qimir etdi.

Miroy ildiz yonidagi quruq tuproqni ko‘rsatdi.

— Bu yerga suv kerak.

Lilo esa kosaga qaradi.

— Bu beshtasi esa raqsga tushmoqchi.

U yorug‘qo‘ng‘izlarni sanay boshladi. «Besh» deganda bittasi boshqasining orqasiga yashirindi. Lilo boshidan boshladi. «To‘rt» deganda endi boshqa biri berkinib oldi.

Eng kichik g‘unchada {{HERO}} ingichka kumush chiziqni ko‘rdi. U goh paydo bo‘lar, goh yo‘qolardi. Gul ochilishni xohlab, hali qandaydir yordam kutayotgandek edi.

Miroy sug‘orgichni yaqinroq surdi. Lilo kosani qo‘ydi. Suv quruq ildizlarga yordam berishi mumkin edi. Yorug‘qo‘ng‘izlar esa gullarga qayerga burilishni ko‘rsatardi.

{{HERO}} g‘uncha yoniga tiz cho‘kdi.

— Qaysisidan boshlaymiz?

Lilo sanashni to‘xtatdi. Miroy mo‘ylovlarini ko‘tardi. Yorug‘qo‘ng‘izlar ham bir lahza dumaloq shaklga tizildi. Tanlov {{HERO}}da edi.`,
    },
    vocabulary: [
      { word: `лепесток`, translation: `petal`, example: `Перед {{HERO}} у фонтана блеснул серебряный лепесток.` },
      { word: `роса`, translation: `dew`, example: `На цветке блестела капля росы.` },
    ],
    choices: {
      'choice-a': {
        text: {
          ru: `Напоить сухие корни`,
          uz: `Quruq ildizlarga suv quyish`,
        },
        effect: {
          ru: `После выбора ты сухие корни получили воду, и первый лунный цветок раскрыл серебряный лепесток.`,
          uz: `{{HERO}} quruq ildizlarga suv quydi va birinchi oy guli kumushrang gulbargini ochdi.`,
        },
        resolution: {
          ru: `Ты льёшь немного воды у корней самого маленького бутона. На стебле появляется блестящая капля и ползёт вверх, как бусинка. Бутон раскрывает первый серебряный лепесток. Мирай стучит усиками по раковине, а Лило шепчет: «Цветок поздоровался!»`,
          uz: `{{HERO}} eng kichik g‘uncha ildiziga ozgina suv quydi. Poyada yaltiragan tomchi paydo bo‘lib, munchoqdek tepaga ko‘tarildi. G‘uncha birinchi kumush gulbargini ochdi. Miroy qobig‘ini mo‘ylovlari bilan taqillatdi, Lilo esa: «Gul salom berdi!» deb pichirladi.`,
        },
        seed: {
          ru: `Следующий бутон у фонтана оказался совсем не таким сонным, как казался.`,
          uz: `Favvora yonidagi keyingi g‘uncha ko‘ringanidan ancha qiziqroq bo‘lib chiqdi.`,
        },
        titleTwo: {
          ru: `Капли на серебряных лепестках`,
          uz: `Kumush gulbarglardagi tomchilar`,
        },
        episodeTwo: {
          ru: `Следующий бутон рос у самого фонтана. Земля вокруг него была тёмной, но под широким листом прятался сухой круг. Лист приподняли, и под него попало совсем немного воды.

Лило наклонилась так низко, что чуть не свалилась в фонтан.

— {{HERO}}, открывается!

Сначала показался один лепесток. Потом второй. Потом цветок неожиданно стряхнул с себя целую горсть росы. Несколько капель попали прямо на раковину Мирай. Улитка замерла, посмотрела на себя и важно сказала:

— Теперь у меня праздничная крыша.

На серебряной раковине капли действительно сверкали, как маленькие фонарики.

Друзья пошли дальше вдоль клумбы. Вода из твоей лейки попадала только туда, где земля была сухой. Иногда цветок открывался сразу, иногда приходилось подождать. Один крошечный бутон вообще не двинулся. Мирай уже хотела проверить корни ещё раз, но Лило заметила, что на его лепестке лежит тяжёлая капля росы.

Твои пальцы слегка задели соседний лист. Капля скатилась вниз. Бутон расправился и оказался ярко-голубым внутри.

В середине цветка сидела крошечная божья коровка. Она, похоже, всё это время спала под закрытыми лепестками. Божья коровка потянулась, раскрыла крылышки и перелетела на нос Лило.

— Сегодня все выбирают мой нос, — пожаловалась птица, стараясь не смеяться.

Божья коровка посидела секунду и улетела к фонтану.

Тогда произошло ещё одно чудо. На каждом раскрытом цветке появилась маленькая голубая точка. Точки шли одна за другой между клумбами и снова сложились в лепестковую дорожку. Только теперь она была не серебряной, а серебряно-голубой.

— Я знала, что дорожка никуда не делась, — сказала Мирай. — Она просто ждала цветов.

Лило полетела по точкам вперёд и вернулась с новостью: дорожка приводит обратно к фонтану, а возле него уже открылся самый первый цветок. Тот самый, который долго не хотел просыпаться.

Когда друзья подошли ближе, цветок чуть наклонился к тебе. Из его середины выкатилась круглая капля и плюхнулась в воду. По фонтану разошлись кольца, и в каждом на секунду отразилась звезда.

Лило снова попыталась пересчитать огоньки в отражениях, но сбилась и решила, что на сегодня математики достаточно. Мирай устроилась на тёплом камне. Её «праздничная крыша» уже почти высохла.

Последняя пригоршня воды из твоей ладони досталась маленькому сухому участку у дорожки. Там не было цветка, зато через минуту из земли показался тонкий зелёный росток.

— О, — сказала Лило. — Похоже, завтра нас кто-то удивит.

Никто не стал будить росток вопросами. Лейку оставили возле фонтана рядом с тобой. Лунные цветы один за другим начали складывать лепестки. Голубые точки становились всё бледнее, пока дорожка не превратилась в обычную полоску между клумбами.

Лило спрятала голову под крыло. Мирай зевнула так широко, как умеют зевать только улитки. Фонтан плеснул ещё раз. Перед уходом твой взгляд задержался на маленьком зелёном ростке. Сад получил пожелание доброй ночи, а дорожка повела домой. За спиной серебряные лепестки закрылись окончательно, а на раковине Мирай осталась одна крошечная капля, похожая на звезду.`,
          uz: `Keyingi g‘uncha favvoraning yonida o‘sardi. Atrofidagi tuproq qoramtir edi, ammo katta barg tagida quruq doira yashirinib yotgandi. {{HERO}} bargni ko‘tarib, o‘sha joyga ozgina suv quydi.

Lilo shunaqa egildiki, sal qolsa favvoraga tushardi.

— Ochildi!

Avval bitta gulbarg ko‘rindi. Keyin ikkinchisi. Birdan gul ustidagi shudringni silkitdi. Bir necha tomchi Miroyning qobig‘iga tushdi. Shilliqqurt qimirlamay turib, o‘ziga qaradi.

— Endi tomim bayramga tayyor, — dedi u.

Kumush qobiq ustidagi tomchilar rostdan ham mayda chiroqlardek yaltirardi.

Do‘stlar gulzor bo‘ylab yurdi. {{HERO}} faqat quruq joylarga suv quyardi. Ba’zi gullar darrov ochildi, ba’zilari esa biroz kutdi. Bitta juda kichik g‘uncha umuman qimirlamadi. Miroy yana ildizni tekshirmoqchi bo‘ldi, Lilo esa gulbarg ustida juda katta shudring tomchisini ko‘rib qoldi.

{{HERO}} yonidagi bargga tegdi. Tomchi sirg‘alib tushdi. G‘uncha birdan ochilib, ichi moviy rangda ekanini ko‘rsatdi.

Gulning ichida mitti xonqizi uxlab yotgan ekan. U cho‘zildi, qanotini ochdi va to‘g‘ri Lilo tumshug‘iga qo‘ndi.

— Bugun hamma mening burnimni tanlayapti, — dedi Lilo kulmaslikka urinib.

Xonqizi bir oz o‘tirib, keyin favvora tomon uchib ketdi.

Shunda yana bir mo‘jiza yuz berdi. Har bir ochilgan gulning markazida kichkina moviy nuqta yondi. Nuqtalar gulzorlar orasida ketma-ket joylashib, gulbarg yo‘lini qayta chizdi. Endi yo‘l kumush va moviy rangda edi.

— Men bilardim, yo‘l yo‘qolmagan, — dedi Miroy. — U gullarni kutgan ekan.

Lilo nuqtalar bo‘ylab oldinga uchib, yana qaytdi. Yo‘l yana favvoraga olib kelardi. Favvora yonidagi birinchi gul ham endi to‘liq ochilgan edi.

{{HERO}} yaqinlashganda, gul sal egildi. Markazidagi dumaloq tomchi suvga tushdi. Favvora yuzida halqalar tarqaldi, har bir halqada bir lahza yulduz aksi paydo bo‘ldi.

Lilo yulduz akslarini sanashga urindi, yana adashdi va bugunga hisob-kitob yetadi, deb qo‘ydi. Miroy issiq tosh ustiga joylashdi. Uning «bayram tomi» ham deyarli qurib bo‘lgandi.

{{HERO}} kaftiga ozgina suv olib, yo‘l chetidagi oxirgi quruq joyga quydi. U yerda gul yo‘q edi. Lekin bir ozdan so‘ng tuproqdan nozik yashil nihol ko‘rindi.

— Voy, — dedi Lilo. — Ertaga kimdir bizni hayron qoldiradi shekilli.

Ular niholni savol bilan bezovta qilmadi. {{HERO}} sug‘orgichni favvora yoniga qo‘ydi. Oy gullari bittadan gulbarglarini yopa boshladi. Moviy nuqtalar xiralashib, yo‘l oddiy yo‘lakka aylandi.

Shu payt favvora chetidagi xonqizi yana qaytib keldi va yangi nihol ustiga qo‘ndi. Lilo ko‘zini qisib, «bu safar mening burnimni tanlamadi», dedi. Miroy nihol yoniga mitti tosh qo‘yib, ertalab hech kim uni bosib ketmasligini aytdi.

Lilo boshini qanoti ostiga oldi. Miroy katta esnadi. Favvora yana bir marta «plop» dedi. {{HERO}} yashil niholga qarab, bog‘ga xayrli tun tiladi va uyiga ketdi. Orqada kumush gulbarglar butunlay yopildi. Miroyning qobig‘ida esa tonggacha saqlanadigandek bitta kichkina tomchi yulduzcha bo‘lib yaltirab qoldi. Lilo qanoti ostidan bir marta ko‘z tashlab, yana uxlab qoldi.`,
        },
        icon: `💧`,
        values: ['care_for_nature', 'kindness'],
      },
      'choice-b': {
        text: {
          ru: `Позвать светлячков на танец`,
          uz: `Yorug‘qo‘ng‘izlarni raqsga chorlash`,
        },
        effect: {
          ru: `После выбора ты светлячки вылетели из чаши, и их танец помог лунным цветам повернуться к свету.`,
          uz: `{{HERO}} yorug‘qo‘ng‘izlarni uchirdi va ularning raqsi oy gullariga nur tomonga burilishga yordam berdi.`,
        },
        resolution: {
          ru: `Ты открываешь чашу возле закрытых цветов. Светлячки вылетают один за другим, и один садится Лило на макушку. Ближайший бутон поворачивается к огоньку и раскрывает два серебряных лепестка. Остальные светлячки летят дальше вдоль клумбы.`,
          uz: `{{HERO}} kosani yopiq gullar yonida ochdi. Yorug‘qo‘ng‘izlar bittadan uchib chiqdi, bittasi Lilo boshiga qo‘ndi. Eng yaqin g‘uncha yorug‘lik tomonga burilib, ikki kumush gulbargini ochdi. Qolgan yorug‘qo‘ng‘izlar gulzor bo‘ylab oldinga uchdi.`,
        },
        seed: {
          ru: `У следующего цветка светлячки придумали новую игру.`,
          uz: `Keyingi gul yonida yorug‘qo‘ng‘izlar yangi o‘yin o‘ylab topdi.`,
        },
        titleTwo: {
          ru: `Танец светлячков`,
          uz: `Yorug‘qo‘ng‘izlar raqsi`,
        },
        episodeTwo: {
          ru: `У следующего цветка светлячки придумали новую игру. Два огонька летели справа, два слева, а один кружился посередине. Бутон поворачивался за ними и понемногу раскрывался, будто следил за танцем.

Лило всё ещё несла светлячка на голове.

— Я теперь часть представления, — прошептала она.

Мирай проползла по краю дорожки и оставила за собой тонкую блестящую линию. Светлячки заметили её и выстроились вдоль следа. Получилась целая светящаяся змейка. Светящаяся змейка повела тебя за собой, а лунные цветы по обе стороны стали открываться один за другим.

Один маленький бутон упорно смотрел в другую сторону. Светлячки кружили перед ним, но он не двигался. Причина оказалась прямо перед тобой: его стебелёк зацепился за сухую травинку.

Сухую травинку осторожно отвели от стебля. Бутон тут же повернулся и раскрылся так быстро, что светлячок на голове Лило от неожиданности взлетел.

— {{HERO}}, моя корона! — пискнула Лило и тут же засмеялась.

Освободившийся огонёк присоединился к остальным. Теперь они сложились над дорожкой в большую светящуюся спираль. Сверху она была похожа на раковину Мирай.

— Очень хороший рисунок, — одобрила улитка.

Спираль медленно двигалась к фонтану. Каждый цветок, мимо которого она проходила, открывал серебряные лепестки. В воде появлялись золотые отражения, и казалось, будто под фонтаном тоже летает маленькая стая светлячков.

У последнего куста огоньки вдруг погасли.

Все остановились. Через секунду один светлячок вспыхнул. Потом второй. Потом все остальные разом. Они просто устроили короткую игру в прятки. Лило возмущённо покачала головой, а Мирай смеялась так, что её усики дрожали.

На краю фонтана один огонёк заметил собственное отражение и начал летать вверх-вниз. Отражение повторяло всё за ним. Светлячок остановился. Отражение тоже. Он сделал круг. Отражение сделало круг.

— Кажется, он нашёл друга, который всё повторяет.

Лило наклонилась к воде и показала отражению язык. Все засмеялись, а светлячки на секунду сбились с рисунка.

Когда все лунные цветы раскрылись, лепестковая дорожка снова стала видна. На этот раз между серебряными лепестками мерцали золотые точки. Светлячки вернулись к чаше, но несколько остались возле самого маленького цветка, словно ночники.

На краю фонтана нашлось место и для тебя. Мирай спрятала голову в раковину, потом высунулась обратно, потому что забыла пожелать всем доброй ночи. Лило устроилась рядом и прикрыла глаза.

Один за другим цветы начали закрываться. Светлячки тоже гасили огоньки: сначала ярко, потом чуть слабее, потом совсем маленькими искрами. Последний огонёк мигнул тебе у дорожки. Фонтан отразил его и отпустил.

Сад снова стал тёмным, но теперь в темноте легко угадывались знакомые клумбы. Где-то под листом ещё раз смешно фыркнула Мирай. Лило, Мирай и лунные цветы получили от тебя пожелание доброй ночи. Пора было идти домой. Последний светлячок устроился на листе рядом с чашей, словно тоже нашёл себе кроватку, и больше в саду никто никуда не летел.`,
          uz: `Keyingi gul yonida yorug‘qo‘ng‘izlar o‘yin o‘ylab topdi. Ikkitasi o‘ng tomondan, ikkitasi chap tomondan uchdi, bittasi esa o‘rtada aylana chizdi. G‘uncha ularni kuzatib, asta-sekin ochila boshladi.

Lilo hali ham boshida bitta yorug‘qo‘ng‘iz bilan yurardi.

— Men ham tomoshaning bir qismi bo‘lib qoldim, — dedi u pichirlab.

Miroy yo‘l chetidan yurib, ortidan ingichka yaltiragan iz qoldirdi. Yorug‘qo‘ng‘izlar shu izni ko‘rib, uning ustiga tizildi. Uzun yorug‘ iloncha paydo bo‘ldi. {{HERO}} uning ortidan yurdi. Ikki tomondagi oy gullari birin-ketin ochilardi.

Bitta kichkina g‘uncha esa boshqa tomonga qarab turardi. Yorug‘qo‘ng‘izlar oldida aylansa ham, u qimirlamadi. {{HERO}} sababini ko‘rdi: uning poyasi quruq maysaga ilinib qolgan edi.

{{HERO}} maysani ehtiyotkorlik bilan ajratdi. G‘uncha shu zahoti burilib, shunaqa tez ochildiki, Lilo boshidagi yorug‘qo‘ng‘iz ham uchib ketdi.

— Tojim! — dedi Lilo, keyin o‘zi kulib yubordi.

Uchib ketgan yorug‘qo‘ng‘iz do‘stlariga qo‘shildi. Endi ular yo‘l ustida katta yorug‘ spiral yasadi. Yuqoridan u Miroyning qobig‘iga o‘xshardi.

— Juda chiroyli naqsh, — dedi Miroy mamnun bo‘lib.

Spiral favvora tomon surildi. U qaysi gul yonidan o‘tsa, kumush gulbarglar ochilardi. Suvda oltin akslar ko‘payib, go‘yo favvora ichida ham kichkina yorug‘qo‘ng‘izlar uchayotgandek ko‘rinardi.

Oxirgi buta yonida barcha chiroqlar birdan o‘chdi.

{{HERO}} to‘xtadi. Bir soniyadan keyin bittasi yondi. Keyin ikkinchisi. So‘ng hammasi birdan miltilladi. Ular shunchaki berkinmachoq o‘ynagan ekan. Lilo «ha-a» deb boshini qimirlatdi, Miroy esa shunaqa kuldiki, mo‘ylovlari tebranib ketdi.

Favvora chetida bitta yorug‘qo‘ng‘iz suvdagi o‘z aksini ko‘rib qoldi. U tepaga uchdi, aksi ham tepaga bordi. U to‘xtadi, aksi ham to‘xtadi. U aylana chizdi, suvdagi do‘sti ham aynan shuni takrorladi.

— U o‘ziga hamma narsani qaytaradigan do‘st topdi, — dedi {{HERO}}.

Lilo suvga egilib, aksiga tilini ko‘rsatdi. Hamma kuldi, yorug‘qo‘ng‘izlar esa bir lahza naqshni unutib yubordi.

Barcha oy gullari ochilganda gulbarg yo‘li yana ko‘rindi. Kumush gulbarglar orasida oltin nuqtalar yaltirardi. Yorug‘qo‘ng‘izlar kosaga qaytdi, lekin bir nechtasi eng kichik gul yonida tungi chiroqdek qolib turdi.

{{HERO}} favvora chetiga o‘tirdi. Miroy qobig‘iga kirib oldi, keyin xayrli tun aytishni unutganini eslab, boshini yana chiqardi. Lilo yoniga joylashib, ko‘zlarini yumdi.

Miroy kosa yoniga kichkina yaproq qo‘yib, yorug‘qo‘ng‘izlar ham dam olishi uchun «yostiq» tayyorladi. Lilo bu yostiq ularga juda katta ekanini aytdi. Bir yorug‘qo‘ng‘iz darrov yaproq ustiga qo‘nib, go‘yo aksini isbotlagandek qimirlamay qoldi.

Gullar birin-ketin yopila boshladi. Yorug‘qo‘ng‘izlar ham chiroqlarini pasaytirdi: avval yorqin, keyin xira, keyin kichkina uchqun kabi.

Oxirgi yorug‘qo‘ng‘iz yo‘l chetida {{HERO}}ga bir marta miltilladi. Favvora uning aksini bir lahza ushlab, keyin qorong‘iga qaytardi. Bog‘ yana qorong‘i bo‘ldi, ammo endi gulzorlarning qayerdaligi bilinib turardi. {{HERO}} Lilo, Miroy va oy gullariga xayrli tun tilab, uyiga ketdi. Kosaning yonidagi bitta yorug‘qo‘ng‘iz yaproq «yostiq» ustiga qo‘ndi va shu yerda qimirlamay qoldi. Bog‘ ham unga qo‘shilib dam olayotgandek edi.`,
        },
        icon: `✨`,
        values: ['curiosity', 'care_for_nature'],
      },
    },
  },
  stars_and_space: {
    titleOne: {
      ru: `Тихий сигнал станции «Люмен»`,
      uz: `«Lyumen»dagi tun pochtasi`,
    },
    episodeOne: {
      ru: `Ночью станция «Люмен» была похожа на дом с очень большим круглым окном. За стеклом висели звёзды, а внутри горели только маленькие лампы у пола. У тебя и у робота Пико было вечернее дело: подготовить место для ночной почты.

Каждый вечер к «Люмену» прилетала маленькая серебряная почтовая капсула. Она привозила рисунки, открытки и короткие письма от детей с соседней станции. Пико всегда первым замечал её мигающий огонёк.

Но сегодня огонёк появился и снова исчез.

— Видел? — спросил Пико.

У окна вы с Пико оказались. Далеко в темноте снова мигнула крошечная серебряная точка.

— Она нас ищет, — сказал Пико. — Обычно у нашего окна горит золотой маяк. Сегодня лампа не включилась.

Пико открыл ящик с запасными вещами. В ящике лежали моток мягкой ленты, круглый золотой фонарь и лист светящихся звёздочек. Пико сначала вытащил ленту, запутался в ней одной рукой и попросил тебя спасти его от «очень серьёзного ленточного чудовища». Через минуту лента снова лежала в ящике, а Пико держал фонарь и звёздочки.

Одна звёздочка сразу прилипла Пико ко лбу.

— Теперь я часть неба, — сообщил робот.

Звёздочку сняли со лба Пико и приклеили на край окна рядом с тобой. Пико достал ещё несколько. Можно было зажечь золотой фонарь у стекла, чтобы почтовая капсула увидела один яркий огонёк. А можно было сложить из светящихся звёздочек большую птицу, крыло которой показывало бы на «Люмен».

Пока они думали, серебряная точка снова мигнула два раза.

На столе уже ждали три пустых рамки. Пико рассказал, что обычно в них ставят самые смешные рисунки из ночной почты. Вчера им прислали кота в космическом шлеме. Позавчера — Луну в красных носках.

— Красные носки были особенно убедительными, — сказал Пико.

Пико услышал твой смех. Потом оба посмотрели в окно. Почтовая капсула была уже немного ближе. Она летела сама и никуда не пропадала, просто не могла понять, какое из множества огоньков впереди — окно «Люмена».

Пико поднял золотой фонарь.

— Один большой свет.

Потом показал лист звёздочек.

— Или целая звёздная птица.

На стекле перед тобой появились четыре звёздочки. Из них уже получалось маленькое крыло. Пико поставил рядом фонарь, и золотой круг лёг на стекло.

За окном снова мигнула серебряная точка. На этот раз будто прямо им в ответ.

— {{HERO}}, каким знаком позовём нашу ночную почту домой? — спросил Пико.

Перед тобой лежали золотой фонарь и россыпь звёздочек. Выбор оставался за тобой.`,
      uz: `Kechasi «Lyumen» bekati juda katta dumaloq oynali uyga o‘xshardi. Oyna ortida yulduzlar ko‘rinardi, ichkarida esa faqat pol bo‘ylab mayda tungi chiroqlar yonardi. {{HERO}} robot Piko bilan tun pochtasi uchun joy tayyorlayotgan edi.

Har oqshom «Lyumen»ga kichkina kumush pochta kapsulasi kelardi. U qo‘shni bekatdagi bolalarning rasmlari, otkritkalari va qisqa xatlarini olib kelardi. Piko uning miltillagan chirog‘ini doim hammadan oldin ko‘rardi.

Ammo bu safar kichkina chiroq bir ko‘rindi-yu, yana yo‘qoldi.

— Ko‘rdingmi? — dedi Piko.

{{HERO}} oynaga yaqinlashdi. Uzoqda yana kumush nuqta miltilladi.

— U bizni qidiryapti, — dedi Piko. — Odatda derazamiz yonida oltin mayoq yonadi. Bugun esa chiroq ishlamadi.

Piko zaxira buyumlar solingan qutini ochdi. Ichida yumshoq lenta, dumaloq oltin chiroq va yopishtiriladigan yorug‘ yulduzchalar bor edi. Piko avval lentani tortib chiqardi, bir qo‘liga o‘ralib qoldi va {{HERO}}dan uni «juda jiddiy lenta maxluqi»dan qutqarishni so‘radi. Bir ozdan keyin lenta yana qutida yotar, Piko esa oltin chiroq bilan yulduzchalarni ushlab turardi.

Bitta yulduzcha darrov Piko peshonasiga yopishib qoldi.

— Endi men ham osmonning bir bo‘lagiman, — dedi robot.

{{HERO}} yulduzchani olib, oynaning chetiga yopishtirdi. Oltin chiroqni yoqib, oynaga yaqin qo‘ysa, pochta kapsulasi bitta aniq nurga qarab kelishi mumkin edi. Yoki yulduzchalardan katta qush yasab, uning qanotini «Lyumen» tomon qaratish mumkin edi.

Ular o‘ylab turganda, kumush nuqta yana ikki marta miltilladi.

Piko oynaning chetidagi kichkina magnitlarni ham tekshirib chiqdi. Bittasi dumaloq, bittasi uchburchak, bittasi esa oycha shaklida edi. Oycha magnit Piko barmog‘iga yopishib qoldi. U qo‘lini silkib ko‘rdi, lekin magnit ketmadi. {{HERO}} uni olib oynaga qo‘ydi. Piko bu kecha narsalar undan ajralishni xohlamayapti, deb kuldi.

Stol ustida uchta bo‘sh ramka turardi. Piko tun pochtasidan kelgan eng kulgili rasmlarni shu yerga qo‘yishlarini aytdi. Kecha ularga kosmik dubulg‘a kiygan mushuk rasmi kelgan. Undan oldingi kuni esa Oy qizil paypoq kiyib olgan rasm kelibdi.

— Qizil paypoqlar juda yarashgan edi, — dedi Piko jiddiy ohangda.

{{HERO}} kulib, yana oynaga qaradi. Kapsula endi sal yaqinroq edi. U yo‘qolmagan, faqat oldidagi ko‘p chiroqlar orasidan qaysi biri «Lyumen»niki ekanini topolmayotgandi.

Piko oltin chiroqni ko‘tardi.

— Bitta katta nur.

Keyin yulduzchalar varag‘ini ko‘rsatdi.

— Yoki butun bir yulduz qushi.

{{HERO}} oynaga to‘rtta yulduzcha yopishtirdi. Ular kichik qanotga o‘xshay boshladi. Piko yoniga oltin chiroqni qo‘ydi, uning nuri shishada dumaloq iz qoldirdi.

Uzoqdagi kumush nuqta yana miltilladi. Bu safar xuddi ularga javob bergandek.

— Xo‘sh, — dedi Piko, — tun pochtasiga uyimizni qaysi belgi bilan ko‘rsatamiz?

{{HERO}} bir oltin chiroqqa, bir yulduzchalarga qaradi. Tanlov unda edi.`,
    },
    vocabulary: [
      { word: `созвездие`, translation: `constellation`, example: `Перед {{HERO}} на окне сложилось простое созвездие.` },
      { word: `мерцать`, translation: `to twinkle`, example: `За окном продолжали мерцать звёзды.` },
    ],
    choices: {
      'choice-a': {
        text: {
          ru: `Зажечь золотой огонёк у окна`,
          uz: `Oyna yonida oltin chiroqni yoqish`,
        },
        effect: {
          ru: `После выбора ты у окна зажёгся золотой маяк, и ночная почта увидела окно «Люмена».`,
          uz: `{{HERO}} oltin chiroqni yoqdi va tun pochtasi «Lyumen» oynasini ko‘rdi.`,
        },
        resolution: {
          ru: `Ты ставишь золотой фонарь у круглого окна. Пико выключает соседнюю лампу, и тёплый круг на стекле становится ярче. Серебряная капсула мигает один раз, потом два и поворачивает к этому огоньку. Ночная почта нашла «Люмен».`,
          uz: `{{HERO}} oltin chiroqni dumaloq oyna yoniga qo‘ydi. Piko qo‘shni chiroqni o‘chirdi va oynadagi iliq doira yanada aniq ko‘rindi. Kumush kapsula bir marta, keyin ikki marta miltillab, shu nur tomonga burildi. Tun pochtasi «Lyumen»ni topdi Piko quvonib qo‘lini ko‘tardi: endi xatlar kerakli oynani aniq ko‘rib turardi.`,
        },
        seed: {
          ru: `Когда капсула стала ближе, между ней и окном проплыла горсть звёздных блёсток.`,
          uz: `Kapsula yaqinlashganda, oyna bilan uning orasidan yulduz changi suzib o‘tdi.`,
        },
        titleTwo: {
          ru: `Золотой маяк для лунной почты`,
          uz: `Tun pochtasi uchun oltin chiroq`,
        },
        episodeTwo: {
          ru: `Почтовая капсула становилась всё больше. Сначала она была как серебряная бусинка, потом — как маленькое яблоко, а потом на её боку стало видно круглое окошко.

Пико стоял рядом с золотым фонарём и считал мигания.

— {{HERO}}, смотри: один, два… один, два. Она отвечает нам.

Вдруг между станцией и капсулой проплыло облачко звёздной пыли. Оно было похоже на горсть блёсток, которую кто-то нечаянно рассыпал в темноте. Золотой свет на секунду стал слабее.

Пико посмотрел на тебя.

— Фонарь всё ещё здесь. Может, покажем его с другого окна?

Они взяли фонарь вдвоём и перенесли к соседнему круглому стеклу. Фонарь подняли повыше. Золотой круг снова появился в темноте, уже сбоку от блестящего облачка.

Серебряная капсула мигнула.

— Нашла! — обрадовался Пико.

Она обогнула пыль и приблизилась к станции. Никаких громких звуков не было. Только на панели у двери загорелась маленькая зелёная лампочка. Пико открыл почтовый ящик, соединённый с капсулой, и внутрь скользнули три плоских конверта.

Первый рисунок показывал кота в огромных тапочках. На втором была синяя планета с улыбкой. На третьем снова появилась Луна — на этот раз в полосатом шарфе.

— Носки закончились, — серьёзно заметил Пико.

Рисунки заняли пустые рамки рядом с тобой. Пико хотел выбрать самый смешной, но долго не мог решить между котом и Луной. В конце концов он поставил их рядом.

В последнем конверте лежала маленькая бумажная звезда. На ней не было написано ничего важного, только нарисованы четыре точки и улыбка. Бумажную звезду прикрепили возле золотого фонаря.

Пико нашёл в ящике ту самую мягкую ленту и на этот раз не запутался. Они натянули её под рамками и прищепками закрепили рисунки. Кот в тапочках оказался посередине. Луна в шарфе смотрела на него с соседней рамки. Пико немного отступил и сказал, что теперь почтовый уголок выглядит как маленькая выставка, которую можно увидеть ещё до завтрака.

Серебряная капсула снаружи мигнула один раз. Через стекло капсуле вы с Пико помахали. Пико тоже помахал, но слишком широко и задел локтем пустую коробку. Коробка медленно перевернулась, а робот сделал вид, будто именно так и было задумано.

Пико уменьшил свет. Большой круг стал меньше, потом превратился в мягкое золотое пятнышко.

— Теперь капсуле больше не нужно нас искать, — сказал он. — Она уже дома.

Снаружи серебряная капсула отдыхала возле станции. Облако блёсток уплыло дальше. В большом окне отражались рисунки, Пико и ты, а рядом светилась бумажная звезда.

Пико выключил последнюю яркую лампу. На «Люмене» остался только ночной свет у пола и маленький золотой маяк у окна. Луна в полосатом шарфе получила последний взгляд от тебя. Потом ты и Пико пожелали друг другу доброй ночи. За стеклом звёзды продолжали мерцать, а ночная почта больше никуда не спешила.`,
          uz: `Pochta kapsulasi asta-sekin kattalashib ko‘rina boshladi. Avval u kumush munchoqqa o‘xshardi. Keyin kichkina olmachadek bo‘ldi. Yaqinroq kelganda {{HERO}} uning yonidagi dumaloq oynachani ham ko‘rdi.

Piko oltin chiroq yonida turib, miltillashlarni sanardi. Piko kulib qo‘ydi.

— Bir, ikki... bir, ikki. U bizga javob beryapti.

Shu payt bekat bilan kapsula orasidan yulduz changining kichkina buluti suzib o‘tdi. U qorong‘ida kimdir bir hovuch yaltir-yultir kukun sochib yuborgandek ko‘rinardi. Oltin nur bir lahza xira tortdi.

Piko {{HERO}}ga qaradi.

— Chiroq shu yerda. Uni boshqa oynadan ko‘rsatamizmi?

Ular chiroqni birga ko‘tarib, yon tomondagi boshqa dumaloq oynaga olib bordi. {{HERO}} uni balandroq tutdi. Oltin doira yaltiragan bulutning chetidan yana ko‘rindi.

Kapsula darrov miltilladi.

— Topdi! — dedi Piko.

U yulduz changini aylanib o‘tib, bekatga yaqinlashdi. Hech qanday baland ovoz bo‘lmadi. Faqat eshik yonidagi panelda kichkina yashil chiroq yondi. Piko pochta qutisini ochdi, ichkariga uchta tekis konvert sirg‘alib kirdi.

Birinchi rasmda katta tapochka kiygan mushuk bor edi. Ikkinchisida kulib turgan ko‘k sayyora chizilgandi. Uchinchisida yana Oy paydo bo‘lgan, lekin bu safar bo‘ynida yo‘l-yo‘l sharf bor edi.

— Paypoqlar tugabdi, — dedi Piko juda jiddiy.

{{HERO}} rasmlarni bo‘sh ramkalarga joyladi. Piko qaysi biri eng kulgili ekanini uzoq tanlay olmadi. Oxiri mushuk bilan Oyni yonma-yon qo‘ydi.

Oxirgi konvert ichida kichkina qog‘oz yulduzcha ham bor edi. Unda to‘rtta nuqta va tabassum chizilgandi. {{HERO}} uni oltin chiroq yoniga ilib qo‘ydi.

Piko qutidan o‘sha yumshoq lentani oldi. Bu safar unga o‘ralib qolmadi. Ular lentani ramkalar ostiga tortib, rasmlarni kichik qisqichlar bilan osdi. Katta tapochkali mushuk o‘rtada qoldi. Sharfli Oy uning yonidan qarab turardi.

Piko bir qadam orqaga yurib:

— Endi bu joy kichkina ko‘rgazmaga o‘xshaydi. Ertalab turib darrov ko‘rsa bo‘ladi, — dedi.

Tashqaridagi kumush kapsula bir marta miltilladi. {{HERO}} unga qo‘l silkidi. Piko ham shunaqa katta silkidiki, tirsagi bilan bo‘sh qutini urib yubordi. Quti sekin ag‘darildi. Piko esa ataylab qilgandek jiddiy turib oldi.

{{HERO}} kulib yubordi.

Piko oltin chiroqning nurini pasaytirdi. Katta doira kichrayib, keyin mayin oltin dog‘chaga aylandi.

— Endi kapsula bizni qidirmaydi, — dedi Piko. — U uyiga yetdi.

Oyna ortida kumush kapsula bekat yonida turardi. Yaltiragan chang buluti uzoqlashib ketdi. Katta oynada rasmlar, Piko va {{HERO}}ning aksi ko‘rinardi. Ularning yonida qog‘oz yulduzcha osilib turardi.

Piko xonadagi oxirgi yorqin chiroqni ham o‘chirdi. «Lyumen»da faqat pol bo‘ylab tungi chiroqlar va oyna yonidagi kichkina oltin mayoq qoldi. {{HERO}} yo‘l-yo‘l sharfli Oyga qarab, Pikoga xayrli tun tiladi va dam olishga ketdi. Oyna ortidagi yulduzlar miltillashda davom etdi, tun pochtasi esa tinchgina joyida turardi.`,
        },
        icon: `🟡`,
        values: ['kindness', 'mutual_help'],
      },
      'choice-b': {
        text: {
          ru: `Сложить на стекле звёздную птицу`,
          uz: `Oynada yulduz qushini yasash`,
        },
        effect: {
          ru: `По твоему выбору на стекле появилась звёздная птица, и её светящееся крыло показало почте путь к «Люмену».`,
          uz: `{{HERO}} yulduz qushini yasadi va uning yorug‘ qanoti pochtaga «Lyumen» tomon yo‘l ko‘rsatdi.`,
        },
        resolution: {
          ru: `Ты приклеиваешь к стеклу светящиеся звёздочки: четыре становятся крылом, ещё три — хвостом. Одна звезда снова прилипает Пико ко лбу. Когда птица готова, серебряная капсула мигает и поворачивает к рисунку. Новый знак замечен.`,
          uz: `{{HERO}} oynaga yorug‘ yulduzchalarni yopishtirdi: to‘rttasi qanot, yana uchtasi dum bo‘ldi. Bitta yulduz yana Piko peshonasiga yopishdi. Qush tayyor bo‘lganda, kumush kapsula miltillab, shu rasm tomonga burildi. Yangi belgi ko‘rindi.`,
        },
        seed: {
          ru: `Звёздная птица повела капсулу к окну, но одна звёздочка решила съехать вниз.`,
          uz: `Yulduz qushi kapsulaga yo‘l ko‘rsatdi, ammo bitta yulduzcha pastga sirg‘alib ketdi.`,
        },
        titleTwo: {
          ru: `Созвездие «Дорога домой»`,
          uz: `«Uyga yo‘l» yulduzlari`,
        },
        episodeTwo: {
          ru: `Почтовая капсула летела вдоль светящейся птицы, будто та действительно показывала дорогу. На кончике крыла появилась ещё одна звёздочка от тебя. Пико наконец снял свою звезду со лба и торжественно приклеил её в самый хвост.

— {{HERO}}, важная деталь, — сказал он.

Серебряная точка за окном стала больше. Пико выключил лишние лампы в комнате, и птица на стекле засияла заметнее. Её голова смотрела в сторону капсулы, а крыло указывало прямо на окно «Люмена».

Но одна нижняя звёздочка вдруг поползла вниз по стеклу.

— У нас убегает нога, — сообщил Пико.

Твои пальцы успели поймать её. Клей на тёплом стекле держался плохо. Тогда они не стали возвращать звёздочку на прежнее место. Для неё нашлось место выше, и у птицы появилось новое перо.

— Так даже лучше, — решил Пико.

Капсула мигнула два раза и продолжила путь. Когда она приблизилась, стало видно маленькое круглое окошко и нарисованный сбоку почтовый конверт.

Через несколько минут у двери загорелась зелёная лампочка. Пико открыл почтовый ящик, и внутрь скользнули три конверта.

Первым был рисунок кота в космическом шлеме. На втором кто-то нарисовал огромную клубнику с маленькими звёздами вместо семечек. На третьем была Луна в красных носках.

Пико замер.

— Они вернулись.

От смеха конверт в твоих руках чуть не упал. Пико поставил рисунок Луны в самую большую рамку, а клубнику — рядом.

В маленьком кармашке капсулы лежала ещё одна светящаяся звёздочка. Она была зелёной, не золотой. Зелёная звёздочка заняла место в середине птицы.

Теперь рисунок на окне стал совсем необычным: золотые крылья и зелёное сердечко.

Пико достал мягкую ленту и предложил повесить новые рисунки под окном. На этот раз он держал ленту двумя руками и очень внимательно следил, чтобы не оказаться внутри узла. Кота, клубнику и Луну закрепили маленькими прищепками рядом с тобой. Клубника вышла такой большой, что Пико дважды проверил: это точно рисунок, а не ужин.

Снаружи капсула мигнула один раз. Зелёная звезда на птице как будто ответила ей. Пико мигнул своими глазами тоже, но по твоему мнению, трёх разных миганий для одной ночи уже хватало. Робот согласился и перестал соревноваться с окном.

Почтовая капсула устроилась возле станции. Пико сел на пол рядом с тобой и посмотрел на птицу.

— Оставим её до утра?

Пико увидел кивок тебе.

Они погасили свет в комнате. Звёздная птица не исчезла. Она светилась всё слабее, как наклейки на потолке перед сном. За стеклом мерцала настоящая ночь, а в комнате рядом висели новые рисунки.

Пико прикрыл свои светящиеся глаза почти до тонких полосок. ты и Пико пожелали друг другу доброй ночи. Последней в окне ещё немного светилась зелёная звезда в середине птицы, а потом и она стала совсем мягкой. Капсула за стеклом мигнула один раз на прощание. Пико уже почти закрыл глаза, и даже Луна в красных носках выглядела сонной.`,
          uz: `Pochta kapsulasi oynadagi yulduz qushi ortidan kelayotgandek ko‘rinardi. {{HERO}} qanot uchiga yana bitta yulduzcha qo‘shdi. Piko nihoyat peshonasidagi yulduzni olib, tantanali ravishda qushning dumiga yopishtirdi.

— Juda muhim detal, — dedi u.

Kumush nuqta kattalashib borardi. Piko xonadagi ortiqcha chiroqlarni o‘chirdi. Endi oynadagi qush yaxshiroq ko‘rindi. Uning boshi kapsula tomonga, qanoti esa «Lyumen» oynasi tomonga qarardi.

Birdan pastdagi bitta yulduzcha shisha bo‘ylab sirg‘ala boshladi.

— Qushimizning oyog‘i qochyapti, — dedi Piko.

{{HERO}} uni barmog‘i bilan tutib qoldi. Iliq oynada yopishqoq qismi yaxshi ushlamasdi. Ular yulduzchani eski joyiga qaytarishmadi. {{HERO}} uni biroz yuqoriga ko‘chirdi va qushda yangi pat paydo bo‘ldi.

— Bundan ham chiroyli bo‘ldi, — dedi Piko.

Kapsula ikki marta miltillab, yo‘lida davom etdi. Yaqinlashganda uning kichkina dumaloq oynachasi va yoniga chizilgan konvert belgisi ko‘rindi.

Bir ozdan keyin eshik yonidagi yashil chiroq yondi. Piko pochta qutisini ochdi, ichkariga uchta konvert tushdi.

Birinchi rasmda kosmik dubulg‘a kiygan mushuk bor edi. Ikkinchisida urug‘lari o‘rnida kichkina yulduzlar chizilgan ulkan qulupnay turardi. Uchinchisida esa qizil paypoq kiygan Oy qaytib kelgan edi.

Piko qotib qoldi.

— Ular qaytibdi.

{{HERO}} shunaqa kuldiki, konvertni sal qolsa tushirib yuborardi. Piko Oy rasmini eng katta ramkaga, qulupnayni esa yoniga qo‘ydi.

Kapsulaning kichkina cho‘ntagida yana bitta yorug‘ yulduzcha bor edi. U oltin emas, yashil edi. {{HERO}} uni oynadagi qushning o‘rtasiga yopishtirdi.

Endi qushning oltin qanotlari va yashil yuragi bor edi.

Piko yumshoq lentani olib, yangi rasmlarni oyna ostiga osishni taklif qildi. Bu safar u lentani ikki qo‘li bilan ushlab, tugun ichida qolib ketmaslikka juda jiddiy qaradi. {{HERO}} mushuk, qulupnay va Oyni kichik qisqichlar bilan mahkamladi.

Qulupnay shunaqa katta chizilgandiki, Piko ikki marta tekshirib:

— Bu rasmmi yoki kechki ovqatmi? — deb so‘radi.

Tashqaridagi kapsula yana bir marta miltilladi. Qushning yashil yuragi ham unga javob bergandek yondi. Piko ko‘zlarini ham miltillatib ko‘rdi. {{HERO}} bir kecha uchun uch xil miltillash yetarli ekanini aytdi. Piko rozi bo‘lib, oyna bilan musobaqani to‘xtatdi.

Rasmlarni osib bo‘lgach, {{HERO}} orqaga bir qadam tashladi. Mushuk, qulupnay va Oy yulduz qushi ostida bir qator bo‘lib turardi.

Pochta kapsulasi bekat yonida joylashdi. Piko {{HERO}} yoniga polga o‘tirib, yulduz qushiga qaradi.

— Uni ertalabgacha qoldiramizmi?

{{HERO}} bosh irg‘adi.

Ular xonadagi chiroqlarni o‘chirdi. Yulduz qushi yo‘qolmadi. U shiftga yopishtirilgan tungi yulduzchalardek tobora xira yaltirardi. Oyna ortida haqiqiy tun, ichkarida esa yangi rasmlar turardi.

Piko ko‘zlaridagi chiroqni ingichka chiziqqacha pasaytirdi. {{HERO}} unga xayrli tun tiladi. Oynada eng oxirida qushning o‘rtasidagi yashil yulduzcha ko‘rindi. Keyin uning nuri ham mayinlashib, xona tun uchun tayyor bo‘ldi. Oyna ortidagi kapsula bir marta miltillab xayrlashdi. Piko ko‘zlarini deyarli yumdi, qizil paypoq kiygan Oy esa ramkada ham uyqusi kelgandek ko‘rinardi.`,
        },
        icon: `⭐`,
        values: ['curiosity', 'friendship'],
      },
    },
  },
}

const closedBetaWorld = (value: NormalizedStoryContext['stylePackId']): value is ClosedBetaWorld =>
  value === 'cozy_forest' || value === 'magic_garden' || value === 'stars_and_space'

const branchFromChoice = (choiceId: string): 'choice-a' | 'choice-b' | null =>
  choiceId === 'choice-a' || choiceId === 'path_a'
    ? 'choice-a'
    : choiceId === 'choice-b' || choiceId === 'path_b'
      ? 'choice-b'
      : null

const storyPatch = (world: ClosedBetaWorld): CandidatePatch => ({
  last_event: `${world}_story_started`,
  new_friend: null,
  hero_trait: 'curious_and_kind',
  open_arc: `${world}_bedtime_arc`,
  relationship_updates: [],
  canon_updates: [{ key: 'beta_story_version', value: 'child_first_v1' }],
})

const choicePatch = (world: ClosedBetaWorld, branch: 'choice-a' | 'choice-b'): CandidatePatch => ({
  last_event: `${world}_${branch}`,
  new_friend: null,
  hero_trait: 'curious_and_kind',
  open_arc: `${world}_bedtime_arc`,
  relationship_updates: [{ key: 'friends', value: 'shared_a_kind_choice' }],
  canon_updates: [{ key: 'remembered_choice', value: branch }],
})

const closingPatch = (world: ClosedBetaWorld, branch: 'choice-a' | 'choice-b'): CandidatePatch => ({
  last_event: `${world}_story_completed`,
  new_friend: null,
  hero_trait: 'curious_and_kind',
  open_arc: null,
  relationship_updates: [{ key: 'friends', value: 'story_completed_together' }],
  canon_updates: [
    { key: 'remembered_choice', value: branch },
    { key: 'beta_story_version', value: 'child_first_v1' },
  ],
})

export const buildChildFirstClosedBetaCandidate = (
  context: NormalizedStoryContext,
): StoryCandidate | null => {
  if (
    context.ageGroup !== '5-7' ||
    context.storyMood !== 'bedtime' ||
    context.storyMode !== 'series' ||
    (context.language !== 'ru' && context.language !== 'uz') ||
    !closedBetaWorld(context.stylePackId)
  ) return null

  const language = context.language
  const world = context.stylePackId
  const story = childFirstStories[world]

  if (context.isContinuation) {
    const branch = branchFromChoice(context.choiceHistory.at(-1)?.choice_id ?? '')
    if (!branch) return null
    const selected = story.choices[branch]

    return {
      title: selected.titleTwo[language],
      story_text: selected.episodeTwo[language],
      choices: [],
      state_patch: closingPatch(world, branch),
      vocabulary: [],
      nextEpisodePreview: '',
    }
  }

  return {
    title: story.titleOne[language],
    story_text: story.episodeOne[language],
    choices: (['choice-a', 'choice-b'] as const).map((branch) => {
      const choice = story.choices[branch]
      return {
        choice_id: branch,
        text: choice.text[language],
        effect_summary: choice.effect[language],
        resolution_text: choice.resolution[language],
        tomorrow_seed: choice.seed[language],
        choice_icon: choice.icon,
        state_patch: choicePatch(world, branch),
        value_alignment: choice.values,
      }
    }),
    state_patch: storyPatch(world),
    vocabulary: language === 'ru' ? story.vocabulary : [],
    nextEpisodePreview: language === 'ru'
      ? 'История продолжится сразу после твоего выбора.'
      : 'Hikoya tanlovingdan keyin darrov davom etadi.',
  }
}
