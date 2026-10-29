import { cn } from 'cn'
import { statusLabel, type ContentStatus } from '@/mocks/content'

const tone: Record<ContentStatus, string> = {
  rascunho: 'border-border bg-muted text-muted-foreground',
  aguardando: 'border-ciano/30 bg-ciano/10 text-ciano',
  aprovado: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  ajustar: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
}

export function StatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tone[status],
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  )
}
