import { Check, Download, MessageSquareWarning, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { approvals } from '@/mocks/content'
import { useAuth } from '@/providers/auth-provider'

export function ApprovalsPage() {
  const { company } = useAuth()
  const isBoss = company?.role === 'chefe'

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

      <ul className="surface divide-y divide-border overflow-hidden">
        {approvals.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="min-w-0">
              <p className="text-xs text-ardosia">{item.type}</p>
              <h2 className="mt-1.5 text-sm font-medium text-noite">{item.title}</h2>
              <p className="mt-1 text-xs text-ardosia">
                enviado por {item.author} · {item.sentAt}
              </p>
            </div>

            {isBoss ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="sm">
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
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-grafite">
                <span className="size-1.5 rounded-full bg-azul" />
                Aguardando o chefe
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
