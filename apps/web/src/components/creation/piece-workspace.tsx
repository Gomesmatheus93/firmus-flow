import type { ContentType } from '@firmus/shared'
import { Check, Copy, Download, ImageOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { SectionHeading } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Panel } from '@/components/surface'
import { Button } from '@/components/ui/button'
import type { ContentItem, ContentSlide } from '@/lib/api-types'
import { formatDate } from '@/lib/dates'
import { buildSlidesZip, saveBlob, slideFileName, slugify } from '@/lib/zip'
import { formatConfig } from './format-config'

/**
 * O slide grande. Sem imagem ainda, mostra o texto do slide num quadro do
 * mesmo tamanho, para quem revisa já ter noção do que vai em cada um.
 */
function SlidePreview({ slide, aspect }: { slide: ContentSlide | undefined; aspect: string }) {
  if (slide?.imageUrl) {
    return (
      <img
        src={slide.imageUrl}
        alt={slide.title ?? 'Prévia do slide'}
        className={cn('w-full rounded-xl border border-border object-cover shadow-card', aspect)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col justify-between rounded-xl border border-dashed border-input bg-white/60 p-6',
        aspect,
      )}
    >
      <div className="min-w-0">
        {slide?.label && <p className="label text-azul">{slide.label}</p>}
        <p className="mt-3 text-xl leading-snug font-semibold text-noite">
          {slide?.title ?? 'Sem texto'}
        </p>
        {slide?.body && <p className="mt-3 text-sm leading-relaxed text-ardosia">{slide.body}</p>}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-ardosia">
        <ImageOff className="size-3.5" />A imagem chega com o agente de design
      </p>
    </div>
  )
}

/** Botão que copia a legenda e confirma, para colar no Meta Business Suite. */
function CopyCaption({ caption }: { caption: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(caption)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('O navegador não deixou copiar. Selecione o texto e copie à mão.')
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void copiar()}>
      {copiado ? <Check /> : <Copy />}
      {copiado ? 'Copiada' : 'Copiar legenda'}
    </Button>
  )
}

/**
 * Baixa todas as artes da peça num .zip, na ordem, com a legenda num .txt.
 * Só aparece quando a peça tem imagem.
 */
export function DownloadZip({ item, size = 'sm' }: { item: ContentItem; size?: 'sm' | 'default' }) {
  const [baixando, setBaixando] = useState(false)

  const slides = item.slides
    .map((s, i) => (s.imageUrl ? { url: s.imageUrl, nome: slideFileName(i, s.label) } : null))
    .filter((s): s is { url: string; nome: string } => s !== null)

  if (slides.length === 0) return null

  async function baixar() {
    setBaixando(true)
    try {
      const zip = await buildSlidesZip(slides, item.caption)
      saveBlob(zip, `${slugify(item.title)}.zip`)
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Não consegui montar o arquivo.')
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Button size={size} onClick={() => void baixar()} disabled={baixando}>
      <Download />
      {baixando ? 'Preparando…' : `Baixar artes (.zip)`}
    </Button>
  )
}

/**
 * Uma peça aberta: a prévia à esquerda, com as miniaturas embaixo, e o texto
 * de cada slide à direita. Clicar num lado mexe no outro.
 */
export function PieceWorkspace({ item, format }: { item: ContentItem; format: ContentType }) {
  const config = formatConfig[format]
  const [atual, setAtual] = useState(0)
  const slides = item.slides
  const total = slides.length
  // Story e reel são verticais: a prévia fica estreita e centralizada.
  const vertical = format === 'story' || format === 'reel'

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className={cn(vertical && 'mx-auto max-w-[18rem]')}>
          <SlidePreview slide={slides[atual]} aspect={config.aspect} />
        </div>

        {total > 1 && (
          <ol
            className={cn('mt-3 flex gap-2 overflow-x-auto pb-1', vertical && 'justify-center')}
            aria-label={`${config.unit.many}`}
          >
            {slides.map((slide, i) => (
              <li key={i} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setAtual(i)}
                  aria-current={i === atual}
                  aria-label={`${config.unit.one} ${i + 1} de ${total}`}
                  className={cn(
                    'block overflow-hidden rounded-md border-2 transition-colors',
                    i === atual ? 'border-azul' : 'border-transparent hover:border-input',
                  )}
                >
                  {slide.imageUrl ? (
                    <img
                      src={slide.imageUrl}
                      alt=""
                      loading="lazy"
                      className={cn('w-14 object-cover', config.aspect)}
                    />
                  ) : (
                    <span
                      className={cn(
                        'tabular grid w-14 place-items-center bg-white/70 text-xs text-ardosia',
                        config.aspect,
                      )}
                    >
                      {i + 1}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Panel className="min-w-0 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg leading-snug font-semibold text-noite">{item.title}</h2>
            <p className="mt-1 text-xs text-ardosia">
              Criado em {formatDate(item.createdAt)}
              {item.authorName ? ` por ${item.authorName}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <DownloadZip item={item} />
          </div>
        </div>

        {item.reviewNote && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Pedido de ajuste: {item.reviewNote}
          </p>
        )}

        {total > 0 && (
          <ol className="mt-5 space-y-1">
            {slides.map((slide, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setAtual(i)}
                  aria-current={i === atual}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                    i === atual ? 'bg-azul/8 ring-1 ring-azul/20' : 'hover:bg-white/70',
                  )}
                >
                  <span className="flex items-baseline gap-2">
                    <span className="tabular shrink-0 font-mono text-[0.7rem] text-ardosia">
                      {i + 1}/{total}
                      {slide.label ? ` · ${slide.label.toLowerCase()}` : ''}
                    </span>
                    <span className="min-w-0 text-sm font-medium text-noite">
                      {slide.title ?? 'Sem título'}
                    </span>
                  </span>
                  {slide.body && (
                    <span className="mt-1 block text-sm leading-relaxed text-ardosia">
                      {slide.body}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        )}

        {item.caption && (
          <section className="mt-6 border-t border-border pt-5">
            <SectionHeading aside={<CopyCaption caption={item.caption} />}>Legenda</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-grafite">
              {item.caption}
            </p>
          </section>
        )}
      </Panel>
    </div>
  )
}
