import type { Language } from '../types/qissa'

export type I18nKey =
  | 'app.title' | 'nav.welcome' | 'nav.onboarding' | 'nav.home'
  | 'welcome.title' | 'welcome.subtitle' | 'welcome.cta' | 'welcome.tagline' | 'welcome.explanation'
  | 'actions.next' | 'actions.back' | 'actions.start_story' | 'actions.continue' | 'actions.save'
  | 'onboarding.title' | 'onboarding.age' | 'onboarding.language' | 'onboarding.hero' | 'onboarding.world' | 'onboarding.story_mode' | 'onboarding.mood'
  | 'home.title' | 'home.continue_story' | 'home.ready' | 'home.create_first_series' | 'home.next_create_series'
  | 'age.3_5' | 'age.6_8' | 'age.9_10'
  | 'language.ru' | 'language.uz' | 'language.kz'
  | 'hero.girl_hero' | 'hero.boy_hero' | 'hero.animal' | 'hero.magical_hero' | 'hero.custom' | 'hero.custom_placeholder'
  | 'mode.series' | 'mode.one_time'
  | 'mood.bedtime' | 'mood.kind_adventure'
  | 'story.read_mode' | 'story.listen_mode' | 'story.listen_placeholder' | 'story.audio_controls' | 'story.make_choice' | 'story.words_preview' | 'story.choice_confirmation'
  | 'story.world_remembers' | 'story.continue_next_episode' | 'story.next_episode_hint' | 'story.episode_end_title' | 'story.episode_end_body' | 'story.back_home'
  | 'home.world_remembers' | 'home.last_episode_summary' | 'home.reset_story' | 'home.restart_story'
  | 'reader.open_settings' | 'reader.close_settings' | 'reader.text_size' | 'reader.font' | 'reader.line_spacing' | 'reader.theme'
  | 'reader.text_size.small' | 'reader.text_size.medium' | 'reader.text_size.large' | 'reader.text_size.extra_large'
  | 'reader.theme.light' | 'reader.theme.warm' | 'reader.theme.night'
  | 'reader.font.standard' | 'reader.font.soft' | 'reader.font.dyslexia_friendly'
  | 'reader.line_spacing.normal' | 'reader.line_spacing.relaxed' | 'reader.line_spacing.wide'
  | 'listen.change_voice' | 'listen.play' | 'listen.pause' | 'listen.back_10' | 'listen.forward_10' | 'listen.speed' | 'listen.progress'
  | 'voice.soft_female' | 'voice.calm_male' | 'voice.neutral_storyteller' | 'voice.cheerful_daytime'

export type I18nDictionary = Record<I18nKey, string>

