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
          <Button className="bg-linear-to-r from-firme to-ciano text-gelo shadow-lg shadow-firme/25 hover:opacity-90">
            <Sparkles />
            Gerar artes
          </Button>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {designs.map((design) => (
          <li
            key={design.id}
            className="glass group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-ciano/40"
          >
            {/* Prévia: proporção 4:5, igual à arte final do Instagram */}
            <div className="relative grid aspect-4/5 place-items-center border-b border-border bg-linear-to-br from-noite via-abismo to-noite">
              <Images className="size-8 text-muted-foreground/40" />
              <span className="absolute right-2.5 bottom-2.5 rounded-md border border-border bg-abismo/80 px-2 py-0.5 text-[0.68rem] text-muted-foreground">
                {design.slides} {design.slides === 1 ? 'slide' : 'slides'}
              </span>
            </div>

            <div className="p-4">
              <h2 className="line-clamp-2 text-sm font-medium text-gelo">{design.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Modelo {design.template}</p>

              <div className="mt-3 flex items-center justify-between gap-2">
                <StatusBadge status={design.status} />
                <Button variant="ghost" size="icon-sm" aria-label="Baixar">
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
