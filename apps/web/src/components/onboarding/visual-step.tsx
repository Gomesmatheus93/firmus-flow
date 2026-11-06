import { ArrowLeft, ImagePlus, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

const TIPOS = ['image/png', 'image/svg+xml']
const MAX = 5 * 1024 * 1024
const HEX = /^#[0-9a-fA-F]{6}$/

/**
 * O passo extra, opcional: logo, até 4 cores e o @ do Instagram.
 *
 * O logo sobe na hora em que é escolhido, para a pré-visualização mostrar o
 * arquivo que o servidor guardou de verdade. Cores e @ vão juntos no
 * "Continuar".
 */
export function VisualStep({
  inicial,
  salvando,
  onVoltar,
  onContinuar,
  onPular,
}: {
  inicial: { colors: string[]; instagram: string; logoUrl: string | null }
  salvando: boolean
  onVoltar: () => void
  onContinuar: (visual: { colors: string[]; instagram: string }) => void
  onPular: () => void
}) {
  const [logo, setLogo] = useState(inicial.logoUrl)
  const [enviando, setEnviando] = useState(false)
  const [cores, setCores] = useState<string[]>(inicial.colors)
  const [instagram, setInstagram] = useState(inicial.instagram)

  const coresValidas = cores.every((c) => HEX.test(c))

  async function escolherLogo(arquivo: File | undefined) {
    if (!arquivo) return
    if (!TIPOS.includes(arquivo.type)) return toast.error('Envie o logo em PNG ou SVG.')
    if (arquivo.size > MAX) return toast.error('O logo pode ter até 5 MB.')

    setEnviando(true)
    try {
      const { logoUrl } = await api.upload<{ logoUrl: string | null }>('/onboarding/logo', arquivo)
      setLogo(logoUrl)
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Não consegui enviar o logo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card sm:p-7">
      <p className="label text-azul">Passo extra · opcional</p>
      <h2 className="mt-3 text-lg leading-snug font-semibold text-noite">Sua identidade visual</h2>
      <p className="mt-2 text-sm leading-relaxed text-ardosia">
        Com o logo e as cores, os posts já saem com a cara da sua marca. Dá para pular e mandar
        depois.
      </p>

      <div className="mt-6 space-y-2">
        <Label>Logo</Label>
        <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-input p-3 transition-colors hover:border-azul">
          <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-gelo">
            {logo ? (
              <img src={logo} alt="Seu logo" className="size-full object-contain" />
            ) : (
              <ImagePlus className="size-6 text-ardosia" />
            )}
          </span>
          <span className="text-sm text-grafite">
            {enviando ? 'Enviando…' : logo ? 'Trocar o logo' : 'Escolher arquivo'}
            <span className="block text-xs text-ardosia">PNG ou SVG, até 5 MB</span>
          </span>
          <input
            type="file"
            accept="image/png,image/svg+xml"
            className="sr-only"
            disabled={enviando}
            onChange={(e) => void escolherLogo(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="mt-6 space-y-2">
        <Label>Cores da marca</Label>
        <ul className="space-y-2">
          {cores.map((cor, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={HEX.test(cor) ? cor : '#000000'}
                onChange={(e) =>
                  setCores(cores.map((c, j) => (j === i ? e.target.value.toUpperCase() : c)))
                }
                aria-label={`Cor ${i + 1}`}
                className="h-9 w-11 cursor-pointer rounded-md border border-input bg-white p-1"
              />
              <Input
                value={cor}
                onChange={(e) => setCores(cores.map((c, j) => (j === i ? e.target.value : c)))}
                aria-label={`Código da cor ${i + 1}`}
                aria-invalid={!HEX.test(cor)}
                className="tabular w-32 font-mono uppercase"
                maxLength={7}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover a cor ${i + 1}`}
                onClick={() => setCores(cores.filter((_, j) => j !== i))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
        {cores.length < 4 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCores([...cores, '#1C8CFF'])}
          >
            <Plus />
            Adicionar cor
          </Button>
        )}
        {!coresValidas && <p className="text-xs text-destructive">Use o formato #1C8CFF.</p>}
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="onboarding-instagram">Instagram</Label>
        <div className="flex items-center rounded-md border border-input bg-white focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <span className="pl-3 text-sm text-ardosia">@</span>
          <input
            id="onboarding-instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
            maxLength={30}
            placeholder="suaempresa"
            className="h-9 w-full bg-transparent px-1.5 text-sm outline-none placeholder:text-[#7A889C]"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onVoltar} disabled={salvando}>
          <ArrowLeft />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onPular} disabled={salvando || enviando}>
            Pular
          </Button>
          <Button
            type="button"
            disabled={!coresValidas || salvando || enviando}
            onClick={() => onContinuar({ colors: cores, instagram })}
          >
            {salvando ? 'Salvando…' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
