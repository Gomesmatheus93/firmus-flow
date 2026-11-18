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
      <span className="icon-chip size-14 rounded-2xl">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-noite">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ardosia">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
