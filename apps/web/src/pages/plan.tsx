import { CalendarDays } from 'lucide-react'
import { AsyncState } from '@/components/async-state'
import { PageHeader } from '@/components/page-header'
import { PlanCalendar } from '@/components/plan/plan-calendar'
import { PlanForm } from '@/components/plan/plan-form'
import { useCompanyData } from '@/lib/queries'
import type { ContentItem, PlanEntry } from '@/lib/api-types'

export function PlanPage() {
  const { data, isPending, error } = useCompanyData<{ entries: PlanEntry[] }>(['plan'], '/plan', {
    entries: [],
  })
  const { data: conteudo } = useCompanyData<{ items: ContentItem[] }>(['content'], '/content', {
    items: [],
  })
  // A peça de cada pauta, achada pelo id: o card mostra a capa dela.
  const pecaPorId = new Map(conteudo.items.map((peca) => [peca.id, peca]))

  return (
    <>
      <PageHeader
        title="Planejamento"
        description="O que publicar, quando e com qual objetivo. O agente estrategista monta as pautas a partir do Cérebro da Marca; daqui cada uma vira uma peça."
      />

      <PlanForm />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.entries.length === 0}
        empty={{
          icon: CalendarDays,
          title: 'Nenhum planejamento ainda',
          description:
            'Quando o agente estrategista montar as pautas, elas aparecem aqui num calendário de segunda a domingo.',
        }}
      >
        <PlanCalendar entries={data.entries} pecas={pecaPorId} />
      </AsyncState>
    </>
  )
}
