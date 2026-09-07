import { readFileSync } from 'node:fs'

const scope = readFileSync('src/config/betaScope.ts', 'utf8')
const onboardingSteps = readFileSync('src/features/onboarding/onboardingSteps.ts', 'utf8')
const onboarding = readFileSync('src/features/onboarding/OnboardingFlow.tsx', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const story = readFileSync('src/screens/StoryScreen.tsx', 'utf8')
const parent = readFileSync('src/screens/ParentScreen.tsx', 'utf8')
const welcome = readFileSync('src/screens/WelcomeScreen.tsx', 'utf8')

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

assert(scope.includes("ageGroup: '5-7'"), 'Closed beta must stay scoped to age 5-7.')
assert(scope.includes("publicLanguages: ['ru', 'uz']") || scope.includes("const publicLanguages: Language[] = ['ru', 'uz']"), 'Closed beta public languages must be RU and UZ only.')
assert(scope.includes("publicStylePackIds: StylePackId[] = ['cozy_forest', 'magic_garden', 'stars_and_space']"), 'Closed beta must expose exactly the three approved flagship worlds.')
assert(scope.includes("nextStylePackId: 'silk_road'"), 'Silk Road must remain the next localization priority.')
assert(scope.includes('storyGenerationDailyLimit: 5'), 'Closed beta AI budget guardrail must remain five story generations per day.')
assert(scope.includes('providerAudioEnabledByDefault: false'), 'Provider TTS must remain off by default during development.')

assert(onboardingSteps.includes("['hero', 'world']"), 'First-launch onboarding must remain focused on hero and world.')
assert(onboarding.includes('isPublicBetaStylePack(pack.id)'), 'Onboarding must filter worlds through the beta scope.')
assert(onboarding.includes('storyMode: betaScope.defaultStoryMode'), 'Onboarding must force the beta story mode default.')
assert(onboarding.includes('storyMood: betaScope.defaultStoryMood'), 'Onboarding must force the beta bedtime mood default.')
assert(app.includes('UZ · Beta'), 'The public language selector must label Uzbek as Beta.')
assert(!app.includes('<option value="kz">KZ</option>'), 'Kazakh must not be exposed as a public beta option.')

assert(story.includes("type StoryStage = 'reading' | 'resolution'"), 'Story flow must not add a separate choice screen.')
assert(!story.includes("t(language, 'story.go_to_choice')"), 'Choice cards must remain inline after the story.')
assert(story.includes('QISSA запомнила выбор ✨'), 'The remembered-choice moment must remain visually explicit.')
assert(welcome.includes('<details'), 'Consent details must stay available without dominating first launch.')

assert(
  parent.includes('Формат серии и режим «Перед сном» остаются фиксированными.') &&
    parent.includes('Serial formati va «Uyqu oldidan» rejimi o‘zgarmaydi.'),
  'Parent Center must tell RU/UZ families that story format and bedtime mode are fixed in the closed beta.',
)
assert(
  !parent.includes('другими мирами и настроением') &&
    !parent.includes('boshqa dunyo va kayfiyat') &&
    !parent.includes('басқа әлем және көңіл күй'),
  'Parent Center must not imply that closed-beta families can change mood or format when only world changes are exposed.',
)

console.log('closed beta scope check passed.')
