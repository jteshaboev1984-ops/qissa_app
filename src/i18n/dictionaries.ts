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
  | 'story.world_remembers' | 'story.continue_next_episode' | 'story.next_episode_hint'
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
'home.title':'Дом историй','home.continue_story':'Продолжить историю','home.ready':'Готово. Теперь можно создать первую серию.','home.create_first_series':'Создать первую серию','home.next_create_series':'Следующий шаг: создать первую серию',
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
'listen.change_voice':'Изменить голос','listen.play':'▶ Пуск','listen.pause':'⏸ Пауза','listen.back_10':'−10 сек','listen.forward_10':'+10 сек','listen.speed':'Скорость','listen.progress':'Прогресс',
'voice.soft_female':'Мягкий женский','voice.calm_male':'Спокойный мужской','voice.neutral_storyteller':'Нейтральный рассказчик','voice.cheerful_daytime':'Бодрый дневной',
'story.read_mode':'Читать','story.listen_mode':'Слушать','story.listen_placeholder':'Здесь будет спокойное прослушивание с обложкой эпизода и управлением аудио.','story.audio_controls':'Управление аудио','story.make_choice':'Что выберет герой?','story.words_preview':'Слова из истории (по желанию)','story.choice_confirmation':'Выбор принят.','story.world_remembers':'Мир запомнил твой выбор.','story.continue_next_episode':'Продолжить следующую серию','story.next_episode_hint':'Следующая серия начнётся с этого.','home.world_remembers':'Мир помнит твой выбор.','home.last_episode_summary':'Чем закончилась последняя серия','home.reset_story':'Сбросить историю','home.restart_story':'Начать заново',
}
const uz: I18nDictionary = { ...ru, 'hero.custom_placeholder': 'Masalan: kichik bars, Lola, Amir, mehribon robot', 'story.read_mode': 'O‘qish', 'story.listen_mode': 'Tinglash', 'story.listen_placeholder': 'Bu yerda epizod muqovasi va audio boshqaruvi ko‘rinadi.', 'story.audio_controls': 'Audio boshqaruvi', 'story.make_choice': 'Qahramon nimani tanlaydi?', 'story.words_preview': 'Hikoyadagi so‘zlar (ixtiyoriy)', 'story.choice_confirmation': 'Tanlov qabul qilindi.', 'story.world_remembers': 'Dunyo tanlovingni eslab qoldi.', 'story.continue_next_episode': 'Keyingi qismga o‘tish', 'story.next_episode_hint': 'Keyingi qism shu tanlovdan boshlanadi.', 'home.world_remembers': 'Dunyo tanlovingni eslaydi.', 'home.last_episode_summary': 'Oxirgi qism yakuni' }
const kz: I18nDictionary = { ...ru, 'hero.custom_placeholder': 'Мысалы: кішкентай барыс, Лола, Әмір, мейірімді робот', 'story.read_mode': 'Оқу', 'story.listen_mode': 'Тыңдау', 'story.listen_placeholder': 'Мұнда эпизод мұқабасы мен аудио басқару көрсетіледі.', 'story.audio_controls': 'Аудио басқару', 'story.make_choice': 'Кейіпкер нені таңдайды?', 'story.words_preview': 'Оқиға сөздері (қалау бойынша)', 'story.choice_confirmation': 'Таңдау қабылданды.', 'story.world_remembers': 'Әлем сенің таңдауыңды ұмытпады.', 'story.continue_next_episode': 'Келесі бөлімге өту', 'story.next_episode_hint': 'Келесі бөлім осы таңдаудан басталады.', 'home.world_remembers': 'Әлем сенің таңдауыңды есте сақтады.', 'home.last_episode_summary': 'Соңғы бөлімнің қорытындысы' }

export const dictionaries: Record<Language, I18nDictionary> = { ru, uz, kz }
