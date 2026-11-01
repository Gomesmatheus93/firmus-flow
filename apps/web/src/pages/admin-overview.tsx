import { formatBRL } from '@firmus/shared'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { AsyncState } from '@/components/async-state'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { FeatureBlock, Panel } from '@/components/surface'
import { api } from '@/lib/api'

type Overview = {
  geradoEm: string
  cotacaoDolar: string
  clientes: { total: number; ativos: number; novosNoMes: number }
  receita: { mrrCents: number; recebidoNoMesCents: number; emAbertoCents: number }
  inadimplencia: { empresas: number; valorCents: number }
  desistencias: { noMes: number; baseInicioDoMes: number; assinaturasAtivas: number }
  custoIa: {
    noMesCents: number
    chamadas: number
    tokens: number
    porEmpresa: { companyId: string; companyName: string; cents: number }[]
  }
  margemCents: number
}

/**
 * Cartão de número. Quando ainda não há dado para aquilo, mostra traço e
 * explica o que falta — em vez de R$ 0,00 com cara de resultado.
 */
function Metric({
  label,
  value,
  hint,
  pending,
  tone = 'normal',
}: {
  label: string
  value: ReactNode
  hint?: string
  /** Texto do que falta para esse número existir. */
  pending?: string
  tone?: 'normal' | 'alerta'
}) {
  return (
    <article className="surface min-w-0 p-4">
      <p className="text-xs text-ardosia">{label}</p>

      {pending ? (
        <>
          <p className="mt-3 text-3xl leading-none font-semibold text-ardosia/40">—</p>
          <p className="mt-2 text-xs text-ardosia">{pending}</p>
        </>
      ) : (
        <>
          <p
            className={cn(
              'tabular mt-3 text-3xl leading-none font-semibold tracking-tight',
              tone === 'alerta' ? 'text-destructive' : 'text-noite',
            )}
          >
            {value}
          </p>
          {hint && <p className="mt-2 text-xs text-ardosia">{hint}</p>}
        </>
      )}
    </article>
  )
}

