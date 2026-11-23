import { Eye, Heart, MessagesSquare, Users, type LucideIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '@/components/surface'
import type { ConversationRow, MetricsResponse } from '@/lib/api-types'
import { dayMonth } from '@/lib/calendar'

const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const inteiro = new Intl.NumberFormat('pt-BR')

/** Número para o cartão: compacto acima de 10 mil, e "—" quando a Meta não entregou. */
const mostrar = (n: number | null) =>
  n === null ? '—' : n >= 10_000 ? compacto.format(n) : inteiro.format(n)

/** Soma os valores, ou `null` se nenhum veio: sem dado não é zero. */
function somar(valores: (number | null)[]): number | null {
  const reais = valores.filter((v): v is number => v !== null)
  return reais.length === 0 ? null : reais.reduce((a, b) => a + b, 0)
}

/** Como a Meta chama o tipo de mídia, e como a tela mostra. */
const NOME_FORMATO: Record<string, string> = {
  IMAGE: 'Imagem',
  CAROUSEL_ALBUM: 'Carrossel',
  VIDEO: 'Reels',
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}) {
  return (
    <Panel className="flex min-h-36 flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="label pt-1 text-ardosia">{label}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-azul text-white shadow-[0_8px_18px_-8px_rgb(28_140_255/0.8)]">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="tabular mt-2 text-3xl leading-none font-bold tracking-tight text-noite">
        {value}
      </p>
      <p className="mt-2 text-xs text-ardosia">{hint}</p>
    </Panel>
  )
}

/**
 * Os números do Instagram e do WhatsApp no período escolhido: os quatro
 * cartões, o alcance de cada dia e o alcance médio por formato de post.
 * Tudo vem da api; o que a Meta não entregou aparece como "—".
 */
export function PeriodAnalytics({
  metrics,
  conversations,
  start,
  end,
  today,
  periodo,
}: {
  metrics: MetricsResponse
  conversations: ConversationRow[]
  start: string
  end: string
  today: string
  /** "nesta semana" ou "neste mês", para as legendas. */
  periodo: string
}) {
  const dentro = (data: string) => data >= start && data <= end

  const dias = metrics.days.filter((d) => dentro(d.capturedOn))
  const ultimoComSeguidores = [...dias].reverse().find((d) => d.followers !== null)
  const primeiroComSeguidores = dias.find((d) => d.followers !== null)
  const seguidores = ultimoComSeguidores?.followers ?? metrics.snapshot?.profile.followers ?? null
  const ganho =
    ultimoComSeguidores && primeiroComSeguidores && ultimoComSeguidores !== primeiroComSeguidores
      ? ultimoComSeguidores.followers! - primeiroComSeguidores.followers!
      : null

  // O alcance por dia vem do retrato da Meta; sem ele, da coleta diária.
  const alcancePorDia =
    metrics.snapshot && metrics.snapshot.reachByDay.length > 0
      ? metrics.snapshot.reachByDay
          .filter((p) => dentro(p.date))
          .map((p) => ({ date: p.date, value: p.value as number | null }))
      : dias.map((d) => ({ date: d.capturedOn, value: d.reach }))
  const alcance = somar(alcancePorDia.map((p) => p.value))
  const interacoes = somar(dias.map((d) => d.interactions))

  const conversas = conversations.filter(
    (c) => c.lastMessageAt && dentro(c.lastMessageAt.slice(0, 10)),
  ).length

  const posts = metrics.posts.filter((p) => dentro(p.postedAt.slice(0, 10)))
  const porFormato = Object.entries(
    posts.reduce<Record<string, { soma: number; n: number }>>((acc, p) => {
      if (p.reach === null) return acc
      const nome = NOME_FORMATO[p.mediaType] ?? p.mediaType
      acc[nome] = { soma: (acc[nome]?.soma ?? 0) + p.reach, n: (acc[nome]?.n ?? 0) + 1 }
      return acc
    }, {}),
  )
    .map(([nome, { soma, n }]) => ({ nome, media: Math.round(soma / n) }))
    .sort((a, b) => b.media - a.media)
  const maiorMedia = Math.max(1, ...porFormato.map((f) => f.media))

  const ateHoje = today < end ? today : end

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Seguidores"
          value={mostrar(seguidores)}
          hint={
            ganho !== null
              ? `${ganho >= 0 ? '+' : ''}${inteiro.format(ganho)} ${periodo}`
              : seguidores === null
                ? 'Instagram sem dados ainda'
                : 'total no perfil'
          }
          icon={Users}
        />
        <MetricCard
          label={`Alcance ${periodo}`}
          value={mostrar(alcance)}
          hint={`soma de ${dayMonth(start)} até ${dayMonth(ateHoje)}`}
          icon={Eye}
        />
        <MetricCard
          label={`Interações ${periodo}`}
          value={mostrar(interacoes)}
          hint="curtidas, comentários, salvos e compartilhamentos"
          icon={Heart}
        />
        <MetricCard
          label="Conversas no WhatsApp"
          value={inteiro.format(conversas)}
          hint={`com mensagem ${periodo}`}
          icon={MessagesSquare}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          <h3 className="text-sm font-semibold text-noite">Alcance por dia</h3>
          <p className="text-xs text-ardosia">contas alcançadas {periodo}</p>
          {alcancePorDia.some((p) => p.value !== null) ? (
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={alcancePorDia.map((p) => ({ dia: dayMonth(p.date), valor: p.value ?? 0 }))}
                  margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--color-regua)" />
                  <XAxis
                    dataKey="dia"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-ardosia)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--color-ardosia)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--color-gelo)' }}
                    formatter={(v) => [inteiro.format(Number(v)), 'alcance']}
                  />
                  <Bar dataKey="valor" fill="var(--color-azul)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-gelo p-5 text-center text-sm text-ardosia">
              Sem alcance {periodo} ainda. Os números chegam quando o Instagram está conectado e o
              Analytics é atualizado.
            </p>
          )}
        </Panel>

        <Panel>
          <h3 className="text-sm font-semibold text-noite">Alcance médio por formato</h3>
          <p className="text-xs text-ardosia">
            {posts.length} {posts.length === 1 ? 'post publicado' : 'posts publicados'} {periodo}
          </p>
          {porFormato.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {porFormato.map((f) => (
                <li key={f.nome}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-grafite">{f.nome}</span>
                    <span className="tabular font-semibold text-noite">
                      {inteiro.format(f.media)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gelo">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-azul to-ciano"
                      style={{ width: `${(f.media / maiorMedia) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl bg-gelo p-5 text-center text-sm text-ardosia">
              Nenhum post publicado {periodo} com alcance medido.
            </p>
          )}
        </Panel>
      </div>
    </div>
  )
}
