import { contentTypeLabel, contentTypeSchema } from '@firmus/shared'
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { AsyncState } from '@/components/async-state'
import { ContentGallery } from '@/components/creation/content-gallery'
import { CreationForm } from '@/components/creation/creation-form'
import { DeletePieceDialog } from '@/components/creation/delete-piece-dialog'
import { formatConfig } from '@/components/creation/format-config'
import { PieceWorkspace } from '@/components/creation/piece-workspace'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { useCompanyData } from '@/lib/queries'
import type { ContentItem, PlanEntry } from '@/lib/api-types'

export function CreationPage() {
  const { tipo } = useParams()
  const conferido = contentTypeSchema.safeParse(tipo)

  const { data, isPending, error } = useCompanyData<{ items: ContentItem[] }>(
    ['content'],
    '/content',
    { items: [] },
  )
  const { data: plano } = useCompanyData<{ entries: PlanEntry[] }>(['plan'], '/plan', {
    entries: [],
  })

  /** A peça aberta na área de trabalho. `null` mostra a galeria. */
  const [abertaId, setAbertaId] = useState<string | null>(null)
  /** A peça esperando a confirmação de exclusão. */
  const [excluindo, setExcluindo] = useState<ContentItem | null>(null)

  if (!conferido.success) {
    return <Navigate to="/criar/carrossel" replace />
  }

  const format = conferido.data
  const config = formatConfig[format]
  const items = data.items.filter((i) => i.type === format)
  // Se a peça aberta foi excluída (ou é de outro formato), volta à galeria.
  const aberta = items.find((i) => i.id === abertaId) ?? null

  // Pauta deste formato que ainda não virou peça.
  const pautas = plano.entries.filter((p) => p.format === format && p.contentItemId === null)

  return (
    <>
      <PageHeader title={contentTypeLabel[format]} description={config.description} />

      {/* O `key` zera os campos ao trocar de formato pelo menu. */}
      <CreationForm key={format} format={format} pautas={pautas} />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={items.length === 0}
        empty={{
          icon: Sparkles,
          title: `Nenhum ${config.noun} ainda`,
          description: `Quando o agente de conteúdo criar, cada ${config.noun} aparece aqui com a prévia e o texto de cada ${config.unit.one}, para revisar antes de aprovar.`,
        }}
      >
        <section className="space-y-4">
          {aberta ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setAbertaId(null)}>
                  <ArrowLeft />
                  Todas as peças
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setExcluindo(aberta)}
                >
                  <Trash2 />
                  Excluir
                </Button>
              </div>
              {/* O `key` volta para o primeiro slide ao abrir outra peça. */}
              <PieceWorkspace key={aberta.id} item={aberta} format={format} />
            </>
          ) : (
            <>
              <SectionHeading
                aside={
                  <span className="tabular text-xs text-ardosia">
                    {items.length} {items.length === 1 ? 'peça' : 'peças'}
                  </span>
                }
              >
                Peças
              </SectionHeading>
              <ContentGallery
                items={items}
                aspect={config.aspect}
                onOpen={(item) => setAbertaId(item.id)}
                onDelete={setExcluindo}
              />
            </>
          )}
        </section>
      </AsyncState>

      <DeletePieceDialog
        item={excluindo}
        onClose={() => setExcluindo(null)}
        onDeleted={() => setAbertaId(null)}
      />
    </>
  )
}
