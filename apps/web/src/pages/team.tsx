import { Clock, MailPlus, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { roleLabel } from '@/mocks/session'
import { members, pendingInvites } from '@/mocks/team'

export function TeamPage() {
  return (
    <>
      <PageHeader
        title="Equipe"
        description="Quem tem acesso à plataforma desta empresa. Só o chefe pode convidar e remover."
        badge={<SampleBadge />}
        actions={
          <Button>
            <MailPlus />
            Convidar funcionário
          </Button>
        }
      />

      <section className="glass overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-4 px-5 py-4">
              <Avatar className="size-10 rounded-lg">
                <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {member.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gelo">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>

              <span className="hidden text-xs text-muted-foreground sm:block">
                entrou em {member.joinedAt}
              </span>

              <span
                className={
                  member.role === 'chefe'
                    ? 'rounded-full border border-ciano/30 bg-ciano/10 px-2.5 py-0.5 text-xs font-medium text-ciano'
                    : 'rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'
                }
              >
                {roleLabel[member.role]}
              </span>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover ${member.name}`}
                disabled={member.role === 'chefe'}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {pendingInvites.length > 0 && (
        <section>
          <h2 className="text-base font-medium text-gelo">Convites pendentes</h2>
          <ul className="mt-3 space-y-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="glass flex items-center gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-3.5"
              >
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gelo">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    como {roleLabel[invite.role].toLowerCase()} · enviado em {invite.sentAt}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Reenviar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  Cancelar
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
