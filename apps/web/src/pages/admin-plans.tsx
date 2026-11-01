import { billingIntervalLabel, formatBRL, type BillingInterval } from '@firmus/shared'
import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { AsyncState } from '@/components/async-state'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { Pill } from '@/components/status-badge'
import { Panel } from '@/components/surface'
import { api } from '@/lib/api'

type PlanRow = {
  id: string
  name: string
  description: string | null
  priceCents: number
  interval: BillingInterval
  active: boolean
  assinantes: number
}

export function AdminPlansPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => api.get<{ plans: PlanRow[] }>('/admin/plans'),
  })

  return (
    <>
      <PageHeader
        title="Planos"
        description="O que a Firmus vende e por quanto. É daqui que sai o cálculo da receita recorrente."
      />

      <Panel>
        <p className="text-sm leading-relaxed text-ardosia">
          <span className="font-semibold text-noite">Ainda não dá para cadastrar por aqui.</span>{' '}
          Quando a landing page de vendas estiver no ar, o gateway de pagamento é quem vai criar
          plano, assinatura e fatura. Montar um cadastro manual agora seria trabalho jogado fora —
          as tabelas já existem e já guardam o id de cada coisa no gateway.
        </p>
      </Panel>

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={(data?.plans.length ?? 0) === 0}
        empty={{
          icon: Receipt,
          title: 'Nenhum plano cadastrado',
          description:
            'Os planos vão aparecer aqui assim que forem criados pelo gateway de pagamento.',
        }}
      >
        <DataTable
          caption={`${data?.plans.length ?? 0} planos`}
          rows={data?.plans ?? []}
          rowKey={(plano) => plano.id}
          columns={[
            {
              header: 'Plano',
              cell: (plano) => <span className="font-medium text-noite">{plano.name}</span>,
            },
            {
              header: 'Preço',
              className: 'whitespace-nowrap',
              cell: (plano) => formatBRL(plano.priceCents),
            },
            {
              header: 'Cobrança',
              cell: (plano) => (
                <span className="text-ardosia">{billingIntervalLabel[plano.interval]}</span>
              ),
            },
            {
              header: 'Assinantes',
              cell: (plano) => <span className="tabular">{plano.assinantes}</span>,
            },
            {
              header: 'Situação',
              cell: (plano) => (
                <Pill tone={plano.active ? 'verde' : 'neutro'}>
                  {plano.active ? 'Ativo' : 'Inativo'}
                </Pill>
              ),
            },
          ]}
        />
      </AsyncState>
    </>
  )
}
