import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, RefreshCw, TriangleAlert } from 'lucide-react'
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
import { AsyncState } from '@/components/async-state'
import { MetaPending } from '@/components/meta-pending'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { StatStrip } from '@/components/stat-card'
import { Panel } from '@/components/surface'
import { api } from '@/lib/api'
import { useState } from 'react'
import { formatDate } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
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

type Recusada = { metrica: string; motivo: string }

export function AnalyticsPage() {
  const { company, mode } = useAuth()
  const isBoss = company?.role === 'chefe'
  const queryClient = useQueryClient()

  const { data, isPending, error } = useCompanyData<{ days: MetricDay[] }>(
    ['metrics'],
    '/metrics',
    {
      days: [],
    },
  )

  // Saber se o Instagram está ligado muda o que a tela diz: sem conexão o
  // problema é a conexão, não a Meta.
  const { data: ligacao } = useQuery({
    queryKey: ['instagram', 'connection'],
    queryFn: () => api.get<{ connection: { username: string } | null }>('/instagram/connection'),
    enabled: isBoss && mode !== 'demo',
  })

  const [recusadas, setRecusadas] = useState<Recusada[]>([])
  const [erroMeta, setErroMeta] = useState<string | null>(null)

  const atualizar = useMutation({
    mutationFn: () => api.post<{ refused: Recusada[] }>('/metrics/refresh'),
    onSuccess: async (resultado) => {
      setErroMeta(null)
      setRecusadas(resultado.refused)
      await queryClient.invalidateQueries({ queryKey: ['metrics'] })
      await queryClient.invalidateQueries({ queryKey: ['instagram'] })
    },
    onError: (e: Error) => setErroMeta(e.message),
  })

  const conectado = ligacao?.connection != null
  const last = data.days.at(-1)
  const series = data.days.map((day) => ({
    dia: formatDate(day.capturedOn),
    alcance: day.reach ?? 0,
  }))

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Métricas do perfil do Instagram, dia a dia."
        actions={
          isBoss &&
          conectado && (
            <Button
              variant="outline"
              disabled={atualizar.isPending}
              onClick={() => atualizar.mutate()}
            >
              <RefreshCw />
              {atualizar.isPending ? 'Buscando na Meta…' : 'Atualizar agora'}
            </Button>
          )
        }
      />

      {/* Só aparece quando não há conexão. Antes ele dizia "aguardando a Meta"
          mesmo com a conta ligada, o que era falso. */}
      {isBoss && !conectado && (
        <MetaPending permission="instagram_manage_insights" what="Ler as métricas do perfil" />
      )}

      {erroMeta && (
        <Panel className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="min-w-0 text-sm leading-relaxed text-grafite">
            <span className="font-semibold text-noite">Não consegui atualizar.</span>{' '}
            {erroMeta}
          </p>
        </Panel>
      )}

      {recusadas.length > 0 && (
        <Panel>
          <p className="text-sm font-semibold text-noite">
            A Meta não entregou {recusadas.length === 1 ? 'uma métrica' : 'algumas métricas'}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ardosia">
            O resto foi guardado normalmente. Em perfil recém-convertido isso é comum: o
            Instagram leva alguns dias acumulando dado, e algumas métricas só existem acima de
            100 seguidores.
          </p>
          <ul className="mt-4 space-y-2">
            {recusadas.map((r) => (
              <li key={r.metrica} className="text-sm text-grafite">
                <code className="text-noite">{r.metrica}</code> — {r.motivo}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={data.days.length === 0}
        empty={{
          icon: BarChart3,
          title: 'Nenhuma métrica ainda',
          description: conectado
            ? 'O Instagram está conectado. Clique em "Atualizar agora" para buscar o primeiro dia — e se a conta foi convertida há pouco, o Instagram ainda leva alguns dias acumulando dado.'
            : 'Conecte o Instagram da empresa em Configurações para a plataforma começar a guardar um registro por dia.',
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
            { label: 'Visualizações', value: last?.views ? number.format(last.views) : '—' },
            {
              label: 'Contas que interagiram',
              value: last?.accountsEngaged ? number.format(last.accountsEngaged) : '—',
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
