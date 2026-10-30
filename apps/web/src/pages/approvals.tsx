import { contentTypeLabel } from '@firmus/shared'
import { Check, CheckCheck, Download, MessageSquareWarning, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AsyncState } from '@/components/async-state'
import { PageHeader } from '@/components/page-header'
import { formatDate } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { ContentItem } from '@/lib/api-types'

export function ApprovalsPage() {
  const { company } = useAuth()
  const isBoss = company?.role === 'chefe'

  const { data, isPending, error } = useCompanyData<{ items: ContentItem[] }>(
    ['content', 'aguardando'],
    '/content?status=aguardando',
    { items: [] },
  )

  return (
    <>
      <PageHeader
        title="Aprovações"
        description={
          isBoss
            ? 'Conteúdo pronto esperando sua decisão. Aprovado, ele libera para download e agendamento.'
            : 'Conteúdo que você enviou, esperando a aprovação do chefe.'
        }
        actions={
          isBoss && (
            <Button variant="outline">
              <Download />
              Baixar aprovados
            </Button>
          )
        }
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.items.length === 0}
        empty={{
          icon: CheckCheck,
          title: 'Nada esperando aprovação',
          description: isBoss
            ? 'Quando a equipe enviar conteúdo para você revisar, ele aparece aqui.'
            : 'Tudo que você enviou já foi revisado.',
        }}
      >
        <ul className="surface divide-y divide-border overflow-hidden">
          {data.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs text-ardosia">
                  {contentTypeLabel[item.type]} · enviado em {formatDate(item.createdAt)}
                  {item.authorName ? ` por ${item.authorName}` : ''}
                </p>
                <h2 className="mt-1.5 text-sm font-medium text-noite">{item.title}</h2>
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
      </AsyncState>
    </>
  )
}
