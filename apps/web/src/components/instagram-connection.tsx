import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AtSign, Check, Link2Off, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Panel } from '@/components/surface'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/dates'

type Conexao = {
  username: string
  igAccountId: string
  connectedAt: string
  lastVerifiedAt: string | null
} | null

type Conta = { username: string; followersCount: number; name: string | null }

/**
 * A ligação da empresa com o Instagram dela.
 *
 * O token é colado aqui, provado na Meta e guardado cifrado no servidor. Ele
 * nunca volta para cá — a tela mostra o @ e os seguidores, nunca a credencial.
 */
export function InstagramConnection() {
  const queryClient = useQueryClient()
  const [recemConectada, setRecemConectada] = useState<Conta | null>(null)
  /** Erro da Meta fica fixo na tela: token recusado é coisa de ler com calma. */
  const [erro, setErro] = useState<string | null>(null)

  const { data, isPending } = useQuery({
    queryKey: ['instagram', 'connection'],
    queryFn: () => api.get<{ connection: Conexao }>('/instagram/connection'),
  })

  const conectar = useMutation({
    mutationFn: (entrada: { accessToken: string; igAccountId?: string }) =>
      api.post<{ account: Conta }>('/instagram/connection', entrada),
    onSuccess: async (resultado) => {
      setErro(null)
      setRecemConectada(resultado.account)
      await queryClient.invalidateQueries({ queryKey: ['instagram'] })
      toast.success(`Conectado como @${resultado.account.username}.`)
    },
    onError: (e: Error) => setErro(e.message),
  })

  const desconectar = useMutation({
    mutationFn: () => api.delete('/instagram/connection'),
    onSuccess: async () => {
      setRecemConectada(null)
      setErro(null)
      await queryClient.invalidateQueries({ queryKey: ['instagram'] })
      toast.success('Instagram desconectado.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const campos = new FormData(event.currentTarget)

    const accessToken = String(campos.get('accessToken') ?? '').trim()
    const igAccountId = String(campos.get('igAccountId') ?? '').trim()

    if (accessToken) conectar.mutate({ accessToken, igAccountId: igAccountId || undefined })
  }

  if (isPending) {
    return (
      <Panel>
        <p className="text-sm text-ardosia">Carregando…</p>
      </Panel>
    )
  }

  const conexao = data?.connection

  if (conexao) {
    return (
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-noite">
              <Check className="size-4 shrink-0 text-emerald-600" />
              Conectado
            </p>

            <a
              href={`https://instagram.com/${conexao.username}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-azul hover:underline"
            >
              <AtSign className="size-4" />
              {conexao.username}
            </a>

            {recemConectada && (
              <p className="tabular mt-2 text-sm text-ardosia">
                {recemConectada.followersCount.toLocaleString('pt-BR')} seguidores
              </p>
            )}

            <p className="mt-3 text-xs text-ardosia">
              ligado em {formatDate(conexao.connectedAt)}
            </p>
          </div>

          <Button
            variant="outline"
            disabled={desconectar.isPending}
            onClick={() => desconectar.mutate()}
          >
            <Link2Off />
            Desconectar
          </Button>
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <form onSubmit={handleSubmit}>
        <div className="grid max-w-xl gap-2">
          <Label htmlFor="accessToken">Token de acesso do Instagram</Label>
          <Input
            id="accessToken"
            name="accessToken"
            type="password"
            autoComplete="off"
            placeholder="EAAB…"
            disabled={conectar.isPending}
          />
        </div>

        <p className="mt-3 max-w-xl text-xs leading-relaxed text-ardosia">
          O token sai do Gerenciador de Negócios da Meta, em Usuários do sistema → Gerar novo
          token, com a conta profissional do Instagram atribuída. Ele é guardado cifrado e nunca
          volta para esta tela.
        </p>

        <div className="mt-6 grid max-w-xl gap-2">
          <Label htmlFor="igAccountId">
            ID da conta do Instagram{' '}
            <span className="font-normal text-ardosia">(opcional)</span>
          </Label>
          <Input
            id="igAccountId"
            name="igAccountId"
            inputMode="numeric"
            autoComplete="off"
            placeholder="17841400000000000"
            disabled={conectar.isPending}
          />
          <p className="text-xs leading-relaxed text-ardosia">
            Deixe em branco que a plataforma tenta descobrir sozinha. Se ela não conseguir, o
            número aparece no Gerenciador de Negócios, em Contas do Instagram, logo abaixo do @
            do perfil.
          </p>
        </div>

        {erro && (
          <div className="mt-5 flex max-w-xl items-start gap-3 rounded-lg bg-amber-50 p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="min-w-0 text-sm leading-relaxed text-grafite">
              <p className="font-semibold text-noite">A Meta recusou esse token.</p>
              <p className="mt-1 break-words">{erro}</p>
            </div>
          </div>
        )}

        <Button type="submit" className="mt-6" disabled={conectar.isPending}>
          {conectar.isPending ? 'Conferindo com a Meta…' : 'Conectar'}
        </Button>
      </form>
    </Panel>
  )
}
