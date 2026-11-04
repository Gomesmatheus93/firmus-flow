import { contentTypeLabel, contentTypeSchema, type ContentType } from '@firmus/shared'
import { Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from 'cn'
import { formatStyle } from '@/components/format-badge'
import { PendingAction } from '@/components/pending-action'
import { Panel } from '@/components/surface'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addDays, dayMonth, nextMonday } from '@/lib/calendar'

type Period = 'semana' | 'mes'

/** O mês do planejamento é de quatro semanas: a conta de posts fica exata. */
const SEMANAS: Record<Period, number> = { semana: 1, mes: 4 }

const FORMATOS = contentTypeSchema.options

/** Botão de escolha que fica marcado, para período e formatos. */
function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors',
        selected
          ? 'border-noite bg-noite text-white'
          : 'border-input bg-white/70 text-grafite hover:bg-white',
      )}
    >
      {children}
    </button>
  )
}

/**
 * O pedido de planejamento: período, início, ritmo e formatos.
 *
 * Ainda não envia nada: o agente estrategista não existe. Os campos já
 * funcionam e o resumo embaixo mostra o que seria pedido, para a tela estar
 * pronta no dia em que o botão for ligado.
 */
export function PlanForm() {
  const [period, setPeriod] = useState<Period>('semana')
  const [start, setStart] = useState(() => nextMonday())
  const [perWeek, setPerWeek] = useState(3)
  const [formats, setFormats] = useState<ContentType[]>(['carrossel', 'post'])
  const [notes, setNotes] = useState('')

  function toggleFormat(format: ContentType) {
    setFormats((atuais) =>
      atuais.includes(format) ? atuais.filter((f) => f !== format) : [...atuais, format],
    )
  }

  const semanas = SEMANAS[period]
  const fim = addDays(start || nextMonday(), semanas * 7 - 1)
  const total = perWeek * semanas
  const semFormato = formats.length === 0

  return (
    <Panel className="p-6">
      <div className="grid gap-6 lg:grid-cols-[auto_auto_auto_1fr]">
        <div className="space-y-2">
          <Label>Período</Label>
          <div className="flex gap-2" role="group" aria-label="Período">
            <Choice selected={period === 'semana'} onClick={() => setPeriod('semana')}>
              Semana
            </Choice>
            <Choice selected={period === 'mes'} onClick={() => setPeriod('mes')}>
              Mês
            </Choice>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-start">Começa em</Label>
          <Input
            id="plan-start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-40 bg-white/70"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-per-week">Posts por semana</Label>
          <Input
            id="plan-per-week"
            type="number"
            min={1}
            max={7}
            value={perWeek}
            onChange={(e) => setPerWeek(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
            className="tabular w-24 bg-white/70"
          />
        </div>

        <div className="space-y-2">
          <Label>Formatos</Label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Formatos">
            {FORMATOS.map((format) => {
              const Icon = formatStyle[format].icon
              return (
                <Choice
                  key={format}
                  selected={formats.includes(format)}
                  onClick={() => toggleFormat(format)}
                >
                  <Icon className="size-4" />
                  {contentTypeLabel[format]}
                </Choice>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="plan-notes">
          Observações <span className="font-normal text-ardosia">(opcional)</span>
        </Label>
        <Textarea
          id="plan-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="O que o agente precisa saber: uma data importante, um serviço para destacar, um assunto para evitar."
          className="bg-white/70"
        />
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-ardosia">
          {semFormato ? (
            <span className="text-destructive">Escolha pelo menos um formato.</span>
          ) : (
            <>
              <span className="tabular font-semibold text-noite">{total} pautas</span> de{' '}
              <span className="tabular">{dayMonth(start || nextMonday())}</span> a{' '}
              <span className="tabular">{dayMonth(fim)}</span>, em{' '}
              {formats.map((f) => contentTypeLabel[f].toLowerCase()).join(', ')}.
            </>
          )}
        </p>

        <PendingAction
          icon={Sparkles}
          label="Gerar planejamento"
          waitingFor="espera o agente estrategista"
        />
      </div>
    </Panel>
  )
}
