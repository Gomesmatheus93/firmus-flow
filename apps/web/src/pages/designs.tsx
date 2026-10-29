import { Download, Images, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { StatusBadge } from '@/components/status-badge'
import { designs } from '@/mocks/content'

export function DesignsPage() {
  return (
    <>
      <PageHeader
        title="Artes"
        description="Carrosséis e posts únicos em 1080×1350, montados com as cores, o logo e as fontes do cliente."
        badge={<SampleBadge />}
        actions={
          <Button>
            <Sparkles />
            Gerar artes
          </Button>
        }
      />

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {designs.map((design) => (
          <li
            key={design.id}
            className="surface overflow-hidden transition-shadow hover:shadow-panel"
          >
            {/* Prévia na proporção 4:5, igual à arte final do Instagram. */}
            <div className="relative grid aspect-4/5 place-items-center border-b border-white/60 bg-white/40">
              <Images className="size-7 text-ardosia/40" />
              <span className="absolute right-2.5 bottom-2.5 rounded-lg bg-white/85 px-1.5 py-0.5 text-[0.65rem] text-ardosia">
                {design.slides} {design.slides === 1 ? 'slide' : 'slides'}
              </span>
            </div>

            <div className="p-4">
              <p className="text-xs text-ardosia">Modelo {design.template}</p>
              <h2 className="mt-1.5 line-clamp-2 text-sm font-medium text-noite">{design.title}</h2>

              <div className="mt-3.5 flex items-center justify-between gap-2">
                <StatusBadge status={design.status} />
                <Button variant="ghost" size="icon-sm" aria-label={`Baixar ${design.title}`}>
                  <Download />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
