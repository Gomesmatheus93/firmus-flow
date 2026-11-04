import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { ContentItem } from '@/lib/api-types'

/**
 * Confirmação antes de excluir uma peça.
 *
 * Excluir apaga as imagens e não tem volta, então o diálogo diz isso com todas
 * as letras — e avisa mais alto quando a peça já foi aprovada, porque aí ela
 * pode estar agendada ou já publicada.
 */
export function DeletePieceDialog({
  item,
  onClose,
  onDeleted,
}: {
  /** A peça a excluir, ou `null` com o diálogo fechado. */
  item: ContentItem | null
  onClose: () => void
  onDeleted?: () => void
}) {
  const queryClient = useQueryClient()

  const excluir = useMutation({
    mutationFn: (id: string) => api.delete(`/content/${id}`),
    onSuccess: async () => {
      // A peça some da galeria e a pauta dela volta a "Criar peça".
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['content'] }),
        queryClient.invalidateQueries({ queryKey: ['plan'] }),
      ])
      toast.success('Peça excluída.')
      onDeleted?.()
      onClose()
    },
    onError: (erro: Error) => toast.error(erro.message),
  })

  const aprovada = item?.status === 'aprovado'

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-base font-semibold text-noite">Excluir esta peça?</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-ardosia">
          <span className="font-medium text-noite">{item?.title}</span> e as imagens dela serão
          apagadas. Isso não dá para desfazer.
        </DialogDescription>

        {aprovada && (
          <p className="flex gap-2.5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-800">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            Esta peça já foi aprovada. Se ela estiver agendada, o agendamento também some. O que já
            foi publicado no Instagram continua lá.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={excluir.isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!item || excluir.isPending}
            onClick={() => item && excluir.mutate(item.id)}
          >
            <Trash2 />
            {excluir.isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
