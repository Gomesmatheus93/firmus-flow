import { Download } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { leads } from '@/mocks/support'

const stageTone: Record<string, string> = {
  Quente: 'border-destructive/30 bg-destructive/10 text-destructive',
  Novo: 'border-ciano/30 bg-ciano/10 text-ciano',
  Frio: 'border-border bg-muted text-muted-foreground',
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

      <section className="glass overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Nome</th>
                <th className="px-5 py-3 font-semibold">Interesse</th>
                <th className="px-5 py-3 font-semibold">Origem</th>
                <th className="px-5 py-3 font-semibold">Entrou em</th>
                <th className="px-5 py-3 font-semibold">Estágio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={lead.id} className="transition-colors hover:bg-accent">
                  <td className="px-5 py-3.5 font-medium text-gelo">{lead.name}</td>
                  <td className="px-5 py-3.5 text-foreground">{lead.interest}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{lead.source}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{lead.createdAt}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        stageTone[lead.stage],
                      )}
                    >
                      {lead.stage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
