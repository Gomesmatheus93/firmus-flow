import { ArrowRight, Brain, CalendarDays, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { cn } from 'cn'
import { PeriodAnalytics } from '@/components/dashboard/period-analytics'
import { PlanStrip, type PlanDay } from '@/components/dashboard/plan-strip'
import { FormatBadge } from '@/components/format-badge'
import { FeatureBlock, Panel } from '@/components/surface'
import { Button } from '@/components/ui/button'
import type { ContentItem, ConversationRow, MetricsResponse, PlanEntry } from '@/lib/api-types'
import { addDays, dayMonth, startOfWeek, todayInSaoPaulo } from '@/lib/calendar'
import { formatDate } from '@/lib/dates'
import { firstNameFrom, initialsFrom } from '@/lib/names'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { BrandBrain } from './brand'

type Visao = 'semana' | 'mes'

/** Primeiro e último dia do período que contém `hoje`, como "AAAA-MM-DD". */
function periodo(visao: Visao, hoje: string): { start: string; end: string } {
  if (visao === 'semana') {
    const start = startOfWeek(hoje)
    return { start, end: addDays(start, 6) }
  }
  const [ano, mes] = hoje.split('-').map(Number) as [number, number]
  const start = `${hoje.slice(0, 8)}01`
  // Dia 0 do mês seguinte é o último dia deste.
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return { start, end: `${hoje.slice(0, 8)}${String(ultimo).padStart(2, '0')}` }
}

/** Os dias do período, cada um com as pautas dele. */
function diasDoPeriodo(start: string, end: string, entries: PlanEntry[]): PlanDay[] {
  const dias: PlanDay[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) {
    dias.push({ date: d, entries: entries.filter((e) => e.scheduledDate === d) })
  }
  return dias
}

/** Título de seção em caixa alta, com um complemento à direita. */
function Secao({ titulo, aside }: { titulo: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="label text-ardosia">{titulo}</h2>
      {aside}
    </div>
  )
}

/** "Bom dia", "Boa tarde" ou "Boa noite", pela hora de São Paulo. */
function greeting(): string {
  const hora = Number(
    new Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date()),
  )
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Quanto do Cérebro da Marca já foi preenchido, contando os campos que importam. */
function brandCompletion(brain: BrandBrain | null): { percent: number; missing: string[] } {
  if (!brain) return { percent: 0, missing: ['Tudo: o onboarding ainda não foi feito'] }

  const fields: { label: string; filled: boolean }[] = [
    { label: 'Contexto da empresa', filled: Boolean(brain.context) },
    { label: 'Serviços', filled: brain.services.length > 0 },
    { label: 'Público', filled: Boolean(brain.audience) },
    { label: 'Diferenciais', filled: brain.differentiators.length > 0 },
    { label: 'Tom de voz', filled: Boolean(brain.toneOfVoice) },
    { label: 'Paleta de cores', filled: brain.colorPalette.length > 0 },
    { label: 'Logo', filled: Boolean(brain.logoUrl) },
    { label: 'Instagram', filled: Boolean(brain.instagramHandle) },
    { label: 'Perguntas frequentes', filled: brain.faq.length > 0 },
  ]

  const filled = fields.filter((field) => field.filled).length

  return {
    percent: Math.round((filled / fields.length) * 100),
    missing: fields.filter((field) => !field.filled).map((field) => field.label),
  }
}

export function DashboardPage() {
  const { user, company } = useAuth()
  const firstName = firstNameFrom(user?.fullName ?? '')
  const [visao, setVisao] = useState<Visao>('semana')

  const hoje = todayInSaoPaulo()
  const { start, end } = periodo(visao, hoje)
  const naSemana = visao === 'semana'
  const rotuloPeriodo = naSemana ? 'nesta semana' : 'neste mês'

  const brand = useCompanyData<{ brain: BrandBrain | null }>(['brand'], '/brand', { brain: null })
  const content = useCompanyData<{ items: ContentItem[] }>(['content'], '/content', { items: [] })
  const plan = useCompanyData<{ entries: PlanEntry[] }>(['plan'], '/plan', { entries: [] })
  const metrics = useCompanyData<MetricsResponse>(['metrics'], '/metrics', {
    days: [],
    snapshot: null,
    posts: [],
    score: null,
  })
  const conversations = useCompanyData<{ conversations: ConversationRow[] }>(
    ['conversations'],
    '/conversations',
    { conversations: [] },
  )

  const completion = brandCompletion(brand.data.brain)
  const waiting = content.data.items.filter((item) => item.status === 'aguardando')
  const pecas = new Map(content.data.items.map((item) => [item.id, item]))

  const dias = diasDoPeriodo(start, end, plan.data.entries)
  const pautas = dias.flatMap((d) => d.entries)
  const criadas = pautas.filter((e) => e.contentItemId !== null).length
  const intervalo = `${dayMonth(start)} a ${dayMonth(end)}`

  return (
    <div className="mx-auto w-full max-w-[78rem] space-y-8 pt-2">
      {/* Saudação e controles */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-gradient-to-br from-azul to-ciano p-[3px]">
            <span className="grid size-16 place-items-center rounded-full border-[3px] border-white bg-noite text-lg font-semibold text-white">
              {initialsFrom(user?.fullName ?? '')}
            </span>
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-noite sm:text-4xl">
              {greeting()},{' '}
              <span className="bg-gradient-to-r from-azul to-ciano bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="mt-1 text-sm text-ardosia">
              Veja o que está acontecendo na {company?.name ?? 'sua empresa'}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Período"
            className="flex rounded-full border border-regua bg-white p-1 shadow-card"
          >
            {(
              [
                ['semana', 'Visão semanal'],
                ['mes', 'Visão mensal'],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={visao === valor}
                onClick={() => setVisao(valor)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm transition-colors',
                  visao === valor
                    ? 'bg-azul font-medium text-white'
                    : 'text-ardosia hover:text-noite',
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>
          <Button asChild className="rounded-full px-5 shadow-card">
            <Link to="/planejamento">
              <CalendarDays />
              {naSemana ? 'Planejar a semana' : 'Planejar o mês'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Planejamento do período */}
      <section className="space-y-3">
        <Secao
          titulo={`Planejamento ${naSemana ? 'da semana' : 'do mês'} (${intervalo})`}
          aside={
            <span className="text-xs text-ardosia">
              <span className="tabular font-semibold text-noite">{criadas}</span> de{' '}
              <span className="tabular">{pautas.length}</span>{' '}
              {pautas.length === 1 ? 'pauta criada' : 'pautas criadas'}
            </span>
          }
        />
        <Panel className="p-4">
          {pautas.length === 0 && !naSemana ? (
            <p className="p-6 text-center text-sm text-ardosia">
              Nenhuma pauta neste mês.{' '}
              <Link to="/planejamento" className="font-medium text-azul hover:underline">
                Fazer o planejamento
              </Link>
            </p>
          ) : (
            <PlanStrip days={dias} pecas={pecas} today={hoje} showEmptyDays={naSemana} />
          )}
        </Panel>
      </section>

      {/* Analytics do período */}
      <section className="space-y-3">
        <Secao
          titulo={`Analytics ${naSemana ? 'da semana' : 'do mês'} (${intervalo})`}
          aside={
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 text-xs font-medium text-azul hover:underline"
            >
              Ver analytics completo
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <PeriodAnalytics
          metrics={metrics.data}
          conversations={conversations.data.conversations}
          start={start}
          end={end}
          today={hoje}
          periodo={rotuloPeriodo}
        />
      </section>

      {/* O que espera decisão e o Cérebro */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-noite">Aguardando sua aprovação</h3>
            <Link
              to="/aprovacoes"
              className="inline-flex items-center gap-1 text-xs font-medium text-azul hover:underline"
            >
              Ver tudo
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {waiting.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-ardosia">
              <CheckCheck className="size-4 text-emerald-600" />
              Nada esperando aprovação.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-regua">
              {waiting.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  {item.images[0] ? (
                    <img
                      src={item.images[0]}
                      alt=""
                      className="size-10 shrink-0 rounded-lg object-cover object-top"
                    />
                  ) : (
                    <span className="size-10 shrink-0 rounded-lg bg-gelo" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-noite">
                      {item.title}
                    </span>
                    <span className="block text-xs text-ardosia">
                      {formatDate(item.createdAt)}
                      {item.authorName ? ` · ${item.authorName}` : ''}
                    </span>
                  </span>
                  <FormatBadge format={item.type} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <FeatureBlock>
          <p className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Brain className="size-4" />
            Cérebro da Marca
          </p>
          <p className="tabular mt-4 text-5xl leading-none font-bold tracking-tight">
            {completion.percent}
            <span className="text-2xl text-white/60">%</span>
          </p>
          <p className="mt-1.5 text-sm text-white/70">preenchido</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-ciano"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          {completion.missing.length > 0 && (
            <p className="mt-4 text-xs text-white/70">
              Falta: {completion.missing.slice(0, 3).join(', ')}
              {completion.missing.length > 3 ? '…' : ''}
            </p>
          )}
          <Button
            asChild
            className="mt-5 w-full rounded-full bg-white text-noite hover:bg-white/90"
          >
            <Link to="/marca">
              {completion.percent === 0 ? 'Começar' : 'Completar'}
              <ArrowRight />
            </Link>
          </Button>
        </FeatureBlock>
      </div>
    </div>
  )
}
