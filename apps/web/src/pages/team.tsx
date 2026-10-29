import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Copy, MailPlus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Role } from '@firmus/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { api } from '@/lib/api'
import { initialsFrom } from '@/lib/names'
import { roleLabel } from '@/mocks/session'
import { members as demoMembers, pendingInvites as demoInvites } from '@/mocks/team'
import { useAuth } from '@/providers/auth-provider'

type Member = {
  membershipId: string
  userId: string
  name: string
  email: string
  role: Role
  joinedAt: string
}

type PendingInvite = {
  id: string
  email: string
  role: Role
  sentAt: string
}

type TeamResponse = { members: Member[]; pendingInvites: PendingInvite[] }

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

const formatDate = (value: string) => dateFormat.format(new Date(value))

function InviteDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const invite = useMutation({
    mutationFn: (email: string) => api.post<{ inviteUrl: string }>('/team/invitations', { email }),
    onSuccess: async (data) => {
      setInviteUrl(data.inviteUrl)
      await queryClient.invalidateQueries({ queryKey: ['team'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    invite.mutate(String(new FormData(event.currentTarget).get('email')))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setInviteUrl(null)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <MailPlus />
          Convidar funcionário
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar funcionário</DialogTitle>
          <DialogDescription>
            Ele entra como funcionário: gera conteúdo e assume conversas, mas não aprova nem altera
            a marca.
          </DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="grid gap-3">
            <p className="text-sm text-foreground">
              Convite criado. Envie este link para a pessoa:
            </p>
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl} className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                aria-label="Copiar link"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrl)
                  toast.success('Link copiado.')
                }}
              >
                <Copy />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">O link vale por 7 dias.</p>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="pessoa@empresa.com.br"
              />
            </div>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? 'Criando...' : 'Criar convite'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function TeamPage() {
  const { mode, user } = useAuth()
  const queryClient = useQueryClient()
  const isDemo = mode === 'demo'

  const team = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<TeamResponse>('/team'),
    enabled: !isDemo,
  })

  const removeMember = useMutation({
    mutationFn: (membershipId: string) => api.delete(`/team/members/${membershipId}`),
    onSuccess: async () => {
      toast.success('Pessoa removida da equipe.')
      await queryClient.invalidateQueries({ queryKey: ['team'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const cancelInvite = useMutation({
    mutationFn: (id: string) => api.delete(`/team/invitations/${id}`),
    onSuccess: async () => {
      toast.success('Convite cancelado.')
      await queryClient.invalidateQueries({ queryKey: ['team'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const members: Member[] = isDemo
    ? demoMembers.map((member) => ({
        membershipId: member.id,
        userId: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        joinedAt: member.joinedAt,
      }))
    : (team.data?.members ?? [])

  const invites: PendingInvite[] = isDemo
    ? demoInvites.map((item) => ({
        id: item.id,
        email: item.email,
        role: item.role,
        sentAt: item.sentAt,
      }))
    : (team.data?.pendingInvites ?? [])

  return (
    <>
      <PageHeader
        title="Equipe"
        description="Quem tem acesso à plataforma desta empresa. Só o chefe pode convidar e remover."
        badge={isDemo ? <SampleBadge /> : undefined}
        actions={isDemo ? undefined : <InviteDialog />}
      />

      {team.isError && (
        <p className="text-sm text-destructive">
          {team.error instanceof Error ? team.error.message : 'Não foi possível carregar a equipe.'}
        </p>
      )}

      <section className="glass overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li key={member.membershipId} className="flex items-center gap-4 px-5 py-4">
              <Avatar className="size-10 rounded-lg">
                <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {initialsFrom(member.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gelo">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>

              <span className="hidden text-xs text-muted-foreground sm:block">
                entrou em {isDemo ? member.joinedAt : formatDate(member.joinedAt)}
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
                disabled={isDemo || member.role === 'chefe' || member.userId === user?.id}
                onClick={() => removeMember.mutate(member.membershipId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {invites.length > 0 && (
        <section>
          <h2 className="text-base font-medium text-gelo">Convites pendentes</h2>
          <ul className="mt-3 space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="glass flex items-center gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-3.5"
              >
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gelo">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    como {roleLabel[invite.role].toLowerCase()} · enviado em{' '}
                    {isDemo ? invite.sentAt : formatDate(invite.sentAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDemo}
                  onClick={() => cancelInvite.mutate(invite.id)}
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
