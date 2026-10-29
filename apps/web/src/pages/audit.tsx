import { Check, Download, RefreshCw } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/surface'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { auditIssues, auditScore, auditStrengths } from '@/mocks/audit'

const priorityTone = {
  alta: 'bg-destructive',
  media: 'bg-amber-500',
  baixa: 'bg-ardosia',
} as const

const priorityLabel = {
  alta: 'Prioridade alta',
  media: 'Prioridade média',
  baixa: 'Prioridade baixa',
} as const

export function AuditPage() {
  return (
    <>
      <PageHeader
        title="Auditoria"
        description={`Diagnóstico do Instagram e do atendimento. Última análise em ${auditScore.updatedAt}.`}
        badge={<SampleBadge />}
        actions={
          <>
            <Button variant="outline">
              <RefreshCw />
              Refazer
            </Button>
            <Button>
              <Download />
              Baixar PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* A assinatura da tela: bloco chanfrado, o único da página. */}
        <section className="chamfer min-w-0 bg-noite p-6 text-white">
          <p className="text-xs text-white/55">Nota geral</p>
          <p className="tabular mt-6 text-6xl leading-none font-semibold tracking-tight">
            {auditScore.overall.toLocaleString('pt-BR')}
          </p>
          <p className="mt-3 text-sm text-white/60">de 10</p>
        </section>

        <Panel>
          <SectionHeading>Notas por área</SectionHeading>
          <ul className="mt-5 space-y-5">
            {auditScore.areas.map((area) => (
              <li key={area.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-grafite">{area.label}</span>
                  <span className="tabular text-sm font-semibold text-noite">
                    {area.score.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/70">
                  <div
                    className="h-full rounded-full bg-azul"
                    style={{ width: `${area.score * 10}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <SectionHeading>Pontos fortes</SectionHeading>
        <ul className="mt-4 space-y-2.5">
          {auditStrengths.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-grafite">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              {item}
            </li>
          ))}
        </ul>
      </Panel>

      <section>
        <SectionHeading>Problemas encontrados</SectionHeading>
        <p className="mt-3 text-sm text-ardosia">
          Em ordem de impacto. Resolver os de prioridade alta muda o resultado mais rápido.
        </p>

        <ul className="mt-5 surface divide-y divide-border overflow-hidden">
          {auditIssues.map((issue) => (
            <li key={issue.id} className="flex gap-4 p-5">
              <span
                aria-hidden
                className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', priorityTone[issue.priority])}
              />
              <div className="min-w-0">
                <p className="text-xs text-ardosia">{priorityLabel[issue.priority]}</p>
                <h3 className="mt-1.5 text-sm font-medium text-noite">{issue.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ardosia">{issue.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
