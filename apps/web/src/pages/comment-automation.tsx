import { commentTriggerLabel, type CommentTrigger } from '@firmus/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquareReply, Plus, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { AsyncState } from '@/components/async-state'
import { MetaPending } from '@/components/meta-pending'
import { PageHeader } from '@/components/page-header'
import { Pill } from '@/components/status-badge'
import { Panel } from '@/components/surface'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { CommentEvent, CommentRule } from '@/lib/api-types'

type RulesResponse = { rules: CommentRule[]; events: CommentEvent[] }

function NewRuleDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [trigger, setTrigger] = useState<CommentTrigger>('palavra')

  const create = useMutation({
    mutationFn: (body: unknown) => api.post('/comment-rules', body),
    onSuccess: async () => {
      toast.success('Regra criada.')
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['comment-rules'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    create.mutate({
      name: String(form.get('nome')),
      triggerType: trigger,
      keywords:
        trigger === 'qualquer'
          ? []
          : String(form.get('palavras'))
              .split(',')
              .map((word) => word.trim())
              .filter(Boolean),
      replyTemplate: String(form.get('resposta')),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nova regra
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova regra de resposta</DialogTitle>
          <DialogDescription>
            Quando um comentário bater com o gatilho, a plataforma responde com este texto em nome
            da marca.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome da regra</Label>
            <Input id="nome" name="nome" required placeholder="Pedido de preço" />
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium text-noite">Quando responder</legend>
            {(['palavra', 'qualquer'] as const).map((option) => (
              <label key={option} className="flex items-center gap-2.5 text-sm text-grafite">
                <input
                  type="radio"
                  name="gatilho"
                  value={option}
                  checked={trigger === option}
                  onChange={() => setTrigger(option)}
                  className="accent-azul"
                />
                {commentTriggerLabel[option]}
              </label>
            ))}
          </fieldset>

          {trigger === 'palavra' && (
            <div className="grid gap-2">
              <Label htmlFor="palavras">Palavras</Label>
              <Input id="palavras" name="palavras" required placeholder="preço, valor, quanto" />
              <p className="text-xs text-ardosia">Separe por vírgula.</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="resposta">Resposta</Label>
            <Textarea
              id="resposta"
              name="resposta"
              required
              rows={3}
              placeholder="Oi! Acabei de te chamar no direct com os valores."
            />
          </div>

          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Criando...' : 'Criar regra'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CommentAutomationPage() {
  const { company, mode } = useAuth()
  const queryClient = useQueryClient()
  const isBoss = company?.role === 'chefe'
  const canEdit = isBoss && mode !== 'demo'

  const { data, isPending, error } = useCompanyData<RulesResponse>(
    ['comment-rules'],
    '/comment-rules',
    { rules: [], events: [] },
  )

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/comment-rules/${id}`, { active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comment-rules'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/comment-rules/${id}`),
    onSuccess: async () => {
      toast.success('Regra removida.')
      await queryClient.invalidateQueries({ queryKey: ['comment-rules'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <>
      <PageHeader
        title="Automação de comentários"
        description="Respostas automáticas aos comentários do Instagram, escritas por você."
        actions={canEdit ? <NewRuleDialog /> : undefined}
      />

      <MetaPending
        permission="instagram_manage_comments"
        what="Responder os comentários automaticamente"
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.rules.length === 0}
        empty={{
          icon: MessageSquareReply,
          title: 'Nenhuma regra criada',
          description:
            mode === 'demo'
              ? 'Configure o Supabase no .env para criar e guardar as suas regras de resposta.'
              : canEdit
                ? 'Crie uma regra dizendo o que responder quando alguém comentar. Ela já fica guardada e entra em vigor quando a Meta liberar.'
                : 'Só o chefe pode criar regras de resposta automática.',
        }}
      >
        <ul className="space-y-3">
          {data.rules.map((rule) => (
            <li key={rule.id}>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-sm font-semibold text-noite">{rule.name}</h2>
                      <Pill tone={rule.active ? 'verde' : 'neutro'}>
                        {rule.active ? 'Ativa' : 'Pausada'}
                      </Pill>
                    </div>
                    <p className="mt-1.5 text-xs text-ardosia">
                      {commentTriggerLabel[rule.triggerType]}
                      {rule.keywords.length > 0 && `: ${rule.keywords.join(', ')}`}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggle.mutate({ id: rule.id, active: !rule.active })}
                      >
                        {rule.active ? 'Pausar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover ${rule.name}`}
                        onClick={() => remove.mutate(rule.id)}
                        className="text-ardosia hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="mt-4 rounded-xl bg-white/55 px-3.5 py-3 text-sm leading-relaxed text-grafite">
                  {rule.replyTemplate}
                </p>
              </Panel>
            </li>
          ))}
        </ul>
      </AsyncState>

      {data.events.length > 0 && (
        <Panel>
          <h2 className="text-base font-semibold text-noite">Respostas enviadas</h2>
          <ul className="mt-4 divide-y divide-border">
            {data.events.map((event) => (
              <li key={event.id} className="flex items-baseline gap-4 py-3">
                <span className="min-w-0 flex-1 text-sm text-grafite">{event.repliedText}</span>
                <span className="shrink-0 text-xs text-ardosia">
                  {formatDateTime(event.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}