const ru: I18nDictionary = {
'app.title':'QISSA','nav.welcome':'Приветствие','nav.onboarding':'Онбординг','nav.home':'Главная',
'welcome.title':'QISSA','welcome.subtitle':'Тёплые персональные сказки для семьи.','welcome.cta':'Начать сказку','welcome.tagline':'Добрые сказки, которые продолжаются каждый день.','welcome.explanation':'Создайте первую сказку. Ребёнок сделает выбор, а мир истории запомнит его.',
'actions.next':'Далее','actions.back':'Назад','actions.start_story':'Начать сказку','actions.continue':'Продолжить','actions.save':'Сохранить',
'onboarding.title':'Быстрый старт','onboarding.age':'Для какого возраста сказка?','onboarding.language':'На каком языке рассказать сказку?','onboarding.hero':'Кто будет главным героем?','onboarding.world':'Где начнётся история?','onboarding.story_mode':'Какой формат сказки выбрать?','onboarding.mood':'Какую сказку создать?',
'home.title':'Дом историй','home.continue_story':'Продолжить историю','home.ready':'Ваш сказочный мир готов.','home.create_first_series':'Создать первую серию','home.next_create_series':'Следующий шаг: создать первую серию',
'age.3_5':'3–5 лет','age.6_8':'6–8 лет','age.9_10':'9–10 лет',
'language.ru':'Русский','language.uz':'O‘zbekcha','language.kz':'Қазақша',
'hero.girl_hero':'Девочка-герой','hero.boy_hero':'Мальчик-герой','hero.animal':'Животное','hero.magical_hero':'Волшебный герой','hero.custom':'Свой герой','hero.custom_placeholder':'Например: маленький барс, Лола, Амир, добрый робот',
'mode.series':'Сказочный сериал','mode.one_time':'Разовая сказка',
'mood.bedtime':'Перед сном','mood.kind_adventure':'Доброе приключение',

'reader.open_settings':'Настройки чтения','reader.close_settings':'Закрыть','reader.text_size':'Размер текста','reader.font':'Шрифт','reader.line_spacing':'Интервал строк','reader.theme':'Тема',
'reader.text_size.small':'Маленький','reader.text_size.medium':'Средний','reader.text_size.large':'Крупный','reader.text_size.extra_large':'Очень крупный',
'reader.theme.light':'Светлая','reader.theme.warm':'Тёплая','reader.theme.night':'Ночная',
'reader.font.standard':'Стандартный','reader.font.soft':'Мягкий','reader.font.dyslexia_friendly':'Читаемый',
'reader.line_spacing.normal':'Обычный','reader.line_spacing.relaxed':'Свободный','reader.line_spacing.wide':'Широкий',
'listen.change_voice':'Голос рассказчика','listen.play':'▶ Пуск','listen.pause':'⏸ Пауза','listen.back_10':'−10 сек','listen.forward_10':'+10 сек','listen.speed':'Скорость','listen.progress':'Прогресс',
'voice.soft_female':'Мягкий женский','voice.calm_male':'Спокойный мужской','voice.neutral_storyteller':'Нейтральный рассказчик','voice.cheerful_daytime':'Бодрый дневной',
'story.read_mode':'Читать','story.listen_mode':'Слушать','story.listen_placeholder':'Здесь будет спокойное прослушивание с обложкой эпизода и управлением аудио.','story.audio_controls':'Управление аудио','story.make_choice':'Что выберет герой?','story.words_preview':'Слова из истории (по желанию)','story.choice_confirmation':'Выбор принят.','story.world_remembers':'История запомнила ваш выбор.','story.continue_next_episode':'Продолжить следующую серию','story.next_episode_hint':'Следующая серия начнётся с этого.','story.episode_end_title':'История продолжится.','story.episode_end_body':'Мир запомнил, что произошло в этой серии.','story.back_home':'Вернуться домой','home.world_remembers':'История помнит ваш выбор.','home.last_episode_summary':'Чем закончилась последняя серия','home.reset_story':'Сбросить историю','home.restart_story':'Если хотите, можно начать историю заново' ,
}
const uz: I18nDictionary = { ...ru,
'nav.welcome':'Xush kelibsiz','nav.onboarding':'Boshlash','nav.home':'Bosh sahifa',
'welcome.subtitle':'Oilalar uchun iliq shaxsiy ertaklar.','welcome.cta':'Ertakni boshlash','welcome.tagline':'Har kuni davom etadigan mehribon ertaklar.','welcome.explanation':'Birinchi ertakni yarating. Bola tanlov qiladi, hikoya olami esa uni eslab qoladi.',
'actions.next':'Keyingi','actions.back':'Orqaga','actions.start_story':'Ertakni boshlash','actions.continue':'Davom etish','actions.save':'Saqlash',
'onboarding.title':'Tez boshlash','onboarding.age':'Ertak qaysi yosh uchun?','onboarding.language':'Ertak qaysi tilda bo‘lsin?','onboarding.hero':'Asosiy qahramon kim bo‘ladi?','onboarding.world':'Hikoya qayerda boshlanadi?','onboarding.story_mode':'Qaysi hikoya formatini tanlaysiz?','onboarding.mood':'Qanday ertak yaratamiz?',
'home.title':'Hikoyalar uyi','home.continue_story':'Hikoyani davom ettirish','home.ready':'Sizning ertak olamingiz tayyor.','home.create_first_series':'Birinchi qismni yaratish','home.next_create_series':'Keyingi qadam: birinchi qismni yaratish',
'age.3_5':'3–5 yosh','age.6_8':'6–8 yosh','age.9_10':'9–10 yosh',
'language.ru':'Ruscha','language.uz':'O‘zbekcha','language.kz':'Qozoqcha',
'hero.girl_hero':'Qiz qahramon','hero.boy_hero':'O‘g‘il qahramon','hero.animal':'Jonivor','hero.magical_hero':'Sehrli qahramon','hero.custom':'O‘z qahramoningiz','hero.custom_placeholder':'Masalan: kichik bars, Lola, Amir, mehribon robot',
'mode.series':'Ertak seriali','mode.one_time':'Bir martalik ertak',
'mood.bedtime':'Uxlashdan oldin','mood.kind_adventure':'Mehribon sarguzasht',
'reader.open_settings':'O‘qish sozlamalari','reader.close_settings':'Yopish','reader.text_size':'Matn hajmi','reader.font':'Shrift','reader.line_spacing':'Qator oralig‘i','reader.theme':'Mavzu',
'reader.text_size.small':'Kichik','reader.text_size.medium':'O‘rta','reader.text_size.large':'Katta','reader.text_size.extra_large':'Juda katta',
'reader.theme.light':'Yorug‘','reader.theme.warm':'Iliq','reader.theme.night':'Tungi',
'reader.font.standard':'Standart','reader.font.soft':'Yumshoq','reader.font.dyslexia_friendly':'O‘qishga qulay',
'reader.line_spacing.normal':'Oddiy','reader.line_spacing.relaxed':'Erkin','reader.line_spacing.wide':'Keng',
'listen.change_voice':'Rivoyatchi ovozi','listen.play':'▶ Boshlash','listen.pause':'⏸ Pauza','listen.back_10':'−10 soniya','listen.forward_10':'+10 soniya','listen.speed':'Tezlik','listen.progress':'Jarayon',
'voice.soft_female':'Yumshoq ayol ovozi','voice.calm_male':'Sokin erkak ovozi','voice.neutral_storyteller':'Neytral rivoyatchi','voice.cheerful_daytime':'Quvnoq kunduzgi',
'story.read_mode':'O‘qish','story.listen_mode':'Tinglash','story.listen_placeholder':'Bu yerda epizod muqovasi va audio boshqaruvi ko‘rinadi.','story.audio_controls':'Audio boshqaruvi','story.make_choice':'Qahramon nimani tanlaydi?','story.words_preview':'Hikoyadagi so‘zlar (ixtiyoriy)','story.choice_confirmation':'Tanlov qabul qilindi.','story.world_remembers':'Hikoya olami tanlovingizni eslab qoldi.','story.continue_next_episode':'Keyingi qismga o‘tish','story.next_episode_hint':'Keyingi qism shu tanlovdan boshlanadi.','story.episode_end_title':'Hikoya davom etadi.','story.episode_end_body':'Hikoya olami bu qismda nima bo‘lganini eslab qoladi.','story.back_home':'Bosh sahifaga qaytish','home.world_remembers':'Hikoya olami tanlovingizni eslaydi.','home.last_episode_summary':'Oxirgi qism yakuni','home.reset_story':'Hikoyani qayta boshlash','home.restart_story':'Istasangiz, hikoyani boshidan boshlashingiz mumkin' }
const kz: I18nDictionary = { ...ru,
'nav.welcome':'Қош келдіңіз','nav.onboarding':'Бастау','nav.home':'Басты бет',
'welcome.subtitle':'Отбасына арналған жылы жеке ертегілер.','welcome.cta':'Ертегіні бастау','welcome.tagline':'Күн сайын жалғасатын мейірімді ертегілер.','welcome.explanation':'Алғашқы ертегіні жасаңыз. Бала таңдау жасайды, ал оқиға әлемі оны есте сақтайды.',
'actions.next':'Келесі','actions.back':'Артқа','actions.start_story':'Ертегіні бастау','actions.continue':'Жалғастыру','actions.save':'Сақтау',
'onboarding.title':'Жылдам бастау','onboarding.age':'Ертегі қай жасқа арналған?','onboarding.language':'Ертегі қай тілде болсын?','onboarding.hero':'Басты кейіпкер кім болады?','onboarding.world':'Оқиға қай жерде басталады?','onboarding.story_mode':'Қай ертегі форматын таңдайсыз?','onboarding.mood':'Қандай ертегі жасаймыз?',
'home.title':'Оқиғалар үйі','home.continue_story':'Оқиғаны жалғастыру','home.ready':'Сіздің ертегі әлеміңіз дайын.','home.create_first_series':'Бірінші бөлімді жасау','home.next_create_series':'Келесі қадам: бірінші бөлімді жасау',
'age.3_5':'3–5 жас','age.6_8':'6–8 жас','age.9_10':'9–10 жас',
'language.ru':'Орысша','language.uz':'Өзбекше','language.kz':'Қазақша',
'hero.girl_hero':'Қыз кейіпкер','hero.boy_hero':'Ұл кейіпкер','hero.animal':'Жануар','hero.magical_hero':'Сиқырлы кейіпкер','hero.custom':'Өз кейіпкеріңіз','hero.custom_placeholder':'Мысалы: кішкентай барыс, Лола, Әмір, мейірімді робот',
'mode.series':'Ертегі сериалы','mode.one_time':'Бір реттік ертегі',
'mood.bedtime':'Ұйықтар алдында','mood.kind_adventure':'Мейірімді шытырман',
'reader.open_settings':'Оқу баптаулары','reader.close_settings':'Жабу','reader.text_size':'Мәтін өлшемі','reader.font':'Қаріп','reader.line_spacing':'Жол аралығы','reader.theme':'Тақырып',
'reader.text_size.small':'Кіші','reader.text_size.medium':'Орташа','reader.text_size.large':'Үлкен','reader.text_size.extra_large':'Өте үлкен',
'reader.theme.light':'Жарық','reader.theme.warm':'Жылы','reader.theme.night':'Түнгі',
'reader.font.standard':'Стандарт','reader.font.soft':'Жұмсақ','reader.font.dyslexia_friendly':'Оқуға жеңіл',
'reader.line_spacing.normal':'Қалыпты','reader.line_spacing.relaxed':'Еркін','reader.line_spacing.wide':'Кең',
'listen.change_voice':'Әңгімелеуші дауысы','listen.play':'▶ Бастау','listen.pause':'⏸ Үзіліс','listen.back_10':'−10 сек','listen.forward_10':'+10 сек','listen.speed':'Жылдамдық','listen.progress':'Орындалу барысы',
'voice.soft_female':'Жұмсақ әйел дауысы','voice.calm_male':'Байсалды ер дауыс','voice.neutral_storyteller':'Бейтарап әңгімелеуші','voice.cheerful_daytime':'Көңілді күндізгі',
'story.read_mode':'Оқу','story.listen_mode':'Тыңдау','story.listen_placeholder':'Мұнда эпизод мұқабасы мен аудио басқару көрсетіледі.','story.audio_controls':'Аудио басқару','story.make_choice':'Кейіпкер нені таңдайды?','story.words_preview':'Оқиға сөздері (қалау бойынша)','story.choice_confirmation':'Таңдау қабылданды.','story.world_remembers':'Оқиға әлемі таңдауыңызды ұмытпайды.','story.continue_next_episode':'Келесі бөлімге өту','story.next_episode_hint':'Келесі бөлім осы таңдаудан басталады.','story.episode_end_title':'Оқиға жалғасады.','story.episode_end_body':'Оқиға әлемі бұл бөлімде не болғанын есте сақтайды.','story.back_home':'Басты бетке қайту','home.world_remembers':'Оқиға әлемі таңдауыңызды есте сақтайды.','home.last_episode_summary':'Соңғы бөлімнің қорытындысы','home.reset_story':'Оқиғаны қайта бастау','home.restart_story':'Қаласаңыз, оқиғаны басынан бастауға болады' }

export const dictionaries: Record<Language, I18nDictionary> = { ru, uz, kz }
