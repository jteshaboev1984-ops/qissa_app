import type { StylePack } from '../types/qissa'

type Variant = 'hero' | 'card' | 'story' | 'listening' | 'compact'

export function StylePackCover({ stylePack, variant, title, subtitle, className = '' }: { stylePack: StylePack; variant: Variant; title?: string; subtitle?: string; className?: string }) {
  const heights: Record<Variant, string> = {
    hero: 'h-52', card: 'h-36', story: 'h-40', listening: 'h-44', compact: 'h-24',
  }
  const motif = getMotif(stylePack.id)
  return (
    <div className={`relative overflow-hidden rounded-2xl ${heights[variant]} ${className}`} style={{ background: `linear-gradient(135deg, ${stylePack.palette.primary}, ${stylePack.palette.secondary})`, color: stylePack.palette.text }}>
      <div className="absolute inset-0 opacity-25" style={{ background: motif }} />
      <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-white/20" />
      <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/15" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/35 via-white/10 to-transparent" />
      {(title || subtitle) ? (
        <div className="absolute inset-x-0 bottom-0 p-4" style={{ color: stylePack.palette.text }}>
          {subtitle ? <p className="text-xs uppercase tracking-wide opacity-90">{subtitle}</p> : null}
          {title ? <p className="text-lg font-semibold leading-tight">{title}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function getMotif(id: string): string {
  const motifs: Record<string, string> = {
    cozy_forest: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.35) 0 3px, transparent 4px), radial-gradient(circle at 70% 40%, rgba(255,255,200,.22) 0 2px, transparent 3px)',
    magic_garden: 'radial-gradient(circle at 30% 30%, rgba(255,220,240,.35) 0 5px, transparent 6px), radial-gradient(circle at 75% 55%, rgba(255,255,255,.25) 0 4px, transparent 5px)',
    brave_adventure: 'linear-gradient(160deg, rgba(255,255,255,.2) 0 10%, transparent 10% 100%), linear-gradient(20deg, rgba(255,220,170,.3) 0 8%, transparent 8% 100%)',
    stars_and_space: 'radial-gradient(circle, rgba(255,255,255,.4) 1px, transparent 2px) 0 0 / 22px 22px',
    silk_road: 'repeating-linear-gradient(45deg, rgba(255,220,160,.22) 0 8px, transparent 8px 16px)',
    animal_world: 'radial-gradient(circle at 20% 70%, rgba(255,255,255,.2) 0 18px, transparent 19px), radial-gradient(circle at 80% 75%, rgba(255,255,255,.18) 0 16px, transparent 17px)',
    castle_mystery: 'repeating-linear-gradient(90deg, rgba(255,255,255,.2) 0 10px, transparent 10px 20px)',
    sea_islands: 'repeating-radial-gradient(circle at 20% 40%, rgba(255,255,255,.2) 0 4px, transparent 5px 14px)',
  }
  return motifs[id] ?? motifs.cozy_forest
}
