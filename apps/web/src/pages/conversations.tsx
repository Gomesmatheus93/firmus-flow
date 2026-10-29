import { Bot, Send, UserRound } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { conversationStatusLabel, conversations, type ConversationStatus } from '@/mocks/support'

const statusTone: Record<ConversationStatus, string> = {
  ia: 'bg-azul',
  humano: 'bg-amber-500',
  resolvida: 'bg-ardosia',
}

const thread = [
  { id: 't1', from: 'contact' as const, text: 'Oi! Vocês fazem limpeza de pele profunda?' },
  {
    id: 't2',
    from: 'ia' as const,
    text: 'Oi, Juliana! Fazemos sim. A limpeza profunda leva cerca de 50 minutos e inclui extração e máscara calmante. Você já fez alguma vez?',
  },
  { id: 't3', from: 'contact' as const, text: 'Nunca fiz. Vocês parcelam o protocolo completo?' },
  {
    id: 't4',
    from: 'ia' as const,
    text: 'Parcelamos em até 6x no cartão. Sobre o valor do protocolo fechado, vou chamar alguém da equipe para te explicar direitinho, tudo bem?',
  },
]

export function ConversationsPage() {
  const active = conversations[0]

  return (
    <>
      <PageHeader
        title="Conversas"
        description="Atendimentos no WhatsApp. A IA responde sozinha e passa para a equipe quando precisa."
        badge={<SampleBadge />}
      />

      <div className="grid surface overflow-hidden lg:grid-cols-[21rem_1fr]">
        <div className="border-b border-border lg:border-r lg:border-b-0">
          <ul className="divide-y divide-border">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted',
                    conversation.id === active?.id && 'bg-muted',
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-[0.7rem] font-semibold text-ardosia">
                    {conversation.initials}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-noite">
                        {conversation.contact}
                      </span>
                      <span className="shrink-0 text-[0.68rem] text-ardosia">
                        {conversation.when}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ardosia">
                      {conversation.lastMessage}
                    </span>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 text-[0.65rem] text-grafite">
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

                  {conversation.unread > 0 && (
                    <span className="tabular grid size-5 shrink-0 place-items-center rounded-full bg-azul text-[0.65rem] font-semibold text-white">
                      {conversation.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-[30rem] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-noite">{active?.contact}</p>
              <p className="tabular text-xs text-ardosia">{active?.phone}</p>
            </div>
            <Button variant="outline" size="sm">
              <Bot />
              Religar a IA
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-background p-5">
            {thread.map((message) => (
              <div
                key={message.id}
                className={cn('flex gap-2.5', message.from === 'ia' && 'flex-row-reverse')}
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-card">
                  {message.from === 'ia' ? (
                    <Bot className="size-3 text-azul" />
                  ) : (
                    <UserRound className="size-3 text-ardosia" />
                  )}
                </span>
                <p
                  className={cn(
                    'max-w-md rounded-lg px-3.5 py-2.5 text-sm leading-relaxed',
                    message.from === 'ia' ? 'bg-azul text-white' : 'bg-muted text-grafite',
                  )}
                >
                  {message.text}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              type="text"
              placeholder="Responder como equipe"
              aria-label="Responder como equipe"
              className="h-9 flex-1 rounded-md border border-input bg-background px-3.5 text-sm text-foreground outline-none placeholder:text-ardosia focus-visible:border-azul focus-visible:ring-[3px] focus-visible:ring-azul/20"
            />
            <Button size="icon-sm" aria-label="Enviar">
              <Send />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
