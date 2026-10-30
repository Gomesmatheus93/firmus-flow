import { conversationStatusLabel, type ConversationStatus } from '@firmus/shared'
import { MessagesSquare } from 'lucide-react'
import { cn } from 'cn'
import { AsyncState } from '@/components/async-state'
import { PageHeader } from '@/components/page-header'
import { formatDateTime } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import type { ConversationRow } from '@/lib/api-types'

const statusTone: Record<ConversationStatus, string> = {
  ia: 'bg-azul',
  humano: 'bg-amber-500',
  resolvida: 'bg-ardosia',
}

export function ConversationsPage() {
  const { data, isPending, error } = useCompanyData<{ conversations: ConversationRow[] }>(
    ['conversations'],
    '/conversations',
    { conversations: [] },
  )

  return (
    <>
      <PageHeader
        title="Conversas"
        description="Atendimentos no WhatsApp. A IA responde sozinha e passa para a equipe quando precisa."
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.conversations.length === 0}
        empty={{
          icon: MessagesSquare,
          title: 'Nenhuma conversa ainda',
          description:
            'Conecte o número da empresa à WhatsApp Cloud API em Configurações. A partir daí, cada mensagem recebida abre uma conversa aqui.',
        }}
      >
        <ul className="surface divide-y divide-border overflow-hidden">
          {data.conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-white/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-noite">
                      {conversation.contactName ?? conversation.contactPhone}
                    </span>
                    {conversation.lastMessageAt && (
                      <span className="shrink-0 text-xs text-ardosia">
                        {formatDateTime(conversation.lastMessageAt)}
                      </span>
                    )}
                  </span>
                  <span className="tabular mt-0.5 block text-xs text-ardosia">
                    {conversation.contactPhone}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-grafite">
                    <span
                      aria-hidden
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        statusTone[conversation.status],
                      )}
                    />
                    {conversationStatusLabel[conversation.status]}
                  </span>
                </span>

                {conversation.unreadCount > 0 && (
                  <span className="tabular grid size-5 shrink-0 place-items-center rounded-full bg-azul text-[0.65rem] font-semibold text-white">
                    {conversation.unreadCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </AsyncState>
    </>
  )
}
