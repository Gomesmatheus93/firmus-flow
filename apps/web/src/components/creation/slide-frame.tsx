import { HEIGHT, WIDTH } from '@firmus/templates'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'cn'

/**
 * Um slide do modelo desenhado de verdade, em tamanho de feed (1080x1350) ou
 * de story (`height` 1920), e reduzido para caber onde estiver.
 *
 * O HTML entra num `iframe` com `sandbox` vazio: nada de script roda lá
 * dentro, e o estilo do slide não vaza para a página nem o da página para o
 * slide. É o mesmo HTML que o worker vai fotografar, então o que se vê aqui é
 * o que vai sair.
 */
export function SlideFrame({
  html,
  title,
  className,
  height = HEIGHT,
}: {
  html: string
  title: string
  className?: string
  /** Altura do slide em pixels: 1350 no feed, 1920 no story. */
  height?: number
}) {
  const caixa = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(0)

  // A escala acompanha a largura da caixa: cartão pequeno, prévia grande.
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const observador = new ResizeObserver(([entrada]) => {
      if (entrada) setEscala(entrada.contentRect.width / WIDTH)
    })
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      ref={caixa}
      className={cn('relative w-full overflow-hidden bg-gelo', className)}
      style={{ aspectRatio: `${WIDTH} / ${height}` }}
    >
      {escala > 0 && (
        <iframe
          title={title}
          srcDoc={html}
          sandbox=""
          loading="lazy"
          tabIndex={-1}
          width={WIDTH}
          height={height}
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{ transform: `scale(${escala})` }}
        />
      )}
    </div>
  )
}
