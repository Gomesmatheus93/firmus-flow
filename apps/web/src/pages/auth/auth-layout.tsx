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
    <div className="grid min-h-dvh place-items-center px-5 py-12">
      <Backdrop />

      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="surface mt-8 p-7">
          <h1 className="text-2xl font-semibold tracking-tight text-noite">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ardosia">{description}</p>

          <div className="mt-7">{children}</div>
        </div>

        {footer && <p className="mt-6 text-center text-sm text-ardosia">{footer}</p>}

        <p className="mt-12 text-center text-xs text-ardosia/70">
          Uma plataforma Firmus Tech · Mossoró, RN
        </p>
      </div>
    </div>
  )
}
