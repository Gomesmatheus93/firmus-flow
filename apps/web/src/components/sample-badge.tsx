import { FlaskConical } from 'lucide-react'
import { cn } from 'cn'

/**
 * Selo discreto para telas que ainda mostram dados fictícios.
 * Some quando a tela for ligada ao banco de verdade.
 */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground',
        className,
      )}
    >
      <FlaskConical className="size-3" />
      dados de exemplo
    </span>
  )
}
