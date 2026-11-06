import { ONBOARDING_KEYS } from '@firmus/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Logo } from '@/components/logo'
import { QuestionStep } from '@/components/onboarding/question-step'
import { Review, type ReviewResult } from '@/components/onboarding/review'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { VisualStep } from '@/components/onboarding/visual-step'
import { Splash } from '@/components/splash'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OnboardingState } from '@/lib/api-types'
import { useAuth } from '@/providers/auth-provider'

const CHAVE = ['onboarding'] as const

/** A moldura de todas as telas: o logo em cima e a coluna estreita no meio. */
function Moldura({
  children,
  largura = 'max-w-[440px]',
}: {
  children: ReactNode
  largura?: string
}) {
  return (
    <div className="min-h-dvh bg-fundo">
      <header className="flex justify-center px-4 pt-8 pb-6">
        <Logo />
      </header>
      <main className={`mx-auto w-full ${largura} px-4 pb-12`}>{children}</main>
    </div>
  )
}

/** Um aviso no lugar do card: análise, erro ou falta de IA. */
function Aviso({
  icone,
  titulo,
  children,
}: {
  icone: ReactNode
  titulo: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-7 text-center shadow-card">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-gelo">{icone}</div>
      <h1 className="mt-4 text-lg font-semibold text-noite">{titulo}</h1>
      <div className="mt-2 text-sm leading-relaxed text-ardosia">{children}</div>
    </div>
  )
}

/**
 * O onboarding da marca: quatro perguntas, o passo visual opcional, a análise
 * do agente e a revisão do resumo.
 *
 * O servidor é quem guarda o passo: fechar a página e voltar continua de onde
 * parou. Esta tela só decide o que mostrar a partir do estado que ele devolve.
 */
export function OnboardingPage() {
  const { company, mode } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const ehChefe = mode === 'supabase' && company?.role === 'chefe' && !company.viewedAsOperator

  const { data, isPending, error } = useQuery({
    queryKey: CHAVE,
    queryFn: () => api.get<OnboardingState>('/onboarding'),
    enabled: ehChefe,
    // Enquanto o agente analisa, pergunta de 2 em 2 segundos se terminou.
    refetchInterval: (q) => (q.state.data?.onboarding.status === 'gerando' ? 2000 : false),
  })

  /** O passo na tela. `null` = o que o servidor diz. */
  const [passoLocal, setPassoLocal] = useState<number | null>(null)
  /** O chefe voltou para revisar respostas a partir de um aviso. */
  const [revisando, setRevisando] = useState(false)

  const atualizar = () => queryClient.invalidateQueries({ queryKey: CHAVE })

  const responder = useMutation({
    mutationFn: ({ passo, answer }: { passo: number; answer: string }) =>
      api.put(`/onboarding/passo/${passo}`, { answer }),
    onSuccess: async (_r, { passo }) => {
      await atualizar()
      setPassoLocal(passo + 1)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const concluir = useMutation({
    mutationFn: async (visual: { colors: string[]; instagram: string } | null) => {
      if (visual) await api.put('/onboarding/visual', visual)
      return api.post('/onboarding/concluir')
    },
    onSuccess: async () => {
      setRevisando(false)
      setPassoLocal(null)
      await atualizar()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const confirmar = useMutation({
    mutationFn: (editado: ReviewResult) => api.post('/onboarding/confirmar', editado),
    onSuccess: async () => {
      await Promise.all([atualizar(), queryClient.invalidateQueries({ queryKey: ['brand'] })])
      toast.success('Cérebro da Marca pronto.')
      navigate('/painel', { replace: true })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Funcionário, operador e modo demonstração não respondem pela marca.
  if (!ehChefe) return <Navigate to="/painel" replace />
  if (isPending) return <Splash />
  if (error || !data) {
    return (
      <Moldura>
        <Aviso
          icone={<TriangleAlert className="size-5 text-destructive" />}
          titulo="Algo deu errado"
        >
          {error instanceof Error ? error.message : 'Não foi possível carregar o onboarding.'}
        </Aviso>
      </Moldura>
    )
  }

  const { onboarding } = data
  const { status } = onboarding

  if (status === 'gerando') {
    return (
      <Moldura>
        <Aviso
          icone={<Loader2 className="size-5 animate-spin text-azul" />}
          titulo="Analisando sua empresa…"
        >
          A Firmus está lendo as suas respostas e montando o Cérebro da Marca. Leva menos de um
          minuto. Pode deixar esta tela aberta.
        </Aviso>
      </Moldura>
    )
  }

  if (status === 'revisao' && onboarding.draft) {
    return (
      <Moldura largura="max-w-[560px]">
        <Review
          draft={onboarding.draft}
          salvando={confirmar.isPending}
          onConfirmar={confirmar.mutate}
        />
      </Moldura>
    )
  }

  if (!revisando && (status === 'erro' || status === 'sem_ia')) {
    const semIa = status === 'sem_ia'
    return (
      <Moldura>
        <Aviso
          icone={<TriangleAlert className="size-5 text-amber-600" />}
          titulo={semIa ? 'Suas respostas estão salvas' : 'A análise não deu certo'}
        >
          <p>
            {onboarding.errorMessage ??
              'A IA da plataforma ainda não está ativa. Assim que estiver, o Cérebro da Marca é montado a partir destas respostas.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRevisando(true)
                setPassoLocal(1)
              }}
            >
              Revisar respostas
            </Button>
            {semIa ? (
              <Button onClick={() => navigate('/painel')}>Ir para o painel</Button>
            ) : (
              <Button disabled={concluir.isPending} onClick={() => concluir.mutate(null)}>
                Tentar de novo
              </Button>
            )}
          </div>
        </Aviso>
      </Moldura>
    )
  }

  // Voltando de um Cérebro já pronto (por "Editar"), começa do primeiro passo.
  const passo = passoLocal ?? (status === 'concluido' ? 1 : Math.min(onboarding.currentStep, 5))
  const chave = ONBOARDING_KEYS[passo - 1]

  return (
    <Moldura>
      <div className="mb-6">
        <StepIndicator atual={passo} />
      </div>

      {chave ? (
        <QuestionStep
          // O `key` troca o componente a cada passo: a caixa começa com a resposta dele.
          key={chave}
          passo={passo}
          chave={chave}
          inicial={onboarding.answers[chave] ?? ''}
          salvando={responder.isPending}
          onVoltar={passo > 1 ? () => setPassoLocal(passo - 1) : null}
          onContinuar={(answer) => responder.mutate({ passo, answer })}
        />
      ) : (
        <VisualStep
          inicial={onboarding.visual}
          salvando={concluir.isPending}
          onVoltar={() => setPassoLocal(4)}
          onPular={() => concluir.mutate(null)}
          onContinuar={(visual) => concluir.mutate(visual)}
        />
      )}

      <p className="mt-4 text-center text-sm text-ardosia">
        Leva uns 3 minutos. Você pode editar tudo depois.
      </p>
    </Moldura>
  )
}
