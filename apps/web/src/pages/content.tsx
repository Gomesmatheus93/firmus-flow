import { Sparkles } from 'lucide-react'
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
          <Button>
            <Sparkles />
            Escrever conteúdo
          </Button>
        }
      />

      <ul className="surface divide-y divide-border overflow-hidden">
        {captions.map((item) => (
          <li key={item.id} className="p-5 transition-colors hover:bg-white/60/50">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-ardosia">{item.format}</p>
                <h2 className="mt-1.5 text-sm font-medium text-noite">{item.title}</h2>
              </div>
              <StatusBadge status={item.status} />
            </div>

            <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-relaxed text-ardosia">
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
