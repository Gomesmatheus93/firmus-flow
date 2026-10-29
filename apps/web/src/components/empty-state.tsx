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
    <div className="surface flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted">
        <Icon className="size-5 text-ardosia" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-noite">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ardosia">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
