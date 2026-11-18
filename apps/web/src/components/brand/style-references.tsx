import type { StyleGuide } from '@firmus/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ImagePlus, LoaderCircle, Trash2, TriangleAlert, X } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { SectionHeading } from '@/components/page-header'
import { Panel } from '@/components/surface'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'

export type StyleReference = {
  id: string
  imageUrl: string | null
  guide: StyleGuide
  createdAt: string
}

type Lista = { references: StyleReference[]; max: number }

/** Os mesmos limites da api, conferidos antes para o chefe não esperar à toa. */
const TIPOS = ['image/png', 'image/jpeg', 'image/webp']
const TAMANHO_MAX = 5 * 1024 * 1024

/**
 * As referências de design ("Enviar template") do Cérebro da Marca.
 *
 * O chefe envia a imagem de um design de que gosta; a IA tira dela um guia de
 * estilo, que entra no Cérebro e passa a valer para todos os agentes. O
 * funcionário vê, mas não envia nem apaga.
 */
export function StyleReferences() {
  const { company, mode } = useAuth()
  const isBoss = company?.role === 'chefe'
  const queryClient = useQueryClient()
  const campo = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState<string | null>(null)

  const { data } = useCompanyData<Lista>(['brand', 'style-references'], '/brand/style-references', {
    references: [],
    max: 6,
  })

  const enviar = useMutation({
    mutationFn: (arquivo: File) =>
      api.upload<{ reference: StyleReference }>('/brand/style-references', arquivo),
    onSuccess: async () => {
      setErro(null)
      await queryClient.invalidateQueries({ queryKey: ['brand', 'style-references'] })
      toast.success('Referência analisada. Os agentes já seguem esse estilo.')
    },
    onError: (e: Error) => setErro(e.message),
  })

  function escolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    // Limpa o campo para dar para escolher o mesmo arquivo de novo depois.
    evento.target.value = ''
    if (!arquivo) return

    if (!TIPOS.includes(arquivo.type)) {
      setErro('Envie a referência em PNG, JPG ou WebP.')
      return
    }
    if (arquivo.size > TAMANHO_MAX) {
      setErro('A referência pode ter até 5 MB.')
      return
    }
    enviar.mutate(arquivo)
  }

  const cheio = data.references.length >= data.max
  const podeEnviar = isBoss && mode !== 'demo'

  return (
    <Panel className="space-y-5">
      <SectionHeading
        aside={
          podeEnviar && (
            <>
              <input
                ref={campo}
                type="file"
                accept={TIPOS.join(',')}
                className="sr-only"
                onChange={escolher}
                tabIndex={-1}
                aria-hidden
              />
              <Button
                disabled={enviar.isPending || cheio}
                onClick={() => campo.current?.click()}
                title={
                  cheio
                    ? `Limite de ${data.max} referências. Apague uma para enviar outra.`
                    : undefined
                }
              >
                {enviar.isPending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
                {enviar.isPending ? 'Analisando…' : 'Enviar template'}
              </Button>
            </>
          )
        }
      >
        Referências de design
      </SectionHeading>

      <p className="-mt-2 max-w-2xl text-sm leading-relaxed text-ardosia">
        Envie o print de um post, carrossel ou anúncio cujo visual você queira para a sua marca. A
        IA tira dele um guia de estilo (cores, tipografia, composição) e todos os agentes passam a
        segui-lo. Só o estilo é usado, nunca o texto ou a marca de quem fez a referência.
        {data.references.length > 0 && (
          <span className="tabular">
            {' '}
            {data.references.length} de {data.max}.
          </span>
        )}
      </p>

      {enviar.isPending && (
        <p className="flex items-center gap-2 rounded-xl bg-gelo px-4 py-3 text-sm text-grafite">
          <LoaderCircle className="size-4 shrink-0 animate-spin text-azul" />A IA está olhando a
          imagem. Leva uns 20 segundos.
        </p>
      )}

      {erro && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-grafite">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span className="min-w-0">
            <span className="font-semibold text-noite">Não consegui usar essa referência.</span>{' '}
            {erro}
          </span>
        </p>
      )}

      {data.references.length === 0 ? (
        <p className="rounded-xl border border-dashed border-input px-4 py-8 text-center text-sm text-ardosia">
          {isBoss
            ? 'Nenhuma referência ainda. Sem ela, os agentes seguem só a paleta e o tom do Cérebro.'
            : 'Nenhuma referência ainda. Quem envia é o chefe da empresa.'}
        </p>
      ) : (
        <ul className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.references.map((ref) => (
            <ReferenceCard key={ref.id} reference={ref} podeApagar={podeEnviar} />
          ))}
        </ul>
      )}
    </Panel>
  )
}

function ReferenceCard({
  reference,
  podeApagar,
}: {
  reference: StyleReference
  podeApagar: boolean
}) {
  const queryClient = useQueryClient()
  const [confirmar, setConfirmar] = useState(false)
  const { guide } = reference

  const apagar = useMutation({
    mutationFn: () => api.delete(`/brand/style-references/${reference.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['brand', 'style-references'] })
      toast.success('Referência apagada.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-regua bg-white">
      <div className="relative aspect-[4/3] bg-gelo">
        {reference.imageUrl ? (
          <img src={reference.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <span className="grid size-full place-items-center text-xs text-ardosia">
            imagem indisponível
          </span>
        )}
        {guide.mood && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-noite">
            {guide.mood}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm leading-relaxed text-grafite">{guide.summary}</p>

        {guide.palette.length > 0 && (
          <ul className="mt-3 flex gap-1.5" aria-label="Paleta da referência">
            {guide.palette.map((cor) => (
              <li
                key={`${cor.hex}-${cor.role}`}
                title={`${cor.hex} · ${cor.role}`}
                className="h-6 flex-1 rounded-md border border-black/5"
                style={{ backgroundColor: cor.hex }}
              />
            ))}
          </ul>
        )}

        <details className="group mt-3">
          <summary className="cursor-pointer text-xs font-medium text-azul select-none">
            Ver o guia completo
          </summary>
          <dl className="mt-3 space-y-2.5 text-sm">
            {(
              [
                ['Tipografia', guide.typography],
                ['Composição', guide.composition],
                ['Quantidade de texto', guide.textDensity],
                ['Imagens', guide.imagery],
              ] as const
            )
              .filter(([, valor]) => valor)
              .map(([rotulo, valor]) => (
                <div key={rotulo}>
                  <dt className="text-xs text-ardosia">{rotulo}</dt>
                  <dd className="text-grafite">{valor}</dd>
                </div>
              ))}
          </dl>
          {(guide.dos.length > 0 || guide.donts.length > 0) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ul className="space-y-1.5">
                {guide.dos.map((item) => (
                  <li key={item} className="flex gap-1.5 text-xs text-grafite">
                    <Check className="mt-px size-3.5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <ul className="space-y-1.5">
                {guide.donts.map((item) => (
                  <li key={item} className="flex gap-1.5 text-xs text-grafite">
                    <X className="mt-px size-3.5 shrink-0 text-destructive" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </details>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-ardosia">
          <span>Enviada em {formatDate(reference.createdAt)}</span>
          {podeApagar && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={apagar.isPending}
              onClick={() => (confirmar ? apagar.mutate() : setConfirmar(true))}
              onBlur={() => setConfirmar(false)}
            >
              <Trash2 />
              {confirmar ? 'Confirmar' : 'Apagar'}
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}
