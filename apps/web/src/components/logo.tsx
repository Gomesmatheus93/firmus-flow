import { cn } from 'cn'
import symbol from '@/assets/firmus-symbol.png'

/** O símbolo da marca: o "F" facetado, direto do kit da Firmus. */
export function LogoMark({ className }: { className?: string }) {
  return <img src={symbol} alt="" aria-hidden className={cn('h-7 w-auto', className)} />
}

/**
 * Assinatura do produto: símbolo + "FIRMUS FLOW".
 * O lockup completo do kit diz "FIRMUS TECH", que é a empresa — dentro do
 * painel quem assina é o produto.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[0.7rem] leading-none tracking-[0.18em] text-noite">
        FIRMUS <span className="text-azul">FLOW</span>
      </span>
    </span>
  )
}
