import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import { StylePackCover } from '../components/StylePackCover'
import { VoiceSelector } from '../components/VoiceSelector'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Episode, Language, OnboardingSelections, ReaderPreferences } from '../types/qissa'

const parentLabels: Record<
  Language,
  {
    title: string
    subtitle: string
    childProfile: string
    childProfileBody: string
    editProfile: string
    storySettings: string
    storySettingsBody: string
    currentStory: string
    noCurrentStory: string
    age: string
    language: string
    hero: string
    world: string
    format: string
    mood: string
    readingComfort: string
    readingComfortBody: string
    voiceForStory: string
    voiceForStoryBody: string
    resetTitle: string
    resetBody: string
  }
> = {
  ru: {
    title: 'Родительский центр',
    subtitle: 'Профиль ребёнка сохраняется. Новые истории можно создавать с другими мирами и настроением.',
    childProfile: 'Профиль ребёнка',
    childProfileBody: 'Эти данные используются для всех историй, чтобы сказка звучала подходяще по возрасту, языку и герою.',
    editProfile: 'Изменить профиль и настройки',
    storySettings: 'Настройки текущей истории',
    storySettingsBody: 'Мир, формат и настроение относятся к конкретной истории. Их можно менять, когда вы начинаете новую сказку.',
    currentStory: 'Текущая история',
    noCurrentStory: 'История ещё не создана',
    age: 'Возраст',
    language: 'Язык',
    hero: 'Герой',
    world: 'Мир',
    format: 'Формат',
    mood: 'Настроение',
    readingComfort: 'Комфорт чтения',
    readingComfortBody: 'Эти настройки можно менять в любой момент. Они не сбрасывают историю ребёнка.',
    voiceForStory: 'Голос для истории',
    voiceForStoryBody: 'Выберите голос рассказчика для режима прослушивания.',
    resetTitle: 'Сбросить только историю',
    resetBody: 'Это начнёт историю заново, но профиль ребёнка, язык и настройки чтения останутся.',
  },
  uz: {
    title: 'Ota-ona markazi',
    subtitle: 'Bola profili saqlanadi. Yangi hikoyalarni boshqa dunyo va kayfiyat bilan yaratish mumkin.',
    childProfile: 'Bola profili',
    childProfileBody: 'Bu ma’lumotlar hikoyalar yosh, til va qahramonga mos bo‘lishi uchun ishlatiladi.',
    editProfile: 'Profil va sozlamalarni o‘zgartirish',
    storySettings: 'Joriy hikoya sozlamalari',
    storySettingsBody: 'Dunyo, format va kayfiyat alohida hikoyaga tegishli. Yangi hikoya boshlaganda ularni o‘zgartirish mumkin.',
    currentStory: 'Joriy hikoya',
    noCurrentStory: 'Hikoya hali yaratilmagan',
    age: 'Yosh',
    language: 'Til',
    hero: 'Qahramon',
    world: 'Dunyo',
    format: 'Format',
    mood: 'Kayfiyat',
    readingComfort: 'O‘qish qulayligi',
    readingComfortBody: 'Bu sozlamalarni istalgan payt o‘zgartirish mumkin. Ular hikoyani o‘chirmaydi.',
    voiceForStory: 'Hikoya ovozi',
    voiceForStoryBody: 'Tinglash rejimi uchun hikoyachi ovozini tanlang.',
    resetTitle: 'Faqat hikoyani tiklash',
    resetBody: 'Bu hikoyani boshidan boshlaydi, lekin bola profili, til va o‘qish sozlamalari saqlanadi.',
  },
  kz: {
    title: 'Ата-ана орталығы',
    subtitle: 'Бала профилі сақталады. Жаңа оқиғаларды басқа әлем және көңіл күймен жасауға болады.',
    childProfile: 'Бала профилі',
    childProfileBody: 'Бұл деректер оқиға жасқа, тілге және кейіпкерге сай болуы үшін қолданылады.',
    editProfile: 'Профиль мен баптауларды өзгерту',
    storySettings: 'Қазіргі оқиға баптаулары',
    storySettingsBody: 'Әлем, формат және көңіл күй нақты оқиғаға қатысты. Жаңа оқиға бастағанда оларды өзгертуге болады.',
    currentStory: 'Қазіргі оқиға',
    noCurrentStory: 'Оқиға әлі жасалған жоқ',
    age: 'Жас',
    language: 'Тіл',
    hero: 'Кейіпкер',
    world: 'Әлем',
    format: 'Формат',
    mood: 'Көңіл күй',
    readingComfort: 'Оқу жайлылығы',
    readingComfortBody: 'Бұл баптауларды кез келген уақытта өзгертуге болады. Олар оқиғаны өшірмейді.',
    voiceForStory: 'Оқиға дауысы',
    voiceForStoryBody: 'Тыңдау режимі үшін баяндаушы дауысын таңдаңыз.',
    resetTitle: 'Тек оқиғаны қайта бастау',
    resetBody: 'Бұл оқиғаны басынан бастайды, бірақ бала профилі, тіл және оқу баптаулары сақталады.',
  },
}

function ageLabel(language: Language, ageGroup: OnboardingSelections['ageGroup']) {
  if (ageGroup === '3-4') return t(language, 'age.3_4')
  if (ageGroup === '5-7') return t(language, 'age.5_7')
  return t(language, 'age.8_9')
}

