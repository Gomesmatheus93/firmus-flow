import { ArrowUpRight, Brain, CheckCheck, Contact, Gauge, MessagesSquare } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { StatCard } from '@/components/stat-card'
import {
  brandCompletion,
  engagementSeries,
  pendingApprovals,
  recentActivity,
} from '@/mocks/dashboard'
import { firstNameFrom } from '@/lib/names'
import { useAuth } from '@/providers/auth-provider'

const axisTick = { fill: 'var(--color-muted-foreground)', fontSize: 12 }

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
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">Semana de {label}</p>
      <p className="tabular mt-0.5 text-sm font-semibold text-gelo">
        {payload[0]?.value} interações
      </p>
    </div>
  )
}

export function DashboardPage() {
  const { user, company } = useAuth()
  const firstName = firstNameFrom(user?.fullName ?? '')

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description={`Como está a presença digital da ${company?.name ?? 'sua empresa'} nesta semana.`}
        badge={<SampleBadge />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Nota da auditoria"
          value="7,4"
          icon={Gauge}
          highlight
          trend={{ value: '+0,6', direction: 'up' }}
          hint="desde setembro"
        />
        <StatCard
          label="Conteúdos aprovados"
          value="12"
          icon={CheckCheck}
          trend={{ value: '3', direction: 'flat' }}
          hint="aguardando você"
        />
        <StatCard
          label="Conversas no mês"
          value="148"
          icon={MessagesSquare}
          trend={{ value: '+22%', direction: 'up' }}
          hint="vs. setembro"
        />
        <StatCard
          label="Leads captados"
          value="31"
          icon={Contact}
          trend={{ value: '+9', direction: 'up' }}
          hint="no mês"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-medium text-gelo">Interações por semana</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Curtidas, comentários, salvamentos e compartilhamentos no Instagram.
              </p>
            </div>
          </div>

          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillInteractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-ciano)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-ciano)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={axisTick} dy={6} />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} width={48} />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'var(--color-ciano)', strokeOpacity: 0.35, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="interactions"
                  stroke="var(--color-ciano)"
                  strokeWidth={2}
                  fill="url(#fillInteractions)"
                  activeDot={{
                    r: 4.5,
                    fill: 'var(--color-ciano)',
                    stroke: 'var(--color-abismo)',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass edge rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2.5">
            <Brain className="size-4 text-ciano" />
            <h2 className="text-base font-medium text-gelo">Cérebro da Marca</h2>
          </div>

          <p className="tabular halo mt-5 text-4xl leading-none font-semibold text-gelo">
            {brandCompletion.percent}%
          </p>
          <p className="mt-2 text-sm text-muted-foreground">preenchido</p>

          <Progress value={brandCompletion.percent} className="mt-4 h-1.5" />

          <p className="mt-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Ainda falta
          </p>
          <ul className="mt-2 space-y-1.5">
            {brandCompletion.missing.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                <span className="size-1 rounded-full bg-ciano" />
                {item}
              </li>
            ))}
          </ul>

          <Button asChild variant="outline" className="mt-5 w-full">
            <Link to="/marca">
              Completar
              <ArrowUpRight />
            </Link>
          </Button>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-gelo">Aguardando sua aprovação</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/aprovacoes">Ver tudo</Link>
            </Button>
          </div>

          <ul className="mt-4 divide-y divide-border">
            {pendingApprovals.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-[0.65rem] font-medium text-muted-foreground">
                  {item.date}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gelo">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="glass rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-medium text-gelo">Atividade recente</h2>

          <ul className="mt-4 space-y-4">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ciano shadow-[0_0_8px_var(--color-ciano)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gelo">
                    {item.text} <span className="text-muted-foreground">· {item.detail}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  )
}
