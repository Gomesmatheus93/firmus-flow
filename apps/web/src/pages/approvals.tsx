import { contentTypeLabel } from '@firmus/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCheck, Download, MessageSquareWarning, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AsyncState } from '@/components/async-state'
import { PageHeader } from '@/components/page-header'
import { PendingAction } from '@/components/pending-action'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { ContentItem } from '@/lib/api-types'

type Decisao = 'aprovado' | 'ajustar' | 'rejeitado'

export function ApprovalsPage() {
  const { company } = useAuth()
  const isBoss = company?.role === 'chefe'
  const queryClient = useQueryClient()

  /** A peça para a qual o chefe está escrevendo o pedido de ajuste. */
  const [ajustando, setAjustando] = useState<ContentItem | null>(null)

  const { data, isPending, error } = useCompanyData<{ items: ContentItem[] }>(
    ['content', 'aguardando'],
    '/content?status=aguardando',
    { items: [] },
  )

  const revisar = useMutation({
    mutationFn: (entrada: { id: string; status: Decisao; reviewNote?: string }) =>
      api.patch(`/content/${entrada.id}/status`, {
        status: entrada.status,
        reviewNote: entrada.reviewNote,
      }),
    onSuccess: async (_resultado, entrada) => {
      setAjustando(null)
      // A peça some desta lista e aparece na de Criação com a situação nova.
      await queryClient.invalidateQueries({ queryKey: ['content'] })
      toast.success(
        entrada.status === 'aprovado'
          ? 'Aprovado.'
          : entrada.status === 'ajustar'
            ? 'Pedido de ajuste enviado.'
            : 'Peça rejeitada.',
      )
    },
    onError: (erro: Error) => toast.error(erro.message),
  })

  function enviarAjuste(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ajustando) return

    const nota = String(new FormData(event.currentTarget).get('reviewNote') ?? '').trim()
    revisar.mutate({ id: ajustando.id, status: 'ajustar', reviewNote: nota })
  }

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
            <PendingAction
              icon={Download}
              label="Baixar aprovados"
              variant="outline"
              waitingFor="espera o agente de design renderizar as imagens"
            />
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
          {data.items.map((item) => {
            const ocupado = revisar.isPending && revisar.variables?.id === item.id

            return (
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
                    <Button
                      size="sm"
                      disabled={ocupado}
                      onClick={() => revisar.mutate({ id: item.id, status: 'aprovado' })}
                    >
                      <Check />
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ocupado}
                      onClick={() => setAjustando(item)}
                    >
                      <MessageSquareWarning />
                      Pedir ajuste
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={ocupado}
                      onClick={() => revisar.mutate({ id: item.id, status: 'rejeitado' })}
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
            )
          })}
        </ul>
      </AsyncState>

      <Dialog open={ajustando !== null} onOpenChange={(aberto) => !aberto && setAjustando(null)}>
        <DialogContent>
          <form onSubmit={enviarAjuste}>
            <DialogHeader>
              <DialogTitle>Pedir ajuste</DialogTitle>
              <DialogDescription>
                Diga o que precisa mudar em “{ajustando?.title}”. Quem escreveu vai ler isto para
                refazer — peça devolvida sem recado não ajuda ninguém.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-2">
              <Label htmlFor="reviewNote">O que mudar</Label>
              <Textarea
                id="reviewNote"
                name="reviewNote"
                required
                minLength={3}
                className="min-h-28"
                placeholder="Ex.: o gancho está fraco, começa pela dor do cliente."
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setAjustando(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={revisar.isPending}>
                {revisar.isPending ? 'Enviando…' : 'Enviar pedido'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
