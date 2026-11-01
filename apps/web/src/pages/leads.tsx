import { leadStageLabel, type LeadStage } from '@firmus/shared'
import { Contact, Download } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { AsyncState } from '@/components/async-state'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { baixarCsv, toCsv } from '@/lib/csv'
import { formatDate } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import type { LeadRow } from '@/lib/api-types'

const stageTone: Record<LeadStage, string> = {
  quente: 'bg-destructive',
  novo: 'bg-azul',
  frio: 'bg-ardosia',
  ganho: 'bg-emerald-500',
  perdido: 'bg-ardosia',
}

export function LeadsPage() {
  const { data, isPending, error } = useCompanyData<{ leads: LeadRow[] }>(['leads'], '/leads', {
    leads: [],
  })

  function exportar() {
    const csv = toCsv(
      ['Nome', 'Interesse', 'Origem', 'Situação', 'Entrou em'],
      data.leads.map((lead) => [
        lead.name,
        lead.interest,
        lead.source,
        leadStageLabel[lead.stage],
        formatDate(lead.createdAt),
      ]),
    )

    const dia = new Date().toISOString().slice(0, 10)
    baixarCsv(`leads-${dia}.csv`, csv)
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description="Contatos que a IA qualificou durante as conversas no WhatsApp."
        actions={
          <Button variant="outline" disabled={data.leads.length === 0} onClick={exportar}>
            <Download />
            Exportar CSV
          </Button>
        }
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.leads.length === 0}
        empty={{
          icon: Contact,
          title: 'Nenhum lead ainda',
          description:
            'Quando o atendente de IA identificar interesse numa conversa, o contato entra nesta lista automaticamente.',
        }}
      >
        <DataTable
          caption={`${data.leads.length} contatos`}
          rows={data.leads}
          rowKey={(lead) => lead.id}
          columns={[
            {
              header: 'Nome',
              cell: (lead) => <span className="font-medium text-noite">{lead.name}</span>,
            },
            { header: 'Interesse', cell: (lead) => lead.interest ?? '—' },
            {
              header: 'Origem',
              cell: (lead) => <span className="text-ardosia">{lead.source ?? '—'}</span>,
            },
            {
              header: 'Entrou em',
              cell: (lead) => <span className="text-ardosia">{formatDate(lead.createdAt)}</span>,
            },
            {
              header: 'Estágio',
              cell: (lead) => (
                <span className="inline-flex items-center gap-1.5 text-grafite">
                  <span
                    aria-hidden
                    className={cn('size-1.5 shrink-0 rounded-full', stageTone[lead.stage])}
                  />
                  {leadStageLabel[lead.stage]}
                </span>
              ),
            },
          ]}
        />
      </AsyncState>
    </>
  )
}
