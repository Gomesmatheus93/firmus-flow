import { Check, Download, MessageSquareWarning, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { approvals } from '@/mocks/content'
import { currentUser } from '@/mocks/session'

export function ApprovalsPage() {
  const isBoss = currentUser.role === 'chefe'

  return (
    <>
      <PageHeader
        title="Aprovações"
        description={
          isBoss
            ? 'Conteúdo pronto esperando sua decisão. Aprovado, ele libera para download.'
            : 'Conteúdo que você enviou, esperando a aprovação do chefe.'
        }
        badge={<SampleBadge />}
        actions={
          isBoss && (
            <Button variant="outline">
              <Download />
              Baixar aprovados
            </Button>
          )
        }
      />

      <ul className="space-y-3">
        {approvals.map((item) => (
          <li key={item.id} className="glass rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-gelo">{item.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.type} · enviado por {item.author} · {item.sentAt}
                </p>
              </div>

              {isBoss ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button size="sm" className="bg-emerald-500 text-abismo hover:bg-emerald-400">
                    <Check />
                    Aprovar
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquareWarning />
                    Pedir ajuste
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <X />
                    Rejeitar
                  </Button>
                </div>
              ) : (
                <span className="shrink-0 rounded-full border border-ciano/30 bg-ciano/10 px-2.5 py-0.5 text-xs font-medium text-ciano">
                  Aguardando o chefe
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
