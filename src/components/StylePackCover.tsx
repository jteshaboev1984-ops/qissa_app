import type { StylePack, StylePackId } from '../types/qissa'

type Variant = 'hero' | 'card' | 'story' | 'listening' | 'compact'

interface CoverTheme {
  background: string
  horizon: string
  glow: string
  motif: string
  ornament: string
  accent: string
}

const variantHeights: Record<Variant, string> = {
  hero: 'h-64',
  card: 'h-44',
  story: 'h-56',
  listening: 'h-64',
  compact: 'h-28',
}

const variantRadii: Record<Variant, string> = {
  hero: 'rounded-[2.5rem]',
  card: 'rounded-[2rem]',
  story: 'rounded-[2rem]',
  listening: 'rounded-[2.25rem]',
  compact: 'rounded-[1.5rem]',
}

export function StylePackCover({
  stylePack,
  variant,
  title,
  subtitle,
  className = '',
}: {
  stylePack: StylePack
  variant: Variant
  title?: string
  subtitle?: string
  className?: string
}) {
  const theme = getCoverTheme(stylePack.id)
  const isCompact = variant === 'compact'

  return (
    <div
      className={`relative isolate overflow-hidden ${variantHeights[variant]} ${variantRadii[variant]} q-soft-shadow ${className}`}
      style={{ background: theme.background, color: stylePack.palette.text }}
    >
      <div className="absolute inset-0 opacity-70" style={{ background: theme.motif }} />
      <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: theme.horizon }} />
      <div className="absolute -left-10 top-8 h-36 w-36 rounded-full blur-2xl" style={{ background: theme.glow }} />
      <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-white/20 blur-xl" />
      <div className="absolute bottom-5 left-6 right-6 h-14 rounded-[999px] border border-white/20 bg-white/10 backdrop-blur-[1px]" />
      <div className="absolute bottom-8 left-9 right-9 h-10 rounded-[999px] opacity-60" style={{ background: theme.ornament }} />
      <div className="absolute right-7 top-7 flex gap-1.5 opacity-70">
        <span className="h-2 w-2 rounded-full bg-white/70" />
        <span className="mt-3 h-1.5 w-1.5 rounded-full bg-white/55" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/45" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#fffaf0]/90 via-[#fffaf0]/42 to-transparent" />
      {(title || subtitle) ? (
        <div className={`absolute inset-x-0 bottom-0 ${isCompact ? 'p-3' : 'p-5'}`}>
          {subtitle ? <p className="q-label mb-1 text-[10px] opacity-80">{subtitle}</p> : null}
          {title ? (
            <p className={`${isCompact ? 'text-base' : 'text-2xl'} q-heading max-w-[90%] font-bold leading-tight`}>
              {title}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/35" />
    </div>
  )
}

function getCoverTheme(id: StylePackId): CoverTheme {
  const themes: Record<StylePackId, CoverTheme> = {
    cozy_forest: {
      background: 'linear-gradient(135deg, #476d50 0%, #8faf72 52%, #d9b778 100%)',
      horizon: 'linear-gradient(180deg, transparent 0%, rgba(53,82,48,.28) 45%, rgba(255,250,240,.34) 100%)',
      glow: 'rgba(244, 199, 113, .55)',
      motif: 'radial-gradient(circle at 18% 18%, rgba(255,255,210,.7) 0 2px, transparent 3px), radial-gradient(circle at 72% 28%, rgba(255,255,210,.55) 0 2px, transparent 3px), linear-gradient(70deg, transparent 0 46%, rgba(255,255,255,.18) 47% 49%, transparent 50% 100%)',
      ornament: 'linear-gradient(90deg, rgba(64,93,55,.4), rgba(248,214,143,.45), rgba(64,93,55,.2))',
      accent: '#f4c771',
    },
    magic_garden: {
      background: 'linear-gradient(135deg, #8e7dbe 0%, #b9d98a 55%, #ffb9a5 100%)',
      horizon: 'linear-gradient(180deg, transparent 0%, rgba(255,241,244,.3) 45%, rgba(255,250,240,.48) 100%)',
      glow: 'rgba(255, 183, 213, .5)',
      motif: 'radial-gradient(circle at 22% 30%, rgba(255,230,245,.7) 0 8px, transparent 9px), radial-gradient(circle at 70% 44%, rgba(255,255,255,.38) 0 7px, transparent 8px), radial-gradient(circle at 45% 18%, rgba(255,230,170,.45) 0 4px, transparent 5px)',
      ornament: 'linear-gradient(90deg, rgba(130,104,179,.24), rgba(255,210,225,.44), rgba(142,196,122,.28))',
      accent: '#ffb9d0',
    },
    brave_adventure: {
      background: 'linear-gradient(135deg, #2d6a9f 0%, #8cc6df 58%, #f2a05e 100%)',
      horizon: 'linear-gradient(180deg, transparent 0%, rgba(255,237,199,.25) 45%, rgba(255,250,240,.48) 100%)',
      glow: 'rgba(244, 162, 97, .5)',
      motif: 'linear-gradient(145deg, transparent 0 45%, rgba(255,255,255,.24) 45% 48%, transparent 48% 100%), radial-gradient(circle at 22% 28%, rgba(255,255,255,.35) 0 3px, transparent 4px)',
      ornament: 'linear-gradient(90deg, rgba(29,83,128,.3), rgba(255,203,139,.5), rgba(255,255,255,.25))',
      accent: '#f4a261',
    },
    stars_and_space: {
      background: 'linear-gradient(135deg, #111b3a 0%, #4662d9 55%, #d9c777 100%)',
      horizon: 'linear-gradient(180deg, transparent 0%, rgba(35,38,102,.22) 35%, rgba(255,250,240,.22) 100%)',
      glow: 'rgba(166, 139, 250, .5)',
      motif: 'radial-gradient(circle, rgba(255,255,255,.75) 0 1px, transparent 2px) 0 0 / 24px 24px, radial-gradient(circle at 72% 24%, rgba(255,236,170,.85) 0 13px, transparent 14px)',
      ornament: 'linear-gradient(90deg, rgba(96,165,250,.2), rgba(253,230,138,.46), rgba(167,139,250,.24))',
      accent: '#fde68a',
    },
    silk_road: {
      background: 'linear-gradient(135deg, #a16207 0%, #d8a562 52%, #49a7b4 100%)',
      horizon: 'linear-gradient(180deg, transparent 0%, rgba(255,230,172,.22) 38%, rgba(255,250,240,.5) 100%)',
      glow: 'rgba(244, 194, 96, .55)',
      motif: 'repeating-linear-gradient(45deg, rgba(255,230,165,.25) 0 8px, transparent 8px 18px), radial-gradient(circle at 76% 22%, rgba(255,255,255,.35) 0 5px, transparent 6px)',
      ornament: 'linear-gradient(90deg, rgba(88,53,12,.3), rgba(255,223,137,.45), rgba(72,155,163,.28))',
      accent: '#f5c46b',
    },
    animal_world: {
      background: 'linear-gradient(135deg, #357a42 0%, #91c76c 58%, #f1cf52 100%)',
      horizon: 'linear-gradient(180deg, transparent 0%, rgba(61,116,55,.25) 45%, rgba(255,250,240,.42) 100%)',
      glow: 'rgba(249, 199, 79, .5)',
      motif: 'radial-gradient(circle at 24% 72%, rgba(255,255,255,.22) 0 18px, transparent 19px), radial-gradient(circle at 80% 70%, rgba(255,255,255,.18) 0 15px, transparent 16px), radial-gradient(circle at 45% 22%, rgba(255,255,255,.3) 0 4px, transparent 5px)',
      ornament: 'linear-gradient(90deg, rgba(43,89,50,.35), rgba(255,223,121,.42), rgba(72,130,69,.2))',
      accent: '#f9c74f',
    },
    castle_mystery: {
      background: 'linear-gradient(135deg, #5b4b8a 0%, #a991e8 55%, #f2c14e 100%)',
      horizon: 'linear-gradient(180deg, transparent 0%, rgba(255,238,180,.17) 42%, rgba(255,250,240,.42) 100%)',
      glow: 'rgba(242, 193, 78, .45)',
      motif: 'repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 9px, transparent 9px 22px), radial-gradient(circle at 76% 26%, rgba(255,255,255,.34) 0 5px, transparent 6px)',
      ornament: 'linear-gradient(90deg, rgba(77,58,126,.28), rgba(242,193,78,.4), rgba(255,255,255,.2))',
      accent: '#f2c14e',
    },
    sea_islands: {
      background: 'linear-gradient(135deg, #0e7490 0%, #68d8e6 58%, #f3b343 100%)',
      horizon: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,.14) 36%, rgba(255,250,240,.45) 100%)',
      glow: 'rgba(103, 232, 249, .5)',
      motif: 'repeating-radial-gradient(circle at 20% 44%, rgba(255,255,255,.24) 0 4px, transparent 5px 15px), linear-gradient(165deg, transparent 0 55%, rgba(255,255,255,.26) 56% 58%, transparent 59% 100%)',
      ornament: 'linear-gradient(90deg, rgba(14,116,144,.36), rgba(255,222,133,.44), rgba(103,232,249,.25))',
      accent: '#f59e0b',
    },
  }

  return themes[id]
}
