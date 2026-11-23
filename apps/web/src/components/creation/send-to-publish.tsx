import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, Send } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { ContentItem, ScheduledPost } from '@/lib/api-types'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'

/**
 * "Enviar para postar": manda a peça aprovada para o Programador, onde se
 * escolhe postar agora ou agendar. Só o chefe envia, e só peça aprovada.
 * Peça que já está na fila vira um atalho para lá.
 */
export function SendToPublish({ item }: { item: ContentItem }) {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data } = useCompanyData<{ posts: ScheduledPost[] }>(
    ['scheduled-posts'],
    '/scheduled-posts',
    { posts: [] },
  )
  const naFila = data.posts.find(
    (p) => p.contentItemId === item.id && (p.status === 'rascunho' || p.status === 'agendado'),
  )

  const enviar = useMutation({
    mutationFn: () =>
      api.post<{ alreadyQueued: boolean }>('/scheduled-posts', { contentItemId: item.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
      toast.success('Peça enviada para o Programador.', {
        action: { label: 'Abrir', onClick: () => void navigate('/programador') },
      })
    },
    onError: (erro: Error) => toast.error(erro.message),
  })

  if (item.type === 'reel' || company?.role !== 'chefe') return null

  if (naFila) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/programador">
          <CalendarCheck />
          {naFila.status === 'agendado' ? 'Agendada no Programador' : 'No Programador'}
        </Link>
      </Button>
    )
  }

  // Botão desabilitado não mostra dica ao passar o mouse: melhor dizer o porquê.
  if (item.status !== 'aprovado') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ardosia">
        <Send className="size-3.5" />
        Aprove a peça para enviar ao Programador
      </span>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={() => enviar.mutate()} disabled={enviar.isPending}>
      <Send />
      {enviar.isPending ? 'Enviando…' : 'Enviar para postar'}
    </Button>
  )
}
