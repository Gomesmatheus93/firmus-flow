import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

/**
 * As imagens de uma peça em miniatura, com clique para ver grande.
 *
 * Os links vêm da api e valem por uma hora: o bucket é privado, então não há
 * endereço fixo de imagem para guardar no navegador.
 */
export function SlideStrip({ title, images }: { title: string; images: string[] }) {
  const [aberto, setAberto] = useState<number | null>(null)

  if (images.length === 0) return null

  const atual = aberto ?? 0

  return (
    <>
      <ul className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label={`Slides de ${title}`}>
        {images.map((url, i) => (
          <li key={url} className="shrink-0">
            <button
              type="button"
              onClick={() => setAberto(i)}
              className="block overflow-hidden rounded-md border border-border transition-colors hover:border-azul focus-visible:border-azul focus-visible:outline-none"
            >
              {/* 4:5 é o retrato do feed do Instagram (1080x1350). */}
              <img
                src={url}
                alt={`Slide ${i + 1} de ${images.length}`}
                loading="lazy"
                className="aspect-[4/5] w-24 object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={aberto !== null} onOpenChange={(open) => !open && setAberto(null)}>
        <DialogContent className="max-w-[min(92vw,34rem)] gap-4 p-4">
          <DialogTitle className="pr-8 text-sm font-medium text-noite">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Slide {atual + 1} de {images.length}
          </DialogDescription>

          <img
            src={images[atual]}
            alt={`Slide ${atual + 1} de ${images.length}`}
            className="aspect-[4/5] w-full rounded-md border border-border object-contain"
          />

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={atual === 0}
              onClick={() => setAberto(atual - 1)}
            >
              <ChevronLeft />
              Anterior
            </Button>
            <span className="tabular text-xs text-ardosia">
              {atual + 1} / {images.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={atual === images.length - 1}
              onClick={() => setAberto(atual + 1)}
            >
              Próximo
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
