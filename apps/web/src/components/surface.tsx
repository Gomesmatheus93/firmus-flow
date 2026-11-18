import type { ReactNode } from 'react'
import { cn } from 'cn'

/** Cartão branco: o bloco básico de toda tela. */
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
 * Bloco de destaque: degradê do Azul Firmus ao azul-noite, texto branco.
 * É o "banner" das referências — no máximo um por tela, para continuar sendo
 * destaque.
 */
export function FeatureBlock({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('highlight relative min-w-0 overflow-hidden rounded-[1.125rem]', className)}
    >
      {/* Dois círculos discretos no canto, como os grafismos dos banners. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full border-[28px] border-white/[0.06]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-20 size-40 rounded-full bg-white/[0.04]"
      />
      <div className="relative p-6">{children}</div>
    </section>
  )
}
