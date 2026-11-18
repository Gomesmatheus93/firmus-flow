import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'

export type Stat = {
  label: string
  value: string
  hint?: string
  /**
   * Variação em relação ao período anterior, como "+12%". Só passe quando a
   * comparação for de verdade: a regra de nunca inventar número vale aqui.
   */
  trend?: string
  /** O trend é bom ou ruim. Sem isto o selo fica neutro. */
  trendTone?: 'up' | 'down'
  icon?: LucideIcon
  /** No máximo um por tela: o cartão preenchido de azul. */
  accent?: boolean
}

/** Fileira de cartões de métrica: ícone, rótulo, número grande e um detalhe. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <article
            key={stat.label}
            className={cn(
              'min-w-0 rounded-[1.125rem] p-4 sm:p-5',
              stat.accent ? 'highlight shadow-card' : 'surface',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              {Icon && (
                <span className={cn('icon-chip', stat.accent && 'bg-white/15 text-white')}>
                  <Icon className="size-5" />
                </span>
              )}
              {stat.trend && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    stat.accent
                      ? 'bg-white/15 text-white'
                      : stat.trendTone === 'down'
                        ? 'bg-red-50 text-red-600'
                        : stat.trendTone === 'up'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-gelo text-ardosia',
                  )}
                >
                  {stat.trend}
                </span>
              )}
            </div>

            <p
              className={cn(
                'text-sm',
                Icon && 'mt-4',
                stat.accent ? 'text-white/75' : 'text-ardosia',
              )}
            >
              {stat.label}
            </p>
            <p
              className={cn(
                'tabular mt-1 text-[1.75rem] leading-tight font-bold tracking-tight',
                stat.accent ? 'text-white' : 'text-noite',
              )}
            >
              {stat.value}
            </p>

            {stat.hint && (
              <p className={cn('mt-1 text-xs', stat.accent ? 'text-white/70' : 'text-ardosia')}>
                {stat.hint}
              </p>
            )}
          </article>
        )
      })}
    </section>
  )
}
