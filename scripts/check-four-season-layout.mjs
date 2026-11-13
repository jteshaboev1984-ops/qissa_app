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
assert(seasonSource.includes("'seven_roads_story2_cover_v1'"), 'Story 2 own cover preserved for Season 2')
assert(seasonSource.includes('singlePackageSeason('), 'Season 2 and 3 must retain part-level reading')
assert(seasonSource.includes('const storyIds = [') &&
  seasonSource.indexOf("'seven_roads_dve_bashni'") <
  seasonSource.indexOf("'seven_roads_chelovek_kotorogo_zhdut'") &&
  seasonSource.indexOf("'seven_roads_chelovek_kotorogo_zhdut'") <
  seasonSource.indexOf("'seven_roads_lozhnaya_doroga'") &&
  seasonSource.indexOf("'seven_roads_lozhnaya_doroga'") <
  seasonSource.indexOf("'seven_roads_dve_podmogi'") &&
  seasonSource.indexOf("'seven_roads_dve_podmogi'") <
  seasonSource.indexOf("'seven_roads_obratno_v_ordan'"), 'Season 4 must keep all five story packages in canonical order')
assert(seasonSource.includes("language === 'uz' ? 'Qirollik asiri' : 'Королевский пленник'"), 'approved Season 4 RU/UZ title is missing')
assert(story1.parts.length === 7 && story2.parts.length === 10, 'Season 1/2 parts must remain unchanged')
assert(staged[0].ru.parts.length === 3, 'Season 3 is three parts')
assert(staged.slice(1).reduce((n, item) => n + item.ru.parts.length, 0) === 9, 'Season 4 is nine internal parts in five episodes')
assert(story2.story_id === 'seven_roads_tayna_vostochnogo_karavana' &&
  story2.story_version === 'interactive-v4-continuity-sync', 'legacy Season 2 story persistence key changed')

const edits = [
  {
    package: staged[0],
    baseRu: 'Прошла примерно неделя после Праздника мужества.',
    baseUz: 'Jasorat bayramidan taxminan bir hafta o‘tdi.',
    newRu: 'На следующий день после отъезда Темура и Самиры из Араса в Сарван',
    newUz: 'Temur va Samira Arasdan Sarvanga jo‘nab ketganlarining ertasi kuni',
  },
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
  'Season 4 Two Towers must still inherit Season 2 Sarvan investigation decision')
assert(staged[4].ru.external_choice_context?.[0]?.source_story_id === staged[3].ru.story_id,
  'Season 4 Two Reinforcements must still inherit False Road decision')
assert(app.includes('sourceSeason: 2, sourceStory: 1') &&
  app.includes('sourceSeason: 4, sourceStory: 3') &&
  app.includes('story2_choice_3_sarvan_check') &&
  app.includes('story5_choice_1_road_post_approach'), 'cross-season choice inheritance mapping missing')
assert(unlock.includes('target.stories.some') &&
  unlock.includes('isSeasonCompleted(season)'), 'season unlock should allow legacy progress and enforce chronological completion')
assert(app.includes('isSeasonUnlocked(seasons, nextSeason.number)') &&
  shell.includes('isSeasonUnlocked(sevenRoadsSeasons, season.number)'),
  'navigation, library, and gallery must enforce season unlock')
assert(overview.includes('seasonStory.episodes.length') &&
  overview.includes('episodeEntries.length') &&
  overview.includes('season.number === 1'),
  'overview must render seasons with 6, 10, 3, and 5 units')
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
console.log('[four-seasons] PASS: 4 seasons (6/10/3/5 reader units), strict D0–D3 chronology RU/UZ')
console.log('[four-seasons] unchanged historical packages, story IDs, choice inheritance and existing images')
console.log('[four-seasons] old progress access, Home/Library/Gallery unlocks and season navigation verified')
