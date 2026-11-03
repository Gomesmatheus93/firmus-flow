import { contentTypeLabel, type ContentType } from '@firmus/shared'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'
import { AsyncState } from '@/components/async-state'
import { PendingAction } from '@/components/pending-action'
import { PageHeader } from '@/components/page-header'
import { SlideStrip } from '@/components/slide-strip'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import type { ContentItem } from '@/lib/api-types'
import { useParams } from 'react-router'

const filters: ({ value: 'todos' } | { value: ContentType })[] = [
  { value: 'todos' },
  { value: 'carrossel' },
  { value: 'post' },
  { value: 'story' },
  { value: 'reel' },
]

const filterLabel = (value: 'todos' | ContentType) =>
  value === 'todos' ? 'Tudo' : contentTypeLabel[value]

export function CreationPage() {
  const { tipo } = useParams()

  const { data, isPending, error } = useCompanyData<{ items: ContentItem[] }>(
    ['content'],
    '/content',
    { items: [] },
  )

  const items = data.items.filter((i) => i.type === tipo)

  return (
    <>
      <PageHeader
        title="Criação"
        description="Carrossel, post único, story e roteiro de reel. Tudo escrito a partir do Cérebro da Marca e revisado pelo humanizador antes de salvar."
        actions={
          <PendingAction
            icon={Sparkles}
            label="Criar conteúdo"
            waitingFor="espera o agente de conteúdo"
          />
        }
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por formato">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === option.value
                ? 'bg-noite text-white'
                : 'glass text-grafite hover:bg-white/80',
            )}
          >
            {filterLabel(option.value)}
          </button>
        ))}
      </div>

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={items.length === 0}
        empty={{
          icon: Sparkles,
          title: 'Nada criado ainda',
          description:
            'Quando o agente de conteúdo gerar carrosséis, posts, stories ou roteiros, eles aparecem aqui para revisão.',
        }}
      >
        <ul className="surface divide-y divide-border overflow-hidden">
          {items.map((item) => (
            <li key={item.id} className="p-5 transition-colors hover:bg-white/45">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-ardosia">
                    {contentTypeLabel[item.type]} · {formatDate(item.createdAt)}
                    {item.authorName ? ` · ${item.authorName}` : ''}
                  </p>
                  <h2 className="mt-1.5 text-sm font-medium text-noite">{item.title}</h2>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <SlideStrip title={item.title} images={item.images} />

              {item.caption && (
                <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-relaxed text-ardosia">
                  {item.caption}
                </p>
              )}

              {item.reviewNote && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Pedido de ajuste: {item.reviewNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      </AsyncState>
    </>
  )
}
