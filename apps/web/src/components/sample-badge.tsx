import { cn } from 'cn'

/**
 * Selo para telas que ainda mostram dados fictícios.
 * Some quando a tela for ligada ao banco de verdade.
 */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-ardosia',
        className,
      )}
    >
      dados de exemplo
    </span>
  )
}
