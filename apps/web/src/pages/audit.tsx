import type { AuditPriority } from '@firmus/shared'
import { Check, Download, Gauge, RefreshCw } from 'lucide-react'
import { cn } from 'cn'
import { AsyncState } from '@/components/async-state'
import { PendingAction } from '@/components/pending-action'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { FeatureBlock, Panel } from '@/components/surface'
import { formatDate } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import type { BrandBrain } from './brand'

const priorityTone: Record<AuditPriority, string> = {
  alta: 'bg-destructive',
  media: 'bg-amber-500',
  baixa: 'bg-ardosia',
}

const priorityLabel: Record<AuditPriority, string> = {
  alta: 'Prioridade alta',
  media: 'Prioridade média',
  baixa: 'Prioridade baixa',
}

export function AuditPage() {
  const { data, isPending, error } = useCompanyData<{ brain: BrandBrain | null }>(
    ['brand'],
    '/brand',
    { brain: null },
  )

  const audit = data.brain?.auditFindings ?? null

  return (
    <>
      <PageHeader
        title="Auditoria"
        description={
          audit
            ? `Diagnóstico do Instagram e do atendimento. Última análise em ${formatDate(audit.generatedAt)}.`
            : 'Diagnóstico do Instagram e do atendimento.'
        }
        actions={
          <>
            <PendingAction
              icon={RefreshCw}
              label={audit ? 'Refazer' : 'Rodar auditoria'}
              variant="outline"
              waitingFor="espera o agente de auditoria"
            />
            {audit && (
              <PendingAction
                icon={Download}
                label="Baixar PDF"
                waitingFor="espera a geração do relatório"
              />
            )}
          </>
        }
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={!audit}
        empty={{
          icon: Gauge,
          title: 'Nenhuma auditoria ainda',
          description:
            'O agente de auditoria analisa o perfil do Instagram e o atendimento, e devolve uma nota, os pontos fortes e os problemas em ordem de impacto.',
        }}
      >
        {audit && (
          <>
            <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
              <FeatureBlock>
                <p className="text-xs text-white/55">Nota geral</p>
                <p className="tabular mt-6 text-6xl leading-none font-semibold tracking-tight">
                  {audit.overallScore.toLocaleString('pt-BR')}
                </p>
                <p className="mt-3 text-sm text-white/60">de 10</p>
              </FeatureBlock>

              <Panel>
                <SectionHeading>Notas por área</SectionHeading>
                <ul className="mt-5 space-y-5">
                  {audit.areas.map((area) => (
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

            {audit.strengths.length > 0 && (
              <Panel>
                <SectionHeading>Pontos fortes</SectionHeading>
                <ul className="mt-4 space-y-2.5">
                  {audit.strengths.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-grafite">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {audit.issues.length > 0 && (
              <section>
                <SectionHeading>Problemas encontrados</SectionHeading>
                <p className="mt-3 text-sm text-ardosia">
                  Em ordem de impacto. Resolver os de prioridade alta muda o resultado mais rápido.
                </p>

                <ul className="surface mt-5 divide-y divide-border overflow-hidden">
                  {audit.issues.map((issue) => (
                    <li key={issue.title} className="flex gap-4 p-5">
                      <span
                        aria-hidden
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          priorityTone[issue.priority],
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-ardosia">{priorityLabel[issue.priority]}</p>
                        <h3 className="mt-1.5 text-sm font-medium text-noite">{issue.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ardosia">
                          {issue.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </AsyncState>
    </>
  )
}
