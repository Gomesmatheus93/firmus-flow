import type { ReactNode } from 'react'
import { cn } from 'cn'

/** Painel de vidro: translúcido, com o degradê do fundo desfocado por trás. */
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

/**
 * Bloco escuro de assinatura: o contraponto ao vidro, com o canto cortado a
 * 45° como o "F" da marca e um brilho diagonal discreto.
 */
export function FeatureBlock({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={cn('chamfer relative min-w-0 rounded-2xl bg-noite text-white', className)}>
      <span aria-hidden className="sheen pointer-events-none absolute inset-0 rounded-2xl" />
      <div className="relative p-6">{children}</div>
    </section>
  )
}
