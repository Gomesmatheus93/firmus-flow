import { ExternalLink, Flame, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AsyncState } from '@/components/async-state'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/surface'
import { formatDateTime } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import type { TrendReport } from '@/lib/api-types'

export function TrendsPage() {
  const { data, isPending, error } = useCompanyData<{ reports: TrendReport[] }>(
    ['trends'],
    '/trends',
    { reports: [] },
  )

  const latest = data.reports[0]

  return (
    <>
      <PageHeader
        title="Tendências"
        description="O que está em alta no nicho do cliente agora, pelo agente ig-viral."
        actions={
          <Button>
            <Search />
            Buscar tendências
          </Button>
        }
      />

      <Panel>
        <p className="text-sm leading-relaxed text-ardosia">
          <span className="font-semibold text-noite">De onde vem este dado.</span> A API do
          Instagram não entrega informação sobre perfis de terceiros, então o agente pesquisa na web
          e cita a fonte de cada achado. É leitura de tendência, não número oficial do Instagram —
          confira a fonte antes de apostar numa pauta.
        </p>
      </Panel>

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={!latest}
        empty={{
          icon: Flame,
          title: 'Nenhuma busca feita ainda',
          description:
            'O agente ig-viral pesquisa o nicho do cliente e devolve temas, formatos e ganchos em alta, sempre com a fonte.',
        }}
      >
        {latest && (
          <ul className="space-y-3">
            {data.reports.map((report) => (
              <li key={report.id}>
                <Panel>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="text-base font-semibold text-noite">{report.niche}</h2>
                    <span className="text-xs text-ardosia">
                      {formatDateTime(report.generatedAt)}
                    </span>
                  </div>

                  {report.sources.length > 0 && (
                    <>
                      <p className="mt-4 text-xs font-medium text-ardosia">Fontes</p>
                      <ul className="mt-2 space-y-1.5">
                        {report.sources.map((source) => (
                          <li key={source.url}>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-azul hover:underline"
                            >
                              {source.title}
                              <ExternalLink className="size-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </AsyncState>
    </>
  )
}
