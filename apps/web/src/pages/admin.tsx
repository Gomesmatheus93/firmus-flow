import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { AsyncState } from '@/components/async-state'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/surface'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/dates'
import { escolherEmpresa } from '@/lib/operator'

type CompanyRow = {
  id: string
  name: string
  segment: string | null
  instagramHandle: string | null
  createdAt: string
  members: number
  contentCount: number
  leadCount: number
}

export function AdminPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isPending, error } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => api.get<{ companies: CompanyRow[] }>('/admin/companies'),
  })

  function entrar(empresa: CompanyRow) {
    escolherEmpresa({ id: empresa.id, nome: empresa.name })
    // Limpa o cache: o que estiver guardado é da empresa anterior.
    queryClient.clear()
    void navigate('/painel')
  }

  return (
    <>
      <PageHeader
        title="Administração"
        description="Todas as empresas na plataforma. Entrar numa delas abre as telas com os dados daquele cliente — e fica registrado."
      />

      <Panel>
        <p className="text-sm leading-relaxed text-ardosia">
          <span className="font-semibold text-noite">O que você não vê aqui.</span> Conversas de
          WhatsApp e dados de leads são de pessoas que são clientes do seu cliente, e não da Firmus.
          Essas telas ficam bloqueadas mesmo depois de entrar numa empresa.
        </p>
      </Panel>

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={(data?.companies.length ?? 0) === 0}
        empty={{
          icon: Building2,
          title: 'Nenhuma empresa ainda',
          description: 'Quando o primeiro cliente criar a empresa dele, ela aparece aqui.',
        }}
      >
        <ul className="surface divide-y divide-border overflow-hidden">
          {data?.companies.map((empresa) => (
            <li
              key={empresa.id}
              className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-noite">{empresa.name}</h2>
                <p className="mt-1 text-xs text-ardosia">
                  {empresa.segment ?? 'sem segmento'}
                  {empresa.instagramHandle ? ` · ${empresa.instagramHandle}` : ''} · desde{' '}
                  {formatDate(empresa.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-5">
                <dl className="flex gap-5 text-xs">
                  {[
                    { rotulo: 'pessoas', valor: empresa.members },
                    { rotulo: 'conteúdos', valor: empresa.contentCount },
                    { rotulo: 'leads', valor: empresa.leadCount },
                  ].map((item) => (
                    <div key={item.rotulo}>
                      <dt className="text-ardosia">{item.rotulo}</dt>
                      <dd className="tabular mt-0.5 text-base font-semibold text-noite">
                        {item.valor}
                      </dd>
                    </div>
                  ))}
                </dl>

                <Button size="sm" onClick={() => entrar(empresa)}>
                  Entrar
                  <ArrowRight />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </AsyncState>
    </>
  )
}
