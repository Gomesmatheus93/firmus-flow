import type { ReactNode } from 'react'
import { Logo } from '@/components/logo'

type AuthLayoutProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Logo />

        <div className="mt-10">
          <h1 className="text-2xl font-semibold tracking-tight text-noite">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ardosia">{description}</p>
        </div>

        <div className="mt-8">{children}</div>

        {footer && (
          <>
            <hr className="mt-8 border-border" />
            <p className="mt-5 text-sm text-ardosia">{footer}</p>
          </>
        )}

        <p className="mt-14 text-xs text-ardosia/70">Uma plataforma Firmus Tech · Mossoró, RN</p>
      </div>
    </div>
  )
}
