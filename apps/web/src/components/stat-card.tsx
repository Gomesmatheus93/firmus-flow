import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'

type StatCardProps = {
  label: string
  value: string
  hint?: string
  trend?: { value: string; direction: 'up' | 'down' | 'flat' }
  icon: LucideIcon
  highlight?: boolean
}

const trendTone = {
  up: 'text-ciano',
  down: 'text-destructive',
  flat: 'text-muted-foreground',
} as const

export function StatCard({ label, value, hint, trend, icon: Icon, highlight }: StatCardProps) {
  return (
    <article
      className={cn(
        'glass relative overflow-hidden rounded-xl border border-border bg-card p-5',
        highlight && 'edge',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon
          className={cn('size-4 shrink-0', highlight ? 'text-ciano' : 'text-muted-foreground')}
        />
      </div>

      <p
        className={cn(
          'tabular mt-3 text-3xl leading-none font-semibold text-gelo',
          highlight && 'halo',
        )}
      >
        {value}
      </p>

      {(hint || trend) && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs">
          {trend && (
            <span className={cn('font-medium', trendTone[trend.direction])}>{trend.value}</span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </p>
      )}
    </article>
  )
}
