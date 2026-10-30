import { contentTypeLabel, type ContentType } from '@firmus/shared'
import { CalendarDays, Sparkles } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { AsyncState } from '@/components/async-state'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { useCompanyData } from '@/lib/queries'
import type { PlanEntry } from '@/lib/api-types'

const formatTone: Record<ContentType, string> = {
  carrossel: 'bg-azul',
  reel: 'bg-noite',
  post: 'bg-amber-500',
  story: 'bg-ciano',
}

/** "2026-11-03" vira "03/11" sem passar por Date, que mudaria o dia pelo fuso. */
function dayAndMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

export function PlanPage() {
  const { data, isPending, error } = useCompanyData<{ entries: PlanEntry[] }>(['plan'], '/plan', {
    entries: [],
  })

  return (
    <>
      <PageHeader
        title="Planejamento"
        description="O que publicar, quando e com qual objetivo. Gerado a partir do Cérebro da Marca."
        actions={
          <Button>
            <Sparkles />
            Gerar planejamento
          </Button>
        }
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.entries.length === 0}
        empty={{
          icon: CalendarDays,
          title: 'Nenhum planejamento ainda',
          description:
            'O agente estrategista monta o calendário do mês a partir do Cérebro da Marca. Assim que rodar, os temas aparecem aqui.',
        }}
      >
        <DataTable
          caption={`${data.entries.length} publicações planejadas`}
          rows={data.entries}
          rowKey={(entry) => entry.id}
          columns={[
            {
              header: 'Data',
              cell: (entry) => (
                <span className="text-ardosia">{dayAndMonth(entry.scheduledDate)}</span>
              ),
            },
            {
              header: 'Formato',
              className: 'whitespace-nowrap',
              cell: (entry) => (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn('size-1.5 shrink-0 rounded-full', formatTone[entry.format])}
                  />
                  {contentTypeLabel[entry.format]}
                </span>
              ),
            },
            {
              header: 'Tema',
              cell: (entry) => <span className="font-medium text-noite">{entry.theme}</span>,
            },
            {
              header: 'Objetivo',
              cell: (entry) => <span className="text-ardosia">{entry.goal ?? '—'}</span>,
            },
          ]}
        />
      </AsyncState>
    </>
  )
}
