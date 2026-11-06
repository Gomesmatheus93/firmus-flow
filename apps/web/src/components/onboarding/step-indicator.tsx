import { Check } from 'lucide-react'
import { cn } from 'cn'

/**
 * Os quatro passos no topo: concluído com ✓ em azul, o atual em azul cheio e
 * os próximos só com contorno cinza. A linha entre eles enche conforme avança.
 */
export function StepIndicator({ atual, total = 4 }: { atual: number; total?: number }) {
  return (
    <ol
      className="flex items-center justify-center"
      aria-label={`Passo ${Math.min(atual, total)} de ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const feito = n < atual
        const agora = n === atual

        return (
          <li key={n} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn('h-0.5 w-8 sm:w-12', n <= atual ? 'bg-azul' : 'bg-regua')}
              />
            )}
            <span
              aria-current={agora ? 'step' : undefined}
              className={cn(
                'tabular grid size-8 place-items-center rounded-full text-sm font-semibold transition-colors',
                feito && 'border-2 border-azul bg-white text-azul',
                agora && 'bg-azul text-white shadow-card',
                !feito && !agora && 'border-2 border-[#C9D3E1] bg-white text-ardosia',
              )}
            >
              {feito ? <Check className="size-4" strokeWidth={3} /> : n}
              <span className="sr-only">{feito ? ' concluído' : agora ? ' atual' : ''}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
