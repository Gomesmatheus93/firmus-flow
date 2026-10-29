import { Bot, Send, UserRound } from 'lucide-react'
import { cn } from 'cn'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { conversationStatusLabel, conversations, type ConversationStatus } from '@/mocks/support'

const statusTone: Record<ConversationStatus, string> = {
  ia: 'border-ciano/30 bg-ciano/10 text-ciano',
  humano: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  resolvida: 'border-border bg-muted text-muted-foreground',
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

      <div className="glass grid overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[22rem_1fr]">
        <div className="border-b border-border lg:border-r lg:border-b-0">
          <ul className="divide-y divide-border">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent',
                    conversation.id === active?.id && 'bg-accent',
                  )}
                >
                  <Avatar className="size-9 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-muted text-xs text-muted-foreground">
                      {conversation.initials}
                    </AvatarFallback>
                  </Avatar>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gelo">
                        {conversation.contact}
                      </span>
                      <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                        {conversation.when}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {conversation.lastMessage}
                    </span>
                    <span
                      className={cn(
                        'mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[0.62rem] font-medium',
                        statusTone[conversation.status],
                      )}
                    >
                      {conversationStatusLabel[conversation.status]}
                    </span>
                  </span>

                  {conversation.unread > 0 && (
                    <span className="tabular grid size-5 shrink-0 place-items-center rounded-full bg-ciano text-[0.65rem] font-semibold text-abismo">
                      {conversation.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-[32rem] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-gelo">{active?.contact}</p>
              <p className="tabular text-xs text-muted-foreground">{active?.phone}</p>
            </div>
            <Button variant="outline" size="sm">
              <Bot />
              Religar a IA
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {thread.map((message) => (
              <div
                key={message.id}
                className={cn('flex gap-2.5', message.from === 'ia' && 'flex-row-reverse')}
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-muted">
                  {message.from === 'ia' ? (
                    <Bot className="size-3.5 text-ciano" />
                  ) : (
                    <UserRound className="size-3.5 text-muted-foreground" />
                  )}
                </span>
                <p
                  className={cn(
                    'max-w-md rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
                    message.from === 'ia' ? 'bg-firme/20 text-gelo' : 'bg-muted text-foreground',
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
              placeholder="Responder como equipe..."
              className="h-10 flex-1 rounded-lg border border-border bg-muted px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ciano/50 focus-visible:ring-[3px] focus-visible:ring-ciano/20"
            />
            <Button size="icon" aria-label="Enviar">
              <Send />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
