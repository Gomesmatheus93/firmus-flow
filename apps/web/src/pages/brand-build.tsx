import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Brain, HelpCircle, Lock, Sparkles, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { Panel } from '@/components/surface'
import { ApiError, api } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'

/** O mesmo mínimo que o Zod da rota cobra. Validar aqui evita gastar uma chamada de IA. */
const MINIMO = 40

const ROTEIRO = [
  'O que a empresa faz e de onde ela é',
  'Quem compra: o mais específico que você souber',
  'Por que escolher você e não o concorrente da esquina',
  'Como você fala com o cliente, e o que você nunca diria',
  'O que você não pode prometer (regra de conselho, por exemplo)',
]

type Resposta = { missing: string[] }

function Voltar() {
  return (
    <Button asChild variant="outline">
      <Link to="/marca">
        <ArrowLeft />
        Voltar ao Cérebro
      </Link>
    </Button>
  )
}

export function BrandBuildPage() {
  const { company, mode } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [texto, setTexto] = useState('')
  const [pendencias, setPendencias] = useState<string[] | null>(null)
  /** Falta de chave da Anthropic é configuração do servidor, não erro de quem digitou. */
  const [semIa, setSemIa] = useState(false)

  const montar = useMutation({
    mutationFn: (description: string) => api.post<Resposta>('/brand/brain', { description }),
    onSuccess: async (data) => {
      setSemIa(false)
      setPendencias(data.missing)
      await queryClient.invalidateQueries({ queryKey: ['brand'] })
      toast.success('Cérebro da Marca montado.')
    },
    onError: (error: Error) => {
      const semChave = error instanceof ApiError && error.code === 'ia_nao_configurada'
      setSemIa(semChave)
      // Toast só para o que o chefe pode resolver digitando. Configuração de
      // servidor fica como bloco fixo na tela, que não desaparece sozinho.
      if (!semChave) toast.error(error.message)
    },
  })

  const demo = mode === 'demo'
  const curto = texto.trim().length < MINIMO

  if (company && company.role !== 'chefe') {
    return (
      <>
        <PageHeader title="Montar o Cérebro da Marca" actions={<Voltar />} />
        <Panel className="flex items-start gap-3">
          <Lock className="mt-0.5 size-4 shrink-0 text-ardosia" />
          <p className="text-sm leading-relaxed text-grafite">
            <span className="font-semibold text-noite">Isso é do chefe.</span> Configurar a marca
            muda o que todos os agentes escrevem, então só quem administra a empresa pode montar o
            Cérebro. Você continua vendo tudo o que está lá.
          </p>
        </Panel>
      </>
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (curto || demo) return
    montar.mutate(texto.trim())
  }

  return (
    <>
      <PageHeader
        title="Montar o Cérebro da Marca"
        description="Conte sobre a empresa com suas palavras. O agente organiza — e o que você não contar ele deixa em branco e pergunta, em vez de inventar."
        actions={<Voltar />}
      />

      {semIa && (
        <Panel className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div className="min-w-0 text-sm leading-relaxed text-grafite">
            <p>
              <span className="font-semibold text-noite">A IA ainda não está configurada.</span> O
              que você escreveu continua aqui — nada se perdeu.
            </p>
            <p className="mt-2">
              Preencha <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">ANTHROPIC_API_KEY</code>{' '}
              no arquivo <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">.env</code> da
              raiz do projeto e tente de novo.
            </p>
          </div>
        </Panel>
      )}

      {pendencias && (
        <Panel>
          <SectionHeading>Cérebro montado. Isto ficou em aberto</SectionHeading>

          {pendencias.length === 0 ? (
            <p className="mt-4 text-sm text-ardosia">
              O agente não deixou pendência: ele achou tudo o que precisava no que você escreveu.
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm leading-relaxed text-ardosia">
                O agente preferiu deixar em branco do que chutar. Responda abaixo e monte de novo —
                cada resposta deixa o conteúdo mais parecido com a empresa.
              </p>
              <ul className="mt-4 space-y-2.5">
                {pendencias.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-grafite">
                    <HelpCircle className="mt-0.5 size-4 shrink-0 text-azul" />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button onClick={() => void navigate('/marca')}>
              <Brain />
              Ver o Cérebro
            </Button>
          </div>
        </Panel>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <Panel>
          <form onSubmit={handleSubmit}>
            <Label htmlFor="description">Sobre a empresa</Label>

            <Textarea
              id="description"
              name="description"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              disabled={demo || montar.isPending}
              // O componente usa `field-sizing-content`, que encolhe o campo ao
              // conteúdo e ignora `rows`. Vazio, ele viraria três linhas — e uma
              // caixa de três linhas pede uma frase, não os parágrafos que esta
              // tela quer. Então sobe-se o piso e deixa ele crescer dali.
              className="mt-2.5 min-h-72 resize-y"
              placeholder="Ex.: Tenho um estúdio de estética em Mossoró. Faço limpeza de pele e microagulhamento, atendo só com horário marcado…"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ardosia">
                {curto
                  ? `escreva pelo menos ${MINIMO} caracteres — faltam ${Math.max(
                      MINIMO - texto.trim().length,
                      0,
                    )}`
                  : `${texto.trim().length} caracteres`}
              </p>

              <Button type="submit" disabled={curto || demo || montar.isPending}>
                <Sparkles />
                {montar.isPending ? 'Montando…' : 'Montar o Cérebro'}
              </Button>
            </div>

            {demo && (
              <p className="mt-3 text-xs text-ardosia">
                No modo demonstração não há empresa de verdade para salvar. Configure o Supabase no
                .env para usar isto.
              </p>
            )}
          </form>
        </Panel>

        <Panel>
          <SectionHeading>O que vale contar</SectionHeading>
          <ul className="mt-4 space-y-3">
            {ROTEIRO.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-grafite">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-ardosia">
            Escreva como você falaria com um cliente. Não precisa ficar bonito: o agente organiza.
            Número, prêmio e tempo de mercado só entram se você disser — ele não inventa nenhum.
          </p>
        </Panel>
      </div>
    </>
  )
}
