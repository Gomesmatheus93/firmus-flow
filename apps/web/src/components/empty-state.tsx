import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="halo grid size-12 place-items-center rounded-xl border border-border bg-muted">
        <Icon className="size-5 text-ciano" />
      </span>
      <h3 className="mt-4 text-base font-medium text-gelo">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
