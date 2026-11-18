import type { Role } from '@firmus/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, MailPlus, Trash2, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
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
import { AsyncState } from '@/components/async-state'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/dates'
import { roleLabel } from '@/lib/demo-session'
import { initialsFrom } from '@/lib/names'
import { useCompanyData } from '@/lib/queries'
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
            <p className="text-sm text-grafite">Convite criado. Envie este link para a pessoa:</p>
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
            <p className="text-xs text-ardosia">O link vale por 7 dias.</p>
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

  const { data, isPending, error } = useCompanyData<TeamResponse>(['team'], '/team', {
    members: [],
    pendingInvites: [],
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

  return (
    <>
      <PageHeader
        title="Equipe"
        description="Quem tem acesso à plataforma desta empresa. Só o chefe pode convidar e remover."
        actions={isDemo ? undefined : <InviteDialog />}
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.members.length === 0}
        empty={{
          icon: Users,
          title: 'Equipe vazia',
          description: isDemo
            ? 'Configure o Supabase no .env para criar sua conta e convidar sua equipe.'
            : 'Convide alguém para gerar conteúdo e assumir conversas junto com você.',
        }}
      >
        <ul className="surface divide-y divide-border overflow-hidden">
          {data.members.map((member) => (
            <li key={member.membershipId} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-gelo text-[0.7rem] font-semibold text-ardosia">
                {initialsFrom(member.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-noite">{member.name}</p>
                <p className="truncate text-xs text-ardosia">{member.email}</p>
              </div>

              <span className="hidden text-xs text-ardosia sm:block">
                entrou em {formatDate(member.joinedAt)}
              </span>

              <span
                className={
                  member.role === 'chefe'
                    ? 'rounded-full bg-azul/10 px-2.5 py-1 text-xs font-medium text-azul'
                    : 'rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-ardosia'
                }
              >
                {roleLabel[member.role]}
              </span>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover ${member.name}`}
                disabled={member.role === 'chefe' || member.userId === user?.id}
                onClick={() => removeMember.mutate(member.membershipId)}
                className="text-ardosia hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </AsyncState>

      {data.pendingInvites.length > 0 && (
        <section>
          <SectionHeading>Convites pendentes</SectionHeading>
          <ul className="surface mt-4 divide-y divide-border overflow-hidden">
            {data.pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-noite">{invite.email}</p>
                  <p className="text-xs text-ardosia">
                    como {roleLabel[invite.role].toLowerCase()} · enviado em{' '}
                    {formatDate(invite.sentAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
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
