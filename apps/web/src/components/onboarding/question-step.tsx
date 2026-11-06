import { ONBOARDING_MIN_CHARS, onboardingQuestions, type OnboardingKey } from '@firmus/shared'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * Uma pergunta por tela: o rótulo do passo, a pergunta em destaque, um
 * exemplo e a caixa de resposta.
 *
 * "Continuar" só acende com 15 caracteres — o mesmo mínimo que o servidor
 * cobra, vindo de @firmus/shared, para a tela e a api nunca discordarem.
 */
export function QuestionStep({
  passo,
  chave,
  inicial,
  salvando,
  onVoltar,
  onContinuar,
}: {
  passo: number
  chave: OnboardingKey
  inicial: string
  salvando: boolean
  onVoltar: (() => void) | null
  onContinuar: (resposta: string) => void
}) {
  const [texto, setTexto] = useState(inicial)
  const { pergunta, exemplo } = onboardingQuestions[chave]
  const tamanho = texto.trim().length
  const pronto = tamanho >= ONBOARDING_MIN_CHARS

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (pronto && !salvando) onContinuar(texto.trim())
      }}
      className="rounded-2xl border border-border bg-white p-6 shadow-card sm:p-7"
    >
      <p className="label text-azul">Passo {passo} de 4</p>
      <Label
        htmlFor={`resposta-${chave}`}
        className="mt-3 block text-lg leading-snug font-semibold text-noite"
      >
        {pergunta}
      </Label>
      <p className="mt-2 text-sm leading-relaxed text-ardosia">
        <span className="font-medium">Exemplo:</span> {exemplo}
      </p>

      <Textarea
        id={`resposta-${chave}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={4}
        maxLength={2000}
        autoFocus
        placeholder="Escreva com as suas palavras, do jeito que você contaria para um cliente."
        className="mt-5 resize-y bg-white text-base placeholder:text-[#7A889C]"
        aria-describedby={`contador-${chave}`}
      />
      <p id={`contador-${chave}`} className="tabular mt-1.5 text-right text-xs text-ardosia">
        {pronto ? 'Ótimo.' : `Mais ${ONBOARDING_MIN_CHARS - tamanho} caracteres para continuar`}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={!onVoltar || salvando}
          onClick={() => onVoltar?.()}
        >
          <ArrowLeft />
          Voltar
        </Button>
        <Button type="submit" disabled={!pronto || salvando}>
          {salvando ? 'Salvando…' : 'Continuar'}
          <ArrowRight />
        </Button>
      </div>
    </form>
  )
}
