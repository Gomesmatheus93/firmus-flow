import { CircleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState } from '@/components/empty-state'

type AsyncStateProps = {
  isPending: boolean
  error: unknown
  isEmpty: boolean
  empty: {
    icon: LucideIcon
    title: string
    description: string
    action?: ReactNode
  }
  children: ReactNode
}

/**
 * Carregando, erro ou vazio — num lugar só, para o comportamento ser igual em
 * todas as telas. Enquanto o banco não existe, é o estado vazio que aparece.
 */
export function AsyncState({ isPending, error, isEmpty, empty, children }: AsyncStateProps) {
  if (isPending) {
    return (
      <div className="surface space-y-3 p-5" aria-busy="true" aria-live="polite">
        <span className="sr-only">Carregando</span>
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-12 animate-pulse rounded-lg bg-white/60" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="surface flex items-start gap-3 p-5 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <span>
          {error instanceof Error ? error.message : 'Não foi possível carregar estes dados.'}
        </span>
      </div>
    )
  }

  if (isEmpty) return <EmptyState {...empty} />

  return <>{children}</>
}
