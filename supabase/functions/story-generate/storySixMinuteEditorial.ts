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
