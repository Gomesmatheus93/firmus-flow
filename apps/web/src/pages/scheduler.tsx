import { scheduledPostStatusLabel, type ScheduledPostStatus } from '@firmus/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, MessageSquareReply, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { cn } from 'cn'
import { AsyncState } from '@/components/async-state'
import { FormatBadge } from '@/components/format-badge'
import { MetaPending } from '@/components/meta-pending'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/surface'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import type { ScheduledPost } from '@/lib/api-types'
import { formatDateTime } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'

const statusTone: Record<ScheduledPostStatus, string> = {
  rascunho: 'bg-amber-500',
  agendado: 'bg-azul',
  publicado: 'bg-emerald-500',
  falhou: 'bg-destructive',
  cancelado: 'bg-ardosia',
}

/** ISO para o valor do campo de data e hora, no horário de quem está usando. */
function paraCampo(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`
}

/** "@ana, @loja.parceira" vira ["ana", "loja.parceira"]. */
const lerArrobas = (texto: string) =>
  texto
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)

/** Liga e desliga, do tamanho do print. */
function Chave({
  ligada,
  onChange,
  rotulo,
}: {
  ligada: boolean
  onChange: (v: boolean) => void
  rotulo: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      onClick={() => onChange(!ligada)}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition-colors',
        ligada ? 'bg-azul' : 'bg-regua',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform',
          ligada && 'translate-x-4',
        )}
      />
    </button>
  )
}

/**
 * O quadro "Publicar no Instagram" de uma peça da fila: colaboradores,
 * automação de comentários, data e hora, e os botões Agendar e Postar agora.
 */
function PublishBox({ post }: { post: ScheduledPost }) {
  const queryClient = useQueryClient()
  const story = post.contentType === 'story'

  const [colabs, setColabs] = useState(post.collaborators.map((c) => `@${c}`).join(', '))
  const [automacao, setAutomacao] = useState(post.commentAutomation)
  const [quando, setQuando] = useState(paraCampo(post.scheduledFor))

  const publicar = useMutation({
    mutationFn: (acao: 'agendar' | 'agora') =>
      api.put(`/scheduled-posts/${post.id}`, {
        acao,
        collaborators: story ? [] : lerArrobas(colabs),
        commentAutomation: story ? false : automacao,
        ...(acao === 'agendar' ? { scheduledFor: new Date(quando).toISOString() } : {}),
      }),
    onSuccess: async (_r, acao) => {
      await queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
      toast.success(
        acao === 'agora'
          ? 'Na fila para agora. A publicação automática começa quando a Meta liberar o app; até lá, baixe as artes e publique pelo Meta Business Suite.'
          : 'Agendada. Ela entra no ar na hora marcada quando a Meta liberar o app.',
      )
    },
    onError: (erro: Error) => toast.error(erro.message),
  })

  return (
    <div className="space-y-2.5 rounded-2xl border border-regua bg-gelo/60 p-3.5">
      <p className="text-sm font-semibold text-noite">Publicar no Instagram</p>

      {!story && (
        <>
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-ardosia">
              <Users className="size-3.5" />
              Colaboradores (collab) · opcional
            </span>
            <Input
              value={colabs}
              onChange={(e) => setColabs(e.target.value)}
              placeholder="@conta, @outraconta"
              className="mt-1.5 bg-white"
            />
          </label>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-regua bg-white px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-grafite">
              <MessageSquareReply className="size-4 text-azul" />
              Automação de comentários quando publicar
            </span>
            <Chave
              ligada={automacao}
              onChange={setAutomacao}
              rotulo="Automação de comentários quando publicar"
            />
          </div>
        </>
      )}
      {story && (
        <p className="text-xs text-ardosia">
          Story não tem colaboradores nem comentários: as respostas chegam pelo direct.
        </p>
      )}

      <Input
        type="datetime-local"
        value={quando}
        onChange={(e) => setQuando(e.target.value)}
        aria-label="Data e hora da postagem"
        className="bg-white"
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="rounded-full bg-white"
          disabled={!quando || publicar.isPending}
          onClick={() => publicar.mutate('agendar')}
        >
          Agendar
        </Button>
        <Button
          className="rounded-full"
          disabled={publicar.isPending}
          onClick={() => publicar.mutate('agora')}
        >
          Postar agora
        </Button>
      </div>
    </div>
  )
}

/** Uma peça da fila: a capa, o que ela é e em que pé está. */
function QueueItem({ post, isBoss }: { post: ScheduledPost; isBoss: boolean }) {
  const queryClient = useQueryClient()
  const naFila = post.status === 'rascunho' || post.status === 'agendado'

  const tirar = useMutation({
    mutationFn: () => api.delete(`/scheduled-posts/${post.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
      toast.success('Tirada da fila. A peça continua na Criação.')
    },
    onError: (erro: Error) => toast.error(erro.message),
  })

  return (
    <Panel className="grid gap-4 md:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 gap-4">
        <Link
          to={`/criar/${post.contentType}`}
          className="w-28 shrink-0 self-start overflow-hidden rounded-xl border border-regua bg-gelo"
          aria-label={`Abrir a peça ${post.contentTitle}`}
        >
          {post.coverUrl ? (
            <img
              src={post.coverUrl}
              alt=""
              className="aspect-[4/5] w-full object-cover object-top"
            />
          ) : (
            <span className="block aspect-[4/5]" />
          )}
        </Link>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <FormatBadge format={post.contentType} />
            {post.slideCount > 1 && (
              <span className="text-xs text-ardosia">
                {post.slideCount} {post.contentType === 'story' ? 'quadros' : 'slides'}
              </span>
            )}
          </div>
          <h3 className="text-base leading-snug font-semibold text-noite">{post.contentTitle}</h3>
          <p className="flex items-center gap-1.5 text-sm text-grafite">
            <span className={cn('size-2 shrink-0 rounded-full', statusTone[post.status])} />
            {post.status === 'rascunho'
              ? 'Na fila, sem data'
              : `${scheduledPostStatusLabel[post.status]}${post.scheduledFor ? ` · ${formatDateTime(post.scheduledFor)}` : ''}`}
          </p>
          {post.collaborators.length > 0 && (
            <p className="text-xs text-ardosia">
              Com {post.collaborators.map((c) => `@${c}`).join(', ')}
            </p>
          )}
          {post.commentAutomation && (
            <p className="text-xs text-ardosia">Automação de comentários ligada</p>
          )}
          {post.errorMessage && <p className="text-xs text-destructive">{post.errorMessage}</p>}

          {isBoss && naFila && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-ardosia hover:text-destructive"
              onClick={() => tirar.mutate()}
              disabled={tirar.isPending}
            >
              <Trash2 />
              Tirar da fila
            </Button>
          )}
        </div>
      </div>

      {isBoss && naFila && <PublishBox post={post} />}
    </Panel>
  )
}

export function SchedulerPage() {
  const { company } = useAuth()
  const isBoss = company?.role === 'chefe'

  const { data, isPending, error } = useCompanyData<{ posts: ScheduledPost[] }>(
    ['scheduled-posts'],
    '/scheduled-posts',
    { posts: [] },
  )

  return (
    <>
      <PageHeader
        title="Programador de postagem"
        description="A fila do que vai ao Instagram. Envie a peça aprovada pela Criação ('Enviar para postar') e escolha aqui se posta agora ou agenda."
      />

      <MetaPending
        permission="instagram_content_publish"
        what="Publicar no Instagram na hora marcada"
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.posts.length === 0}
        empty={{
          icon: CalendarClock,
          title: 'Nada na fila',
          description:
            'Abra uma peça aprovada em Criação e use "Enviar para postar". Ela aparece aqui para você postar agora ou agendar.',
        }}
      >
        <div className="space-y-4">
          {data.posts.map((post) => (
            <QueueItem key={post.id} post={post} isBoss={isBoss} />
          ))}
        </div>
      </AsyncState>
    </>
  )
}
