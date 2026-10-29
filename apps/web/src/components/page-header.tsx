import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  badge?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, badge, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[2rem] leading-none font-semibold tracking-tight text-noite">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ardosia">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Título de bloco dentro de um painel. */
export function SectionHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold text-noite">{children}</h2>
      {aside}
    </div>
  )
}
