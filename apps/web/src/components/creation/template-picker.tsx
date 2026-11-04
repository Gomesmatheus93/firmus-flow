import type { ContentType } from '@firmus/shared'
import { templates, type Template, type TemplateKey } from '@firmus/templates'
import { Check, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from 'cn'
import symbolUrl from '@/assets/firmus-symbol.png'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useCompanyData } from '@/lib/queries'
import { SlideFrame } from './slide-frame'

/**
 * O iframe da prévia não tem endereço próprio (`srcdoc`), então caminho
 * relativo não acha o arquivo: o símbolo vai com o endereço completo.
 */
const assets = { symbolUrl: new URL(symbolUrl, window.location.href).href }

/** A prévia de um modelo, com setas para passar pelos tipos de slide. */
function PreviewDialog({
  template,
  open,
  onOpenChange,
  onChoose,
}: {
  template: Template
  open: boolean
  onOpenChange: (open: boolean) => void
  onChoose: () => void
}) {
  const slides = useMemo(() => template.preview(assets), [template])
  const [atual, setAtual] = useState(0)
  const slide = slides[atual]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(94vw,32rem)] gap-4 p-5">
        <div className="pr-8">
          <DialogTitle className="text-base font-semibold text-noite">{template.name}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-ardosia">
            {template.description}
          </DialogDescription>
        </div>

        {slide && (
          <div className="relative">
            <SlideFrame
              html={slide.html}
              title={`${template.name}: ${slide.label}`}
              className="rounded-lg border border-border"
            />
            <span className="absolute top-3 left-3 rounded-full bg-noite/80 px-2.5 py-1 text-xs font-medium text-white">
              Texto de exemplo
            </span>
          </div>
        )}

        {slides.length > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={atual === 0}
              onClick={() => setAtual(atual - 1)}
            >
              <ChevronLeft />
              Anterior
            </Button>
            <span className="text-xs text-ardosia">
              <span className="font-medium text-noite">{slide?.label}</span>
              <span className="tabular">
                {' '}
                · {atual + 1}/{slides.length}
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={atual === slides.length - 1}
              onClick={() => setAtual(atual + 1)}
            >
              Próximo
              <ChevronRight />
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => {
              onChoose()
              onOpenChange(false)
            }}
          >
            <Check />
            Usar este modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Um cartão de modelo: a capa em miniatura, o nome e o botão de prévia. */
function TemplateCard({
  template,
  selected,
  onSelect,
  onPreview,
}: {
  template: Template
  selected: boolean
  onSelect: () => void
  onPreview: () => void
}) {
  const capa = useMemo(() => template.preview(assets)[0], [template])

  return (
    <div
      className={cn(
        'w-40 shrink-0 overflow-hidden rounded-xl border-2 bg-white/70 transition-colors',
        selected ? 'border-azul' : 'border-transparent hover:border-input',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Usar o modelo ${template.name}`}
        className="relative block w-full text-left"
      >
        {capa && <SlideFrame html={capa.html} title={`Capa do modelo ${template.name}`} />}
        {selected && (
          <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-azul text-white">
            <Check className="size-3.5" />
          </span>
        )}
      </button>
      <div className="flex items-center justify-between gap-1 px-2.5 py-2">
        <span className="truncate text-xs font-medium text-noite">{template.name}</span>
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Ver a prévia do modelo ${template.name}`}
          className="grid size-7 shrink-0 place-items-center rounded-md text-ardosia hover:bg-white hover:text-azul"
        >
          <Eye className="size-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Escolha do modelo visual, com prévia antes de gerar.
 *
 * Só aparece quando a empresa tem modelo liberado para este formato: quem
 * decide é a api (`GET /templates`), por empresa. `null` é "o agente escolhe".
 */
export function TemplatePicker({
  format,
  value,
  onChange,
}: {
  format: ContentType
  value: TemplateKey | null
  onChange: (key: TemplateKey | null) => void
}) {
  const { data } = useCompanyData<{ keys: TemplateKey[] }>(['templates'], '/templates', {
    keys: [],
  })
  const [emPrevia, setEmPrevia] = useState<TemplateKey | null>(null)

  const disponiveis = data.keys.map((k) => templates[k]).filter((t) => t.formats.includes(format))

  if (disponiveis.length === 0) return null

  const previa = emPrevia ? templates[emPrevia] : null

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label>Modelo</Label>
        <span className="text-xs text-ardosia">
          {value ? `Escolhido: ${templates[value].name}` : 'Sem modelo: o agente escolhe'}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Modelos">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={cn(
            'grid w-28 shrink-0 place-items-center rounded-xl border-2 border-dashed px-3 text-center text-xs font-medium transition-colors',
            value === null
              ? 'border-azul bg-azul/5 text-azul'
              : 'border-input text-ardosia hover:bg-white/70',
          )}
        >
          O agente escolhe
        </button>

        {disponiveis.map((template) => (
          <TemplateCard
            key={template.key}
            template={template}
            selected={value === template.key}
            onSelect={() => onChange(template.key)}
            onPreview={() => setEmPrevia(template.key)}
          />
        ))}
      </div>

      {/* O `key` volta a prévia para o primeiro slide a cada modelo aberto. */}
      {previa && (
        <PreviewDialog
          key={previa.key}
          template={previa}
          open={emPrevia !== null}
          onOpenChange={(open) => !open && setEmPrevia(null)}
          onChoose={() => onChange(previa.key)}
        />
      )}
    </div>
  )
}
