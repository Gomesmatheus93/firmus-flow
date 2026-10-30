import { BarChart3 } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AsyncState } from '@/components/async-state'
import { MetaPending } from '@/components/meta-pending'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { StatStrip } from '@/components/stat-card'
import { Panel } from '@/components/surface'
import { formatDate } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import type { MetricDay } from '@/lib/api-types'

const axisTick = { fill: 'var(--color-ardosia)', fontSize: 12 }

const number = new Intl.NumberFormat('pt-BR')

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value?: number | string }[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="shadow-float rounded-xl bg-card px-3 py-2">
      <p className="text-xs text-ardosia">{label}</p>
      <p className="tabular mt-0.5 text-sm font-semibold text-noite">
        {payload[0]?.value} de alcance
      </p>
    </div>
  )
}

export function AnalyticsPage() {
  const { data, isPending, error } = useCompanyData<{ days: MetricDay[] }>(
    ['metrics'],
    '/metrics',
    {
      days: [],
    },
  )

  const last = data.days.at(-1)
  const series = data.days.map((day) => ({
    dia: formatDate(day.capturedOn),
    alcance: day.reach ?? 0,
  }))

  return (
    <>
      <PageHeader title="Analytics" description="Métricas do perfil do Instagram, dia a dia." />

      <MetaPending permission="instagram_manage_insights" what="Ler as métricas do perfil" />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.days.length === 0}
        empty={{
          icon: BarChart3,
          title: 'Nenhuma métrica ainda',
          description:
            'Assim que a conta for aprovada pela Meta, a plataforma passa a guardar um registro por dia e o histórico aparece aqui.',
        }}
      >
        <StatStrip
          stats={[
            {
              label: 'Seguidores',
              value: last?.followers ? number.format(last.followers) : '—',
              accent: true,
            },
            { label: 'Alcance', value: last?.reach ? number.format(last.reach) : '—' },
            {
              label: 'Visitas ao perfil',
              value: last?.profileViews ? number.format(last.profileViews) : '—',
            },
            {
              label: 'Interações',
              value: last?.interactions ? number.format(last.interactions) : '—',
            },
          ]}
        />

        <Panel>
          <SectionHeading>Alcance por dia</SectionHeading>
          <div className="mt-6 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillAlcance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-azul)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-azul)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-regua)" />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={axisTick} dy={8} />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="alcance"
                  stroke="var(--color-azul)"
                  strokeWidth={2.5}
                  fill="url(#fillAlcance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </AsyncState>
    </>
  )
}
