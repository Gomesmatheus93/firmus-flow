import { Check, Download, RefreshCw } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { auditIssues, auditScore, auditStrengths } from '@/mocks/audit'

const priorityTone = {
  alta: 'border-destructive/30 bg-destructive/10 text-destructive',
  media: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  baixa: 'border-border bg-muted text-muted-foreground',
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

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="glass edge grid place-items-center rounded-xl border border-border bg-card p-8 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Nota geral</p>
            <p className="tabular halo mt-3 text-6xl leading-none font-semibold text-gelo">
              {auditScore.overall.toLocaleString('pt-BR')}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">de 10</p>
          </div>
        </article>

        <article className="glass rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="text-base font-medium text-gelo">Notas por área</h2>
          <ul className="mt-5 space-y-4">
            {auditScore.areas.map((area) => (
              <li key={area.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-foreground">{area.label}</span>
                  <span className="tabular text-sm font-semibold text-gelo">
                    {area.score.toLocaleString('pt-BR')}
                  </span>
                </div>
                <Progress value={area.score * 10} className="mt-2 h-1.5" />
              </li>
            ))}
          </ul>
        </article>
      </div>

      <section className="glass rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-medium text-gelo">Pontos fortes</h2>
        <ul className="mt-4 space-y-2.5">
          {auditStrengths.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-ciano" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-medium text-gelo">Problemas encontrados</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Em ordem de impacto. Resolver os de prioridade alta muda o resultado mais rápido.
        </p>

        <ul className="mt-4 space-y-3">
          {auditIssues.map((issue) => (
            <li key={issue.id} className="glass rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    priorityTone[issue.priority],
                  )}
                >
                  {priorityLabel[issue.priority]}
                </span>
                <h3 className="text-sm font-medium text-gelo">{issue.title}</h3>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{issue.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
