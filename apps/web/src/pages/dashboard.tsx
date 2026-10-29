import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { StatStrip } from '@/components/stat-card'
import { FeatureBlock, Panel } from '@/components/surface'
import { firstNameFrom } from '@/lib/names'
import {
  brandCompletion,
  engagementSeries,
  pendingApprovals,
  recentActivity,
} from '@/mocks/dashboard'
import { captions, designs, statusLabel, type ContentStatus } from '@/mocks/content'
import { useAuth } from '@/providers/auth-provider'

const axisTick = { fill: 'var(--color-ardosia)', fontSize: 12 }

const funnelStages: ContentStatus[] = ['rascunho', 'aguardando', 'ajustar', 'aprovado']

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
      <p className="text-xs text-ardosia">Semana de {label}</p>
      <p className="tabular mt-0.5 text-sm font-semibold text-noite">
        {payload[0]?.value} interações
      </p>
    </div>
  )
}

export function DashboardPage() {
  const { user, company } = useAuth()
  const firstName = firstNameFrom(user?.fullName ?? '')

  const pipeline = [...captions, ...designs]
  const funnel = funnelStages.map((status) => ({
    status,
    count: pipeline.filter((item) => item.status === status).length,
  }))
  const funnelTotal = pipeline.length

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description={`Como está a presença digital da ${company?.name ?? 'sua empresa'} nesta semana.`}
        badge={<SampleBadge />}
      />

      <StatStrip
        stats={[
          {
            label: 'Nota da auditoria',
            value: '7,4',
            trend: '0,6',
            hint: 'desde setembro',
            accent: true,
          },
          { label: 'Conteúdos aprovados', value: '12', hint: '3 aguardando você' },
          { label: 'Conversas no mês', value: '148', trend: '22%', hint: 'vs. setembro' },
          { label: 'Leads captados', value: '31', trend: '9', hint: 'no mês' },
        ]}
      />

      <Panel>
        <SectionHeading
          aside={<span className="text-xs text-ardosia">{funnelTotal} peças no total</span>}
        >
          Funil de conteúdo
        </SectionHeading>

        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {funnel.map((stage) => (
            <li key={stage.status} className="rounded-xl bg-muted p-4">
              <p className="text-xs text-ardosia">{statusLabel[stage.status]}</p>
              <p className="tabular mt-3 text-2xl leading-none font-semibold text-noite">
                {stage.count}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-card">
                <div
                  className="h-full rounded-full bg-azul"
                  style={{ width: `${funnelTotal ? (stage.count / funnelTotal) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
        <Panel>
          <SectionHeading
            aside={
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-noite">
                8 semanas
              </span>
            }
          >
            Interações por semana
          </SectionHeading>
          <p className="mt-2 text-sm text-ardosia">
            Curtidas, comentários, salvamentos e compartilhamentos no Instagram.
          </p>

          <div className="mt-6 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillInteractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-azul)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-azul)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-regua)" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={axisTick} dy={8} />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} width={48} />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'var(--color-ardosia)', strokeOpacity: 0.3, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="interactions"
                  stroke="var(--color-azul)"
                  strokeWidth={2.5}
                  fill="url(#fillInteractions)"
                  activeDot={{
                    r: 4,
                    fill: 'var(--color-azul)',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <FeatureBlock className="flex flex-col">
          <p className="text-sm font-medium text-white/70">Cérebro da Marca</p>

          <p className="tabular mt-6 text-5xl leading-none font-semibold tracking-tight">
            {brandCompletion.percent}
            <span className="text-2xl text-white/50">%</span>
          </p>
          <p className="mt-2 text-sm text-white/60">preenchido</p>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-ciano"
              style={{ width: `${brandCompletion.percent}%` }}
            />
          </div>

          <p className="mt-7 text-xs font-medium text-white/50">Ainda falta</p>
          <ul className="mt-2.5 space-y-1.5 text-sm text-white/85">
            {brandCompletion.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <Button
            asChild
            className="mt-7 w-full rounded-full bg-white text-noite hover:bg-white/90"
          >
            <Link to="/marca">
              Completar
              <ArrowRight />
            </Link>
          </Button>
        </FeatureBlock>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <SectionHeading
            aside={
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                <Link to="/aprovacoes">Ver tudo</Link>
              </Button>
            }
          >
            Aguardando sua aprovação
          </SectionHeading>

          <ul className="mt-4 space-y-2">
            {pendingApprovals.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl bg-muted px-3.5 py-3">
                <span className="tabular shrink-0 rounded-lg bg-card px-2 py-1 text-xs text-ardosia">
                  {item.date}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-noite">{item.title}</span>
                <span className="shrink-0 text-xs text-ardosia">{item.type}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionHeading>Atividade recente</SectionHeading>

          <ul className="mt-4 space-y-3.5">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex items-baseline gap-3">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-azul" />
                <span className="min-w-0 flex-1 text-sm text-noite">
                  {item.text} <span className="text-ardosia">· {item.detail}</span>
                </span>
                <span className="shrink-0 text-xs text-ardosia">{item.when}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
