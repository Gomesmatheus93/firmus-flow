import type { ContentType } from '@firmus/shared'
import type { TemplateKey } from '@firmus/templates'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'
import { PendingAction } from '@/components/pending-action'
import { Panel } from '@/components/surface'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PlanEntry } from '@/lib/api-types'
import { dayMonth } from '@/lib/calendar'
import { formatConfig } from './format-config'
import { TemplatePicker } from './template-picker'

/** O mesmo visual do `Input`, para o `<select>` nativo não destoar. */
const selectClass =
  'h-9 w-full rounded-md border border-input bg-white/70 px-3 text-sm text-noite shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

/**
 * O pedido de uma peça nova: de qual pauta, sobre o quê, de que tamanho.
 *
 * Ainda não envia nada: o agente de conteúdo não existe. Escolher uma pauta do
 * Planejamento já preenche o tema, e é esse o caminho principal — a pauta diz
 * o quê e por quê, a criação diz como.
 *
 * Quem usa troca o `key` deste componente ao mudar de formato, para os campos
 * voltarem ao início em vez de levar o tamanho do carrossel para o story.
 */
export function CreationForm({
  format,
  pautas,
}: {
  format: ContentType
  /** Pautas deste formato que ainda não viraram peça. */
  pautas: PlanEntry[]
}) {
  const config = formatConfig[format]

  const [pautaId, setPautaId] = useState('')
  const [theme, setTheme] = useState('')
  const [size, setSize] = useState(config.size?.initial ?? '')
  const [notes, setNotes] = useState('')
  const [template, setTemplate] = useState<TemplateKey | null>(null)

  function escolherPauta(id: string) {
    setPautaId(id)
    const pauta = pautas.find((p) => p.id === id)
    if (pauta) setTheme([pauta.theme, pauta.goal].filter(Boolean).join('. '))
  }

  return (
    <Panel className="p-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label htmlFor="creation-pauta">Pauta do planejamento</Label>
          <span className="text-xs text-ardosia">
            {pautas.length === 0
              ? 'Nenhuma pauta de ' + config.noun + ' esperando'
              : `${pautas.length} esperando para virar peça`}
          </span>
        </div>
        <select
          id="creation-pauta"
          value={pautaId}
          onChange={(e) => escolherPauta(e.target.value)}
          className={selectClass}
        >
          <option value="">Sem pauta: escrever o tema à mão</option>
          {pautas.map((p) => (
            <option key={p.id} value={p.id}>
              {dayMonth(p.scheduledDate)} · {p.theme}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor="creation-theme">Tema</Label>
        <Textarea
          id="creation-theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder={config.themePlaceholder}
          className="bg-white/70"
        />
      </div>

      <div className="mt-5">
        <TemplatePicker format={format} value={template} onChange={setTemplate} />
      </div>

      <div
        className={cn(
          'mt-5 grid gap-5',
          config.size ? 'sm:grid-cols-[12rem_1fr_auto]' : 'sm:grid-cols-[1fr_auto]',
        )}
      >
        {config.size && (
          <div className="space-y-2">
            <Label htmlFor="creation-size">{config.size.label}</Label>
            <select
              id="creation-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={selectClass}
            >
              {config.size.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="creation-notes">
            Observações <span className="font-normal text-ardosia">(opcional)</span>
          </Label>
          <Input
            id="creation-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Ex.: terminar chamando para o WhatsApp; não citar preço"
            className="bg-white/70"
          />
        </div>

        <div className="flex items-end">
          <PendingAction
            icon={Sparkles}
            label={`Criar ${config.noun}`}
            waitingFor="espera o agente de conteúdo"
          />
        </div>
      </div>
    </Panel>
  )
}
