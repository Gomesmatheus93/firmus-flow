import type { ReactNode } from 'react'
import { cn } from 'cn'

/** Superfície branca arredondada flutuando sobre o fundo tingido. */
export function Panel({
  children,
  className,
  padded = true,
}: {
  children?: ReactNode
  className?: string
  padded?: boolean
}) {
  return <section className={cn('surface min-w-0', padded && 'p-5', className)}>{children}</section>
}

/** Bloco escuro de assinatura, com o canto cortado a 45° como o "F" da marca. */
export function FeatureBlock({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={cn('chamfer min-w-0 rounded-2xl bg-noite p-6 text-white', className)}>
      {children}
    </section>
  )
}
