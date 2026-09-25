export function SevenRoadsMark({
  className = '',
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <svg
      viewBox="0 0 240 132"
      role="img"
      aria-label="Знак Королевства семи дорог"
      className={className}
      fill="none"
    >
      <path
        d="M38 116V68C38 35 70 16 120 16C170 16 202 35 202 68V116"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.75"
      />
      <path d="M52 116H188" stroke="currentColor" strokeWidth="2" opacity="0.42" />

      <path d="M120 116V54" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M120 116L96 58" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M120 116L72 68" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M120 116L52 84" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M120 116L144 58" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M120 116L168 68" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M120 116L188 84" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />

      <rect
        x="112"
        y="32"
        width="16"
        height="16"
        transform="rotate(45 120 40)"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {!compact ? (
        <>
          <circle cx="120" cy="40" r="3.5" fill="currentColor" />
          <path d="M82 28L86 32L82 36L78 32L82 28Z" fill="currentColor" opacity="0.55" />
          <path d="M158 28L162 32L158 36L154 32L158 28Z" fill="currentColor" opacity="0.55" />
        </>
      ) : null}
    </svg>
  )
}
