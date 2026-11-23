import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { cn } from 'cn'

/**
 * Os blocos da tela de Analytics.
 *
 * Esta tela tem visual próprio, pedido pelo Matheus a partir de uma referência:
 * cartões brancos com um tom pastel no canto e ícone em degradê colorido, um
 * por métrica. É a exceção registrada no CLAUDE.md ("Identidade visual") — as
 * cores dos tons moram aqui, num lugar só, e não espalhadas pela página.
 */

type Icone = ComponentType<{ className?: string }>

/**
 * O glifo da câmera do Instagram: quadrado arredondado, lente e o pontinho.
 * Desenhado aqui porque o lucide tirou os ícones de marca na versão 1.
 */
export function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

/** Os tons da tela: o degradê do ícone e o pastel do canto do cartão. */
export const tons = {
  roxo: { icone: 'linear-gradient(135deg,#a855f7,#7e22ce)', canto: '#f3e8ff' },
  instagram: { icone: 'linear-gradient(135deg,#a855f7,#ec4899 55%,#f97316)', canto: '#fce7f3' },
  laranja: { icone: 'linear-gradient(135deg,#fb923c,#ef4444)', canto: '#ffedd5' },
  azul: { icone: 'linear-gradient(135deg,#38bdf8,#0284c7)', canto: '#e0f2fe' },
  verde: { icone: 'linear-gradient(135deg,#34d399,#059669)', canto: '#d1fae5' },
  ambar: { icone: 'linear-gradient(135deg,#fbbf24,#f97316)', canto: '#fef3c7' },
  rosa: { icone: 'linear-gradient(135deg,#f472b6,#e11d48)', canto: '#ffe4e6' },
  violeta: { icone: 'linear-gradient(135deg,#c084fc,#9333ea)', canto: '#f3e8ff' },
  ciano: { icone: 'linear-gradient(135deg,#22d3ee,#0ea5e9)', canto: '#cffafe' },
} as const

export type Tom = keyof typeof tons

/** O quadradinho com o ícone em degradê. */
export function IconTile({
  icon: Icon,
  tom,
  size = 'md',
}: {
  icon: Icone
  tom: Tom
  size?: 'sm' | 'md'
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-xl text-white shadow-sm',
        size === 'md' ? 'size-10' : 'size-8',
      )}
      style={{ backgroundImage: tons[tom].icone }}
    >
      <Icon className={size === 'md' ? 'size-5' : 'size-4'} />
    </span>
  )
}

/** Cartão branco com o pastel do tom no canto. */
export function TintCard({
  tom,
  className,
  children,
}: {
  tom?: Tom
  className?: string
  children: ReactNode
}) {
  const style: CSSProperties | undefined = tom
    ? {
        backgroundImage: `radial-gradient(120% 90% at 100% 0%, ${tons[tom].canto} 0%, #ffffff 55%)`,
      }
    : undefined

  return (
    <section
      className={cn('min-w-0 rounded-2xl border border-white bg-white shadow-card', className)}
      style={style}
    >
      {children}
    </section>
  )
}

/**
 * Um cartão de métrica. `value` nulo mostra "— —", como na referência: a Meta
 * não entregou o número. O `nota` explica o porquê ou de onde o número vem.
 */
export function MetricCard({
  label,
  value,
  icon,
  tom,
  nota,
  destaque,
}: {
  label: string
  value: string | null
  icon: Icone
  tom: Tom
  nota?: ReactNode
  /** Linha colorida embaixo do número, como o "+222 nos últimos 30d". */
  destaque?: ReactNode
}) {
  return (
    <TintCard tom={tom} className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-1 text-[11px] font-semibold tracking-[0.14em] text-ardosia uppercase">
          {label}
        </p>
        <IconTile icon={icon} tom={tom} />
      </div>
      <p className="tabular mt-2 text-[1.75rem] leading-none font-bold tracking-tight text-grafite">
        {value ?? <span className="text-ardosia/50">— —</span>}
      </p>
      {destaque && <p className="mt-3 text-xs font-semibold text-emerald-600">{destaque}</p>}
      {nota && <p className={cn('text-sm text-ardosia', destaque ? 'mt-1' : 'mt-3')}>{nota}</p>}
    </TintCard>
  )
}

/** Cabeçalho de cartão de gráfico: título e o período embaixo. */
export function ChartCard({
  title,
  subtitle,
  aside,
  className,
  children,
}: {
  title: string
  subtitle?: string
  aside?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <TintCard className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-grafite">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ardosia">{subtitle}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </TintCard>
  )
}

/** Estado vazio de um bloco só, quando a Meta não entregou aquele pedaço. */
export function BlockEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="grid min-h-40 place-items-center rounded-xl bg-gelo px-6 text-center text-sm leading-relaxed text-ardosia">
      {children}
    </p>
  )
}

/** Uma lista de barras horizontais: cidade, idade, tipo de interação. */
export function BarList({
  items,
  format,
  cor = '#a855f7',
}: {
  items: { label: string; value: number }[]
  format: (n: number) => string
  cor?: string
}) {
  const maior = Math.max(1, ...items.map((i) => i.value))

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-grafite">{item.label}</span>
            <span className="tabular shrink-0 font-semibold text-grafite">
              {format(item.value)}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gelo">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / maior) * 100}%`, backgroundColor: cor }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
