import { Download } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { leads } from '@/mocks/support'

const stageTone: Record<string, string> = {
  Quente: 'bg-destructive',
  Novo: 'bg-azul',
  Frio: 'bg-ardosia',
}

export function LeadsPage() {
  return (
    <>
      <PageHeader
        title="Leads"
        description="Contatos que a IA qualificou durante as conversas no WhatsApp."
        badge={<SampleBadge />}
        actions={
          <Button variant="outline">
            <Download />
            Exportar CSV
          </Button>
        }
      />

      <DataTable
        caption={`${leads.length} contatos`}
        rows={leads}
        rowKey={(lead) => lead.id}
        columns={[
          {
            header: 'Nome',
            cell: (lead) => <span className="font-medium text-noite">{lead.name}</span>,
          },
          { header: 'Interesse', cell: (lead) => lead.interest },
          {
            header: 'Origem',
            cell: (lead) => <span className="text-ardosia">{lead.source}</span>,
          },
          {
            header: 'Entrou em',
            cell: (lead) => <span className="text-ardosia">{lead.createdAt}</span>,
          },
          {
            header: 'Estágio',
            cell: (lead) => (
              <span className="inline-flex items-center gap-1.5 text-grafite">
                <span
                  aria-hidden
                  className={cn('size-1.5 shrink-0 rounded-full', stageTone[lead.stage])}
                />
                {lead.stage}
              </span>
            ),
          },
        ]}
      />
    </>
  )
}
