import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8')
const json = (name) => JSON.parse(read(name))
const failures = []
const assert = (ok, note) => { if (!ok) failures.push(note) }

const seasonSource = read('src/data/sevenRoadsSeasons.ts')
const chronoSource = read('src/data/fourSeasonChronology.ts')
const app = read('src/App.tsx')
const shell = read('src/components/PublishedStoriesShell.tsx')
const overview = read('src/components/SeasonOverview.tsx')
const unlock = read('src/features/publishedStories/fourSeasonUnlock.ts')
const story1 = json('src/data/authored/prazdnikMuzhestvaV3.ru.json')
const story2 = json('src/data/authored/taynaVostochnogoKaravanaV4.ru.json')
const staged = [
  'season2Story1RoyalSilver',
  'season2Story3TwoTowers',
  'season2Story4WaitedMan',
  'season2Story5FalseRoad',
  'season2Story6TwoReinforcements',
  'season2Story7BackToOrdan',
].map((name) => ({
  name,
  ru: json('src/data/authored/staging/' + name + '.ru.json'),
  uz: json('src/data/authored/staging/' + name + '.uz.json'),
}))

assert(seasonSource.includes('getSevenRoadsSeason1(language)') &&
  seasonSource.includes('getSevenRoadsSeason2(language)') &&
  seasonSource.includes('getSevenRoadsSeason3(language)') &&
  seasonSource.includes('getSevenRoadsSeason4(language)'), 'exactly four seasons must appear in sequence')
const season2Source = seasonSource.split('export const getSevenRoadsSeason2 =')[1]?.split('export const getSevenRoadsSeason3 =')[0] ?? ''
const season3Source = seasonSource.split('export const getSevenRoadsSeason3 =')[1]?.split('export const getSevenRoadsSeason4 =')[0] ?? ''
const season4Source = seasonSource.split('export const getSevenRoadsSeason4 =')[1]?.split('export const getSevenRoadsSeasons =')[0] ?? ''
assert(season2Source.includes("requireStagedStory(language, 'seven_roads_korolevskoe_serebro')") &&
  season2Source.includes("'seven_roads_season2_cover_v1'"),
  'Season 2 must be Royal Silver with its original approved cover')
assert(season3Source.includes('taynaVostochnogoKaravanaV4ByLanguage[language]') &&
  season3Source.includes("'seven_roads_story2_cover_v1'"),
  'Season 3 must be Eastern Caravan with the original Caravan cover')
assert(seasonSource.includes('singlePackageSeason('), 'Royal Silver must preserve its original authored package')
assert(season3Source.includes("'seven_roads_dve_bashni'") &&
  season3Source.includes("presentation: 'single-cover-episode-list'"),
  'Season 3 must finish with Two Towers')
assert(season4Source.includes('const entries = [') &&
  !season4Source.includes("'seven_roads_dve_bashni'") &&
  season4Source.indexOf("'seven_roads_chelovek_kotorogo_zhdut'") <
  season4Source.indexOf("'seven_roads_lozhnaya_doroga'") &&
  season4Source.indexOf("'seven_roads_lozhnaya_doroga'") <
  season4Source.indexOf("'seven_roads_dve_podmogi'") &&
  season4Source.indexOf("'seven_roads_dve_podmogi'") <
  season4Source.indexOf("'seven_roads_obratno_v_ordan'"),
  'Season 4 prison-convoy series must begin with Waited Man and remain chronological')
assert(seasonSource.includes("language === 'uz' ? 'Qirollik asiri' : 'Королевский пленник'"), 'approved Season 4 RU/UZ title is missing')
assert(story1.parts.length === 7 && story2.parts.length === 10, 'Season 1 and original Caravan package must remain unchanged')
assert(staged[0].ru.parts.length === 3, 'Season 2 Royal Silver is three parts')
assert(staged[1].ru.parts.length === 3 && staged.slice(2).reduce((n, item) => n + item.ru.parts.length, 0) === 6,
  'Two Towers retains three authored parts in Season 3; Season 4 retains six source parts')
assert(story2.story_id === 'seven_roads_tayna_vostochnogo_karavana' &&
  story2.story_version === 'interactive-v4-continuity-sync', 'legacy Season 2 story persistence key changed')

// The original source order is Royal Silver (about one week after the Festival),
// then Eastern Caravan (several weeks after the Festival). Do not retime Royal Silver.
assert(staged[0].ru.parts[0].story_text.includes('Прошла примерно неделя после Праздника мужества.') &&
  staged[0].uz.parts[0].story_text.includes('Jasorat bayramidan taxminan bir hafta o‘tdi.'),
  'Royal Silver original RU/UZ opening must stay unchanged')
