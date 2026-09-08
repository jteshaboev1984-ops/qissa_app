import { useState } from 'react'
import { PrivacyDataPanel } from '../components/PrivacyDataPanel'
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
    resetConfirmTitle: string
    resetConfirmBody: string
    resetConfirmButton: string
    resetCancelButton: string
  }
> = {
  ru: {
    title: 'Родительский центр',
    subtitle: 'Профиль ребёнка сохраняется. Новую историю можно начать в другом мире, не создавая профиль заново.',
    childProfile: 'Профиль ребёнка',
    childProfileBody: 'Эти данные используются для историй, чтобы сказка звучала подходяще по возрасту, языку и герою.',
    editProfile: 'Изменить героя и мир',
    storySettings: 'Настройки текущей истории',
    storySettingsBody: 'В закрытой beta для новой истории можно выбрать другой мир. Формат серии и режим «Перед сном» остаются фиксированными.',
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
    resetTitle: 'Начать текущую историю заново',
    resetBody: 'Текущая история останется в библиотеке как архив. Активная история начнётся заново, а профиль ребёнка, язык и настройки чтения сохранятся.',
    resetConfirmTitle: 'Начать историю заново?',
    resetConfirmBody: 'Текущая история перестанет быть активной и останется в библиотеке. Это не удаляет профиль и не является полным удалением данных.',
    resetConfirmButton: 'Да, начать заново',
    resetCancelButton: 'Оставить как есть',
  },
  uz: {
    title: 'Ota-ona markazi',
    subtitle: 'Bola profili saqlanadi. Profilni qayta yaratmasdan yangi hikoyani boshqa dunyoda boshlash mumkin.',
    childProfile: 'Bola profili',
    childProfileBody: 'Bu ma’lumotlar hikoyalar yosh, til va qahramonga mos bo‘lishi uchun ishlatiladi.',
    editProfile: 'Qahramon va dunyoni o‘zgartirish',
    storySettings: 'Joriy hikoya sozlamalari',
    storySettingsBody: 'Yopiq beta’da yangi hikoya uchun boshqa dunyoni tanlash mumkin. Serial formati va «Uyqu oldidan» rejimi o‘zgarmaydi.',
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
    resetTitle: 'Joriy hikoyani boshidan boshlash',
    resetBody: 'Joriy hikoya kutubxonada arxiv sifatida qoladi. Faol hikoya boshidan boshlanadi, bola profili, til va o‘qish sozlamalari esa saqlanadi.',
    resetConfirmTitle: 'Hikoyani boshidan boshlaysizmi?',
    resetConfirmBody: 'Joriy hikoya faol bo‘lmay qoladi va kutubxonada saqlanadi. Bu profilni o‘chirmaydi va ma’lumotlarni to‘liq o‘chirish emas.',
    resetConfirmButton: 'Ha, boshidan boshlash',
    resetCancelButton: 'O‘z holicha qoldirish',
  },
  kz: {
    title: 'Ата-ана орталығы',
    subtitle: 'Бала профилі сақталады. Профильді қайта құрмай, жаңа оқиғаны басқа әлемде бастауға болады.',
    childProfile: 'Бала профилі',
    childProfileBody: 'Бұл деректер оқиға жасқа, тілге және кейіпкерге сай болуы үшін қолданылады.',
    editProfile: 'Кейіпкер мен әлемді өзгерту',
    storySettings: 'Қазіргі оқиға баптаулары',
    storySettingsBody: 'Жабық beta-да жаңа оқиға үшін басқа әлемді таңдауға болады. Серия форматы мен «Ұйқы алдында» режимі өзгермейді.',
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
    resetTitle: 'Қазіргі оқиғаны басынан бастау',
    resetBody: 'Қазіргі оқиға кітапханада мұрағат ретінде қалады. Белсенді оқиға басынан басталады, ал бала профилі, тіл және оқу баптаулары сақталады.',
    resetConfirmTitle: 'Оқиғаны басынан бастайсыз ба?',
    resetConfirmBody: 'Қазіргі оқиға белсенді болудан қалады және кітапханада сақталады. Бұл профильді жоймайды және деректерді толық жою емес.',
    resetConfirmButton: 'Иә, басынан бастау',
    resetCancelButton: 'Өзгеріссіз қалдыру',
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
  onCreateNewStorySetup,
  onDeleteProfileData,
  isDeletingData,
  deletionError,
}: {
  language: Language
  selections: OnboardingSelections
  episode: Episode | null
  readerPreferences: ReaderPreferences
  onReaderPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  onEditSetup: () => void
  onResetStory: () => void
  onCreateNewStorySetup: () => void
  onDeleteProfileData: () => Promise<void>
  isDeletingData: boolean
  deletionError: string | null
}) {
  const labels = parentLabels[language]
  const pack = stylePacks.find((p) => p.id === selections.stylePackId) ?? stylePacks[0]
  const [confirmingReset, setConfirmingReset] = useState(false)

  const confirmReset = () => {
    setConfirmingReset(false)
    onResetStory()
  }

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

        <button className="q-secondary w-full" onClick={onCreateNewStorySetup}>
          {t(language, 'home.start_new_story')}
        </button>
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

      <PrivacyDataPanel
        language={language}
        onDeleteProfileData={onDeleteProfileData}
        isDeleting={isDeletingData}
        deletionError={deletionError}
      />

      <section className="rounded-[1.75rem] border border-[#e5d8bf] bg-[#f8f2e7]/80 p-5 text-center">
        <p className="q-label mb-2">{confirmingReset ? labels.resetConfirmTitle : labels.resetTitle}</p>
        <p className="mx-auto max-w-xs text-sm leading-6 text-[#665d49]">
          {confirmingReset ? labels.resetConfirmBody : labels.resetBody}
        </p>
        {confirmingReset ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-full border border-[#b27a3d] bg-[#b27a3d] px-4 py-2.5 text-sm font-bold text-white"
              onClick={confirmReset}
            >
              {labels.resetConfirmButton}
            </button>
            <button
              type="button"
              className="q-secondary px-4 py-2.5"
              onClick={() => setConfirmingReset(false)}
            >
              {labels.resetCancelButton}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="q-secondary mt-4 px-5 py-2.5"
            onClick={() => setConfirmingReset(true)}
          >
            {t(language, 'home.reset_story_soft')}
          </button>
        )}
      </section>
    </section>
  )
}
