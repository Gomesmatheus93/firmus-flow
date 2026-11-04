import { contentStatusLabel, type ContentStatus } from '@firmus/shared'
import { isTemplateKey, templates } from '@firmus/templates'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'
import { StatusBadge } from '@/components/status-badge'
import type { ContentItem } from '@/lib/api-types'
import { formatDate } from '@/lib/dates'

/** A ordem das abas: o que pede ação primeiro. */
const ORDEM: ContentStatus[] = ['aguardando', 'ajustar', 'aprovado', 'rejeitado', 'rascunho']

/** Nome curto da aba; o rótulo completo fica no selo do cartão. */
const ABA: Record<ContentStatus, string> = {
  aguardando: 'Aguardando',
  ajustar: 'Ajustar',
  aprovado: 'Aprovadas',
  rejeitado: 'Rejeitadas',
  rascunho: 'Rascunhos',
}

const nomeDoModelo = (key: string | null) =>
  key && isTemplateKey(key) ? templates[key].name : null

/** Um cartão: a capa, o título, o modelo e a situação. */
function PieceCard({
  item,
  aspect,
  onOpen,
  onDelete,
}: {
  item: ContentItem
  aspect: string
  onOpen: () => void
  onDelete: () => void
}) {
  const capa = item.images[0]
  const modelo = nomeDoModelo(item.template)

  return (
    <li className="group relative min-w-0 overflow-hidden rounded-xl border border-border bg-white/70 shadow-card transition-colors hover:border-azul/40">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        {capa ? (
          <img
            src={capa}
            alt={`Capa de ${item.title}`}
            loading="lazy"
            className={cn('w-full object-cover', aspect)}
          />
        ) : (
          <span
            className={cn(
              'flex w-full items-end bg-white/60 p-4 text-sm font-medium text-noite',
              aspect,
            )}
          >
            {item.slides[0]?.title ?? item.title}
          </span>
        )}

        <span className="block border-t border-border p-3">
          <span className="line-clamp-2 text-sm leading-snug font-medium text-noite">
            {item.title}
          </span>
          <span className="mt-1 block truncate text-xs text-ardosia">
            {modelo ? `${modelo} · ` : ''}
            {formatDate(item.createdAt)}
          </span>
          <StatusBadge status={item.status} className="mt-2.5" />
        </span>
      </button>

      {/* Sempre visível no toque; no mouse, aparece ao passar por cima. */}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Excluir ${item.title}`}
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg bg-white/90 text-ardosia shadow-card transition-opacity hover:text-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

/**
 * As peças de um formato numa grade de capas, separadas por situação.
 *
 * A aba "Todas" é o padrão. Aba sem peça não aparece: "Rejeitadas (0)" é
 * ruído, não informação.
 */
export function ContentGallery({
  items,
  aspect,
  onOpen,
  onDelete,
}: {
  items: ContentItem[]
  aspect: string
  onOpen: (item: ContentItem) => void
  onDelete: (item: ContentItem) => void
}) {
  const [aba, setAba] = useState<ContentStatus | 'todas'>('todas')

  const contagem = (status: ContentStatus) => items.filter((i) => i.status === status).length
  const abas = ORDEM.filter((s) => contagem(s) > 0)

  // A aba escolhida pode esvaziar depois de uma exclusão: volta para "Todas".
  const atual = aba !== 'todas' && contagem(aba) === 0 ? 'todas' : aba
  const visiveis = atual === 'todas' ? items : items.filter((i) => i.status === atual)

  const estiloAba = (ativa: boolean) =>
    cn(
      'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
      ativa ? 'bg-noite text-white' : 'bg-white/70 text-grafite hover:bg-white',
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Situação">
        <button
          type="button"
          role="tab"
          aria-selected={atual === 'todas'}
          onClick={() => setAba('todas')}
          className={estiloAba(atual === 'todas')}
        >
          Todas <span className="tabular opacity-70">{items.length}</span>
        </button>
        {abas.map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={atual === status}
            onClick={() => setAba(status)}
            title={contentStatusLabel[status]}
            className={estiloAba(atual === status)}
          >
            {ABA[status]} <span className="tabular opacity-70">{contagem(status)}</span>
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visiveis.map((item) => (
          <PieceCard
            key={item.id}
            item={item}
            aspect={aspect}
            onOpen={() => onOpen(item)}
            onDelete={() => onDelete(item)}
          />
        ))}
      </ul>
    </div>
  )
}
