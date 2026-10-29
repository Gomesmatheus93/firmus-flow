import { PenLine, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { StatusBadge } from '@/components/status-badge'
import { captions } from '@/mocks/content'

export function ContentPage() {
  return (
    <>
      <PageHeader
        title="Textos e legendas"
        description="Legendas, roteiros de reels e textos de carrossel. Todo texto passa pelo humanizador antes de ser salvo."
        badge={<SampleBadge />}
        actions={
          <Button className="bg-linear-to-r from-firme to-ciano text-gelo shadow-lg shadow-firme/25 hover:opacity-90">
            <Sparkles />
            Escrever conteúdo
          </Button>
        }
      />

      <ul className="space-y-3">
        {captions.map((item) => (
          <li
            key={item.id}
            className="glass rounded-xl border border-border bg-card p-5 transition-colors hover:border-ciano/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <PenLine className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-gelo">{item.title}</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.format}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>

            <p className="mt-3.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {item.preview}
            </p>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                Abrir
              </Button>
              <Button variant="ghost" size="sm">
                Duplicar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
