import { ArrowUpRight } from 'lucide-react'
import { cn } from 'cn'

export type Stat = {
  label: string
  value: string
  hint?: string
  trend?: string
  /** No máximo um por tela: é o cartão em ciano. */
  accent?: boolean
}

/** Fileira de métricas, cada uma no seu cartão. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className={cn('min-w-0 rounded-2xl p-4', stat.accent ? 'bg-ciano' : 'surface')}
        >
          <p className={cn('text-xs', stat.accent ? 'text-noite/70' : 'text-ardosia')}>
            {stat.label}
          </p>

          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="tabular text-3xl leading-none font-semibold tracking-tight text-noite">
              {stat.value}
            </p>
            {stat.trend && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  stat.accent ? 'text-noite/70' : 'text-ardosia',
                )}
              >
                <ArrowUpRight className="size-3" />
                {stat.trend}
              </span>
            )}
          </div>

          {stat.hint && (
            <p className={cn('mt-2 text-xs', stat.accent ? 'text-noite/70' : 'text-ardosia')}>
              {stat.hint}
            </p>
          )}
        </article>
      ))}
    </section>
  )
}
