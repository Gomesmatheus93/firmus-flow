import { cn } from 'cn'
import { statusLabel, type ContentStatus } from '@/mocks/content'

/** Pílula suave com ponto: a cor nunca é a única pista do estado. */
const tone: Record<ContentStatus, { pill: string; dot: string }> = {
  rascunho: { pill: 'bg-muted text-ardosia', dot: 'bg-ardosia' },
  aguardando: { pill: 'bg-azul/10 text-azul', dot: 'bg-azul' },
  aprovado: { pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  ajustar: { pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
}

export function StatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        tone[status].pill,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', tone[status].dot)} />
      {statusLabel[status]}
    </span>
  )
}

/** Pílula genérica, para estados que não são de conteúdo. */
export function Pill({
  children,
  tone: variant = 'neutro',
  className,
}: {
  children: React.ReactNode
  tone?: 'neutro' | 'azul' | 'verde' | 'ambar' | 'vermelho'
  className?: string
}) {
  const tones = {
    neutro: 'bg-muted text-ardosia',
    azul: 'bg-azul/10 text-azul',
    verde: 'bg-emerald-50 text-emerald-700',
    ambar: 'bg-amber-50 text-amber-700',
    vermelho: 'bg-red-50 text-destructive',
  } as const

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        tones[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