assert(story2.parts[0].story_text.startsWith('Через несколько недель после Праздника мужества'),
  'Eastern Caravan original opening must remain several weeks after the Festival')
assert(!chronoSource.includes('seven_roads_korolevskoe_serebro:'),
  'Royal Silver must not receive an artificial post-Caravan temporal overlay')
const edits = [
  {
    package: staged[1],
    baseRu: 'К вечеру дорога поднялась на последний невысокий холм.',
    baseUz: 'Kechga yaqin yo‘l oxirgi past tepalikka ko‘tarildi.',
    newRu: 'На третий день после отъезда из Араса',
    newUz: 'Arasdan jo‘nab ketganlarining uchinchi kuni',
  },
]
for (const edit of edits) {
  for (const [lang, oldText, newText] of [
    ['ru', edit.baseRu, edit.newRu],
    ['uz', edit.baseUz, edit.newUz],
  ]) {
    const part = edit.package[lang].parts[0]
    assert(part.story_text.split(oldText).length === 2, edit.package.name + ': original ' + lang + ' timing anchor must remain unique')
    assert(chronoSource.includes(oldText) && chronoSource.includes(newText), edit.package.name + ': ' + lang + ' chronology overlay missing')
    if (lang === 'ru') {
      assert(!part.image_slots.some((slot) => slot.after_text === oldText), edit.package.name + ': time edit touches an image anchor')
    } else {
      assert(!Object.values(part.image_anchor_texts ?? {}).includes(oldText), edit.package.name + ': time edit touches a translated image anchor')
    }
  }
}
assert(chronoSource.includes('parts: [{ ...first') &&
  chronoSource.includes('story_text: first.story_text.replace(patch.from, patch.to)'),
  'time edits must apply as runtime overlays and not rewrite historical packages')
assert(staged[1].ru.external_choice_context?.[0]?.source_story_id === story2.story_id,
  'Season 3 Two Towers must still inherit Caravan Sarvan investigation decision')
assert(staged[4].ru.external_choice_context?.[0]?.source_story_id === staged[3].ru.story_id,
  'Season 4 Two Reinforcements must still inherit False Road decision')
assert(seasonSource.includes("withReadingSeries("), '30-series presentation registry must be installed')
assert(app.includes('sourceSeason: 3, sourceStory: 1') &&
  app.includes('sourceSeason: 4, sourceStory: 2') &&
  app.includes('story2_choice_3_sarvan_check') &&
  app.includes('story5_choice_1_road_post_approach'), 'cross-season choice inheritance mapping missing')
assert(unlock.includes('target.stories.some') &&
  unlock.includes('isSeasonCompleted(season)'), 'season unlock should allow legacy progress and enforce chronological completion')
assert(app.includes('isSeasonUnlocked(seasons, nextSeason.number)') &&
  shell.includes('isSeasonUnlocked(sevenRoadsSeasons, season.number)'),
  'navigation, library, and gallery must enforce season unlock')
assert(overview.includes('seasonStory.episodes.length') &&
  overview.includes('entries.length') &&
  overview.includes('season.number === 1'),
  'overview must render all season/series hierarchies')
assert(shell.includes('homeActiveStory') && shell.includes('unlockedLaterSeasons'),
  'Home must resume the next incomplete season')
assert(shell.includes('authoredIllustrationDiscovery.buildGalleryEpisodes'),
  'gallery must discover the existing images')
assert(!shell.includes('season2Unlocked') && !shell.includes('season2StartedIncomplete'),
  'old two-season Home/gating model leaked into four-season UI')

for (const item of staged) {
  assert(item.ru.story_id === item.uz.story_id &&
    item.ru.story_version === item.uz.story_version &&
    item.ru.parts.length === item.uz.parts.length,
    item.name + ': RU/UZ identity or part count changed')
}
if (failures.length) {
  failures.forEach((error) => console.error('[four-seasons] ' + error))
  process.exit(1)
}
console.log('[four-seasons] PASS: 4 seasons, 5/4/11/10 reader series; Caravan concludes with Two Towers')
console.log('[four-seasons] unchanged historical packages, story IDs, choice inheritance and existing images')
console.log('[four-seasons] old progress access, Home/Library/Gallery unlocks and season navigation verified')
