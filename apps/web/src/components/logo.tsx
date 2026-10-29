import { cn } from 'cn'

/** Losango da Firmus, em gradiente ciano → azul. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-grid size-9 shrink-0 place-items-center rounded-[0.6rem] shadow-lg shadow-firme/25',
        className,
      )}
      style={{
        background: 'linear-gradient(135deg, var(--color-ciano), var(--color-firme) 70%)',
      }}
    >
      <svg viewBox="0 0 24 24" className="size-4.5" fill="none" aria-hidden>
        <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="var(--color-abismo)" opacity="0.28" />
        <path
          d="M12 5 19 12l-7 7-7-7z"
          stroke="var(--color-gelo)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M12 9.2 14.8 12 12 14.8 9.2 12z" fill="var(--color-gelo)" />
      </svg>
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[0.72rem] leading-[1.35] tracking-[0.14em] text-gelo">
        FIRMUS
        <br />
        <span className="text-ciano">FLOW</span>
      </span>
    </span>
  )
}