export function AdminOverviewPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get<Overview>('/admin/overview'),
  })

  const semAssinatura = (data?.desistencias.assinaturasAtivas ?? 0) === 0
  const semCobranca =
    semAssinatura &&
    (data?.receita.recebidoNoMesCents ?? 0) === 0 &&
    (data?.receita.emAbertoCents ?? 0) === 0
  const semIa = (data?.custoIa.chamadas ?? 0) === 0

  const churn =
    data && data.desistencias.baseInicioDoMes > 0
      ? (data.desistencias.noMes / data.desistencias.baseInicioDoMes) * 100
      : null

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Os números da Firmus Tech: quem está usando, quanto entra, quanto a IA custa e o que sobra."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/empresas">
              Ver empresas
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={false}
        empty={{ icon: Building2, title: '', description: '' }}
      >
        {data && (
          <>
            <section>
              <SectionHeading>Clientes</SectionHeading>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Metric
                  label="Empresas na plataforma"
                  value={data.clientes.total}
                  hint={`${data.clientes.novosNoMes} entraram neste mês`}
                />
                <Metric
                  label="Ativas nos últimos 30 dias"
                  value={data.clientes.ativos}
                  hint="empresas que geraram alguma coisa"
                  pending={semIa ? 'nenhum agente rodou ainda' : undefined}
                />
                <Metric
                  label="Assinaturas ativas"
                  value={data.desistencias.assinaturasAtivas}
                  pending={semAssinatura ? 'nenhuma assinatura cadastrada' : undefined}
                />
              </div>
            </section>

            <section>
              <SectionHeading>Dinheiro</SectionHeading>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Receita recorrente (MRR)"
                  value={formatBRL(data.receita.mrrCents)}
                  hint="plano anual entra dividido por 12"
                  pending={semAssinatura ? 'cadastre planos e assinaturas' : undefined}
                />
                <Metric
                  label="Recebido neste mês"
                  value={formatBRL(data.receita.recebidoNoMesCents)}
                  pending={semCobranca ? 'nenhuma fatura ainda' : undefined}
                />
                <Metric
                  label="Em aberto"
                  value={formatBRL(data.receita.emAbertoCents)}
                  pending={semCobranca ? 'nenhuma fatura ainda' : undefined}
                />
                <Metric
                  label="Inadimplentes"
                  value={`${data.inadimplencia.empresas}`}
                  hint={`${formatBRL(data.inadimplencia.valorCents)} vencidos`}
                  tone={data.inadimplencia.empresas > 0 ? 'alerta' : 'normal'}
                  pending={semCobranca ? 'nenhuma fatura ainda' : undefined}
                />
              </div>
            </section>

            <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
              <Panel>
                <SectionHeading
                  aside={
                    <span className="text-xs text-ardosia">
                      dólar a{' '}
                      {Number(data.cotacaoDolar).toLocaleString('pt-BR', {
                        minimumFractionDigits: 4,
                      })}
                    </span>
                  }
                >
                  Custo de IA neste mês
                </SectionHeading>

                {semIa ? (
                  <p className="mt-4 text-sm text-ardosia">
                    Nenhum agente rodou ainda. Quando eles começarem a trabalhar, cada chamada entra
                    aqui com o que custou — em dólar, convertido pela cotação do dia em que rodou.
                  </p>
                ) : (
                  <>
                    <p className="tabular mt-5 text-4xl leading-none font-semibold text-noite">
                      {formatBRL(data.custoIa.noMesCents)}
                    </p>
                    <p className="mt-2 text-sm text-ardosia">
                      {data.custoIa.chamadas.toLocaleString('pt-BR')} chamadas ·{' '}
                      {data.custoIa.tokens.toLocaleString('pt-BR')} tokens
                    </p>

                    {data.custoIa.porEmpresa.length > 0 && (
                      <>
                        <p className="mt-6 text-xs font-medium text-ardosia">Quem mais gastou</p>
                        <ul className="mt-2.5 divide-y divide-border">
                          {data.custoIa.porEmpresa.map((empresa) => (
                            <li
                              key={empresa.companyId}
                              className="flex items-baseline justify-between gap-4 py-2.5"
                            >
                              <span className="min-w-0 truncate text-sm text-noite">
                                {empresa.companyName}
                              </span>
                              <span className="tabular shrink-0 text-sm text-ardosia">
                                {formatBRL(empresa.cents)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}
              </Panel>

              <FeatureBlock className="flex flex-col">
                <p className="text-sm font-medium text-white/70">Margem do mês</p>
                <p className="tabular mt-6 text-4xl leading-none font-semibold tracking-tight">
                  {formatBRL(data.margemCents)}
                </p>
                <p className="mt-3 text-sm text-white/60">o que entrou menos o que a IA custou</p>

                <div className="mt-7 space-y-2 border-t border-white/15 pt-5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-white/60">Recebido</span>
                    <span className="tabular">{formatBRL(data.receita.recebidoNoMesCents)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-white/60">Custo de IA</span>
                    <span className="tabular">− {formatBRL(data.custoIa.noMesCents)}</span>
                  </div>
                </div>
              </FeatureBlock>
            </div>

            <section>
              <SectionHeading>Desistências</SectionHeading>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric
                  label="Cancelaram neste mês"
                  value={data.desistencias.noMes}
                  tone={data.desistencias.noMes > 0 ? 'alerta' : 'normal'}
                  pending={semAssinatura ? 'nenhuma assinatura cadastrada' : undefined}
                />
                <Metric
                  label="Taxa de cancelamento"
                  value={churn === null ? '—' : `${churn.toFixed(1).replace('.', ',')}%`}
                  hint={`sobre ${data.desistencias.baseInicioDoMes} que começaram o mês pagando`}
                  pending={semAssinatura ? 'nenhuma assinatura cadastrada' : undefined}
                />
              </div>
            </section>

            {semCobranca && (
              <Panel className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-sm leading-relaxed text-grafite">
                  <span className="font-semibold text-noite">
                    Os números de dinheiro estão zerados porque ainda não há cobrança.
                  </span>{' '}
                  As tabelas já existem e guardam o id da cobrança no gateway. Quando a landing page
                  de vendas estiver no ar, o webhook preenche estas mesmas linhas e o painel passa a
                  mostrar resultado sem precisar mudar nada aqui.
                </p>
              </Panel>
            )}
          </>
        )}
      </AsyncState>
    </>
  )
}
