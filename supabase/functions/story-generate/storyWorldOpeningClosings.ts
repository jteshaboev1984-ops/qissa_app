import type { NormalizedStoryContext, StylePackId } from './contracts.ts'

const closings: Record<StylePackId, string> = {
  cozy_forest: 'Старый пень тихо скрипнул под ветром, будто тоже ждал, какой свет появится на тропинке первым.',
  magic_garden: 'Фонтан утих на одно мгновение, и даже лепестки будто прислушались к решению {{HERO}}.',
  brave_adventure: 'Над развилкой проплыла белая бабочка и села точно между фонарём и мотком мягкой верёвки.',
  stars_and_space: 'На стекле карты вспыхнула крошечная точка, а Лума мягко мигнул из темноты в ожидании сигнала.',
  silk_road: 'У ворот звякнул маленький колокольчик, и тёплый ветер приподнял край узорной ткани.',
  animal_world: 'Первая капля дождя упала на каменную чашу, а золотой лист лёг рядом с лапой {{HERO}}.',
  castle_mystery: 'За дверью снова прозвучала одна тихая нота, и янтарное стекло лампы ответило мягким блеском.',
  sea_islands: 'Лодка качнулась на гладкой воде, а перламутровая ракушка оставила на песке тонкую светлую линию.',
}

export const addOpeningClosing = (
  context: NormalizedStoryContext,
  story: string,
): string => {
  if (context.language !== 'ru' || context.ageGroup !== '5-7') return story
  return `${story}\n\n${closings[context.stylePackId]}`
}
