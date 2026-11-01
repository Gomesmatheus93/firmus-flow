import {
  contentTypeLabel,
  scheduledPostStatusLabel,
  type ScheduledPostStatus,
} from '@firmus/shared'
import { CalendarClock, Plus } from 'lucide-react'
import { cn } from 'cn'
import { AsyncState } from '@/components/async-state'
import { PendingAction } from '@/components/pending-action'
import { DataTable } from '@/components/data-table'
import { MetaPending } from '@/components/meta-pending'
import { PageHeader } from '@/components/page-header'
import { formatDateTime } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import type { ScheduledPost } from '@/lib/api-types'

const statusTone: Record<ScheduledPostStatus, string> = {
  rascunho: 'bg-ardosia',
  agendado: 'bg-azul',
  publicado: 'bg-emerald-500',
  falhou: 'bg-destructive',
  cancelado: 'bg-ardosia',
}

export function SchedulerPage() {
  const { data, isPending, error } = useCompanyData<{ posts: ScheduledPost[] }>(
    ['scheduled-posts'],
    '/scheduled-posts',
    { posts: [] },
  )

  return (
    <>
      <PageHeader
        title="Programador de postagem"
        description="A fila do que vai ao ar, com data e hora."
        actions={
          <PendingAction
            icon={Plus}
            label="Agendar"
            waitingFor="espera a liberação da Meta"
          />
        }
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
          title: 'Nada agendado',
          description:
            'Conteúdo aprovado pode ser colocado na fila com data e hora. Enquanto a Meta não liberar a publicação, a fila serve de lembrete do que publicar.',
        }}
      >
        <DataTable
          caption={`${data.posts.length} na fila`}
          rows={data.posts}
          rowKey={(post) => post.id}
          columns={[
            {
              header: 'Quando',
              className: 'whitespace-nowrap',
              cell: (post) => (
                <span className="text-ardosia">{formatDateTime(post.scheduledFor)}</span>
              ),
            },
            {
              header: 'Conteúdo',
              cell: (post) => <span className="font-medium text-noite">{post.contentTitle}</span>,
            },
            {
              header: 'Formato',
              cell: (post) => contentTypeLabel[post.contentType],
            },
            {
              header: 'Situação',
              cell: (post) => (
                <span className="inline-flex items-center gap-1.5 text-grafite">
                  <span
                    aria-hidden
                    className={cn('size-1.5 shrink-0 rounded-full', statusTone[post.status])}
                  />
                  {scheduledPostStatusLabel[post.status]}
                </span>
              ),
            },
            {
              header: 'Observação',
              cell: (post) => (
                <span className="text-ardosia">
                  {post.errorMessage ??
                    (post.publishedAt ? `publicado ${formatDateTime(post.publishedAt)}` : '—')}
                </span>
              ),
            },
          ]}
        />
      </AsyncState>
    </>
  )
}
