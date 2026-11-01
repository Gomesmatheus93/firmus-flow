import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Botão que ainda não tem o que fazer, dizendo o que está esperando.
 *
 * A plataforma foi construída de fora para dentro: a casca primeiro, e o que
 * fica atrás de cada botão vem uma tarefa por vez. Enquanto isso, um botão que
 * aceita o clique e não responde deixa quem usa achando que quebrou.
 *
 * É a mesma regra que o CLAUDE.md já manda para os dados — estado vazio
 * honesto, nunca exemplo — aplicada aos controles.
 */
export function PendingAction({
  icon: Icon,
  label,
  waitingFor,
  variant = 'default',
}: {
  icon: LucideIcon
  label: string
  /** O que falta, em uma frase: "o agente de conteúdo ainda não existe". */
  waitingFor: string
  variant?: 'default' | 'outline'
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
      <Button variant={variant} disabled title={waitingFor}>
        <Icon />
        {label}
      </Button>
      <span className="text-xs text-ardosia">{waitingFor}</span>
    </div>
  )
}