function languageLabel(language: Language, selectedLanguage: Language) {
  if (selectedLanguage === 'uz') return t(language, 'language.uz')
  if (selectedLanguage === 'kz') return t(language, 'language.kz')
  return t(language, 'language.ru')
}

function heroLabel(language: Language, selections: OnboardingSelections) {
  if (selections.heroType === 'custom' && selections.customHeroName?.trim()) return selections.customHeroName.trim()

  if (selections.heroType === 'girl_hero') return t(language, 'hero.girl_hero')
  if (selections.heroType === 'boy_hero') return t(language, 'hero.boy_hero')
  if (selections.heroType === 'animal') return t(language, 'hero.animal')
  if (selections.heroType === 'magical_hero') return t(language, 'hero.magical_hero')
  return t(language, 'hero.custom')
}

function moodLabel(language: Language, mood: OnboardingSelections['storyMood']) {
  return t(language, mood === 'bedtime' ? 'mood.bedtime' : 'mood.kind_adventure')
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3">
      <p className="q-label mb-1">{label}</p>
      <p className="text-sm font-bold leading-5 text-[#3d382c]">{value}</p>
    </div>
  )
}

export function ParentScreen({
  language,
  selections,
  episode,
  readerPreferences,
  onReaderPreferencesChange,
  onEditSetup,
  onResetStory,
}: {
  language: Language
  selections: OnboardingSelections
  episode: Episode | null
  readerPreferences: ReaderPreferences
  onReaderPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  onEditSetup: () => void
  onResetStory: () => void
}) {
  const labels = parentLabels[language]
  const pack = stylePacks.find((p) => p.id === selections.stylePackId) ?? stylePacks[0]

  return (
    <section className="space-y-5 pb-28">
      <div className="px-1">
        <p className="q-label mb-2">QISSA</p>
        <h2 className="q-heading text-3xl font-bold leading-tight">{labels.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#625846]">{labels.subtitle}</p>
      </div>

      <section className="q-card overflow-hidden p-0">
        <StylePackCover
          stylePack={pack}
          variant="card"
          title={episode?.title ?? labels.noCurrentStory}
          subtitle={episode ? labels.currentStory : pack.title[language]}
        />
        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-[#eadfc9] bg-[#fffdf7] px-4 py-3">
            <p className="q-label mb-2">{labels.currentStory}</p>
            <p className="text-sm font-bold leading-6 text-[#3d382c]">{episode?.title ?? labels.noCurrentStory}</p>
          </div>
        </div>
      </section>

      <section className="q-card space-y-4 p-5">
        <div>
          <p className="q-label mb-2">{labels.childProfile}</p>
          <h3 className="q-heading text-2xl font-bold leading-tight">{labels.childProfile}</h3>
          <p className="mt-2 text-sm leading-6 text-[#625846]">{labels.childProfileBody}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoTile label={labels.age} value={ageLabel(language, selections.ageGroup)} />
          <InfoTile label={labels.language} value={languageLabel(language, selections.language)} />
        </div>

        <InfoTile label={labels.hero} value={heroLabel(language, selections)} />

        <button className="q-secondary w-full" onClick={onEditSetup}>
          {labels.editProfile}
        </button>
      </section>

      <section className="q-card space-y-4 p-5">
        <div>
          <p className="q-label mb-2">{labels.storySettings}</p>
          <h3 className="q-heading text-2xl font-bold leading-tight">{labels.storySettings}</h3>
          <p className="mt-2 text-sm leading-6 text-[#625846]">{labels.storySettingsBody}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoTile label={labels.world} value={pack.title[language]} />
          <InfoTile label={labels.format} value={t(language, selections.storyMode === 'series' ? 'mode.series' : 'mode.one_time')} />
        </div>

        <InfoTile label={labels.mood} value={moodLabel(language, selections.storyMood)} />
      </section>

      <section className="q-card space-y-4 p-5">
        <div>
          <p className="q-label mb-2">{labels.readingComfort}</p>
          <p className="text-sm leading-6 text-[#625846]">{labels.readingComfortBody}</p>
        </div>
        <ReaderSettingsPanel language={language} preferences={readerPreferences} onChange={onReaderPreferencesChange} onClose={() => {}} showClose={false} />
      </section>

      <section className="q-card space-y-4 p-5">
        <div>
          <p className="q-label mb-2">{labels.voiceForStory}</p>
          <p className="text-sm leading-6 text-[#625846]">{labels.voiceForStoryBody}</p>
        </div>
        <VoiceSelector language={language} selectedVoiceId={readerPreferences.voicePresetId} onSelect={(voicePresetId) => onReaderPreferencesChange({ voicePresetId })} tone="light" />
      </section>

      <section className="rounded-[1.75rem] border border-[#e5d8bf] bg-[#f8f2e7]/80 p-5 text-center">
        <p className="q-label mb-2">{labels.resetTitle}</p>
        <p className="mx-auto max-w-xs text-sm leading-6 text-[#665d49]">{labels.resetBody}</p>
        <button className="q-secondary mt-4 px-5 py-2.5" onClick={onResetStory}>
          {t(language, 'home.reset_story_soft')}
        </button>
      </section>
    </section>
  )
}
