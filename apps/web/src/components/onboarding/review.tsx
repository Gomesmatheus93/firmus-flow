import type { BrandBrainDraft } from '@firmus/shared'
import { Check, Pencil } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** Lista ↔ texto com um item por linha, para editar numa caixa só. */
const paraTexto = (itens: string[]) => itens.join('\n')
const paraLista = (texto: string) =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

/** Um bloco do resumo: mostra o texto; o lápis troca pelos campos de edição. */
function Bloco({
  titulo,
  editor,
  children,
}: {
  titulo: string
  editor: ReactNode
  children: ReactNode
}) {
  const [editando, setEditando] = useState(false)

  return (
    <section className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="label text-ardosia">{titulo}</h3>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setEditando(!editando)}
          aria-expanded={editando}
        >
          {editando ? <Check /> : <Pencil />}
          {editando ? 'Pronto' : 'Editar'}
        </Button>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-grafite">
        {editando ? editor : children}
      </div>
    </section>
  )
}

/** Um campo de texto com rótulo, dentro de um bloco em edição. */
function Campo({
  rotulo,
  valor,
  onChange,
  ajuda,
  linhas = 3,
}: {
  rotulo: string
  valor: string
  onChange: (v: string) => void
  ajuda?: string
  linhas?: number
}) {
  return (
    <div className="space-y-1.5 [&+&]:mt-3">
      <Label className="text-xs text-ardosia">{rotulo}</Label>
      <Textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={linhas}
        className="bg-white text-sm"
      />
      {ajuda && <p className="text-xs text-ardosia">{ajuda}</p>}
    </div>
  )
}

const Itens = ({ itens }: { itens: string[] }) =>
  itens.length === 0 ? (
    <p className="text-ardosia">Nada aqui ainda.</p>
  ) : (
    <ul className="list-disc space-y-0.5 pl-5">
      {itens.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  )

export type ReviewResult = Pick<
  BrandBrainDraft,
  'context' | 'services' | 'audience' | 'differentiators' | 'toneOfVoice'
>

/**
 * "Assim a Firmus entendeu a sua empresa": o rascunho do agente em quatro
 * blocos editáveis. O que o chefe confirmar aqui vira o Cérebro da Marca.
 */
export function Review({
  draft,
  salvando,
  onConfirmar,
}: {
  draft: BrandBrainDraft
  salvando: boolean
  onConfirmar: (editado: ReviewResult) => void
}) {
  const [context, setContext] = useState(draft.context)
  const [servicos, setServicos] = useState(paraTexto(draft.services))
  const [audience, setAudience] = useState(draft.audience)
  const [diferenciais, setDiferenciais] = useState(paraTexto(draft.differentiators))
  const [tom, setTom] = useState(draft.toneOfVoice.summary)
  const [nunca, setNunca] = useState(paraTexto(draft.toneOfVoice.donts))

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-noite">
          Assim a Firmus entendeu a sua empresa
        </h1>
        <p className="mt-2 text-sm text-ardosia">
          Confira cada bloco. O que estiver errado, edite: é daqui que todos os posts vão sair.
        </p>
      </div>

      <Bloco
        titulo="Oferta"
        editor={
          <>
            <Campo rotulo="O que a empresa faz" valor={context} onChange={setContext} />
            <Campo
              rotulo="Serviços"
              ajuda="Um serviço por linha."
              valor={servicos}
              onChange={setServicos}
              linhas={4}
            />
          </>
        }
      >
        <p>{context}</p>
        <div className="mt-2">
          <Itens itens={paraLista(servicos)} />
        </div>
      </Bloco>

      <Bloco
        titulo="Cliente ideal"
        editor={<Campo rotulo="Quem compra" valor={audience} onChange={setAudience} />}
      >
        <p>{audience || <span className="text-ardosia">Nada aqui ainda.</span>}</p>
      </Bloco>

      <Bloco
        titulo="Diferenciais"
        editor={
          <Campo
            rotulo="Por que escolher vocês"
            ajuda="Um diferencial por linha."
            valor={diferenciais}
            onChange={setDiferenciais}
            linhas={4}
          />
        }
      >
        <Itens itens={paraLista(diferenciais)} />
      </Bloco>

      <Bloco
        titulo="Tom de voz"
        editor={
          <>
            <Campo rotulo="Como a marca fala" valor={tom} onChange={setTom} linhas={2} />
            <Campo
              rotulo="O que ela nunca diria"
              ajuda="Uma palavra ou frase por linha."
              valor={nunca}
              onChange={setNunca}
            />
          </>
        }
      >
        <p>{tom}</p>
        {paraLista(nunca).length > 0 && (
          <p className="mt-2 text-ardosia">
            Nunca diria: <span className="text-grafite">{paraLista(nunca).join(', ')}</span>
          </p>
        )}
      </Bloco>

      <Button
        className="w-full"
        size="lg"
        disabled={salvando || !context.trim() || !audience.trim()}
        onClick={() =>
          onConfirmar({
            context: context.trim(),
            services: paraLista(servicos),
            audience: audience.trim(),
            differentiators: paraLista(diferenciais),
            toneOfVoice: { ...draft.toneOfVoice, summary: tom.trim(), donts: paraLista(nunca) },
          })
        }
      >
        {salvando ? 'Salvando…' : 'Está certo, vamos começar'}
      </Button>
    </div>
  )
}
