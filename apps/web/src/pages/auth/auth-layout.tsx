import type { ReactNode } from 'react'
import { Backdrop } from '@/components/backdrop'
import { Logo } from '@/components/logo'

type AuthLayoutProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <Backdrop />

      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="glass edge mt-8 rounded-2xl border border-border bg-card p-7">
          <h1 className="text-xl font-semibold tracking-tight text-gelo">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  )
}
