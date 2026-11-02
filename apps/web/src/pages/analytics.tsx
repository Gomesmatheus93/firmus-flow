import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Award,
  BarChart3,
  Bookmark,
  Eye,
  ExternalLink,
  Heart,
  Info,
  MapPin,
  MessageCircle,
  MousePointerClick,
  Phone,
  RefreshCw,
  Repeat2,
  Send,
  Stethoscope,
  TrendingUp,
  TriangleAlert,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { AsyncState } from '@/components/async-state'
import {
  BarList,
  BlockEmpty,
  ChartCard,
  IconTile,
  InstagramGlyph,
  MetricCard,
  TintCard,
} from '@/components/analytics/blocks'
import { InstagramConnection } from '@/components/instagram-connection'
import { SectionHeading } from '@/components/page-header'
import { Panel } from '@/components/surface'
import { Button } from '@/components/ui/button'
import {
  Tooltip as Dica,
  TooltipContent as DicaConteudo,
  TooltipTrigger as DicaGatilho,
} from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import type { AnalyticsPost, MetricsResponse } from '@/lib/api-types'
import { formatDate, formatDateTime, formatDayMonth } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'

const inteiro = new Intl.NumberFormat('pt-BR')
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

const fmt = (n: number | null | undefined) => (n == null ? null : compacto.format(n))
const soma = (valores: (number | null)[]) =>
  valores.some((v) => v !== null) ? valores.reduce<number>((s, v) => s + (v ?? 0), 0) : null

const axisTick = { fill: 'var(--color-ardosia)', fontSize: 12 }

/** Os nomes que a Meta dá aos botões de contato, em português. */
const BOTOES: Record<string, string> = {
  CALL: 'Ligações',
  DIRECTION: 'Direções',
  EMAIL: 'E-mail',
  TEXT: 'Mensagem',
  BOOK_NOW: 'Agendar',
  INSTANT_EXPERIENCE: 'Experiência instantânea',
  UNDEFINED: 'Outros',
}

const GENEROS: Record<string, string> = { F: 'Mulheres', M: 'Homens', U: 'Não informado' }

const META_30D = 'Últimos 30 dias'

function ChartTooltip({
  active,
  payload,
  label,
  unidade,
}: {
  active?: boolean
  payload?: { value?: number | string }[]
  label?: string | number
  unidade: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="shadow-float rounded-xl bg-card px-3 py-2">
      <p className="text-xs text-ardosia">{label}</p>
      <p className="tabular mt-0.5 text-sm font-semibold text-noite">
        {typeof payload[0]?.value === 'number'
          ? inteiro.format(payload[0].value)
          : payload[0]?.value}{' '}
        {unidade}
      </p>
    </div>
  )
}

type Recusada = { metrica: string; motivo: string }

const vazio: MetricsResponse = { days: [], snapshot: null, posts: [], score: null }

export function AnalyticsPage() {
  const { company, mode } = useAuth()
  const isBoss = company?.role === 'chefe'
  const queryClient = useQueryClient()

  const { data, isPending, error } = useCompanyData<MetricsResponse>(['metrics'], '/metrics', vazio)

  // Saber se o Instagram está ligado muda o que a tela diz: sem conexão o
  // problema é a conexão, não a Meta.
  const { data: ligacao } = useQuery({
    queryKey: ['instagram', 'connection'],
    queryFn: () => api.get<{ connection: { username: string } | null }>('/instagram/connection'),
    enabled: isBoss && mode !== 'demo',
  })

  const [recusadas, setRecusadas] = useState<Recusada[] | null>(null)
  const [erroMeta, setErroMeta] = useState<string | null>(null)
  const [diagnostico, setDiagnostico] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)

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

  const desconectar = useMutation({
    mutationFn: () => api.delete('/instagram/connection'),
    onSuccess: async () => {
      setConfirmarSaida(false)
      await queryClient.invalidateQueries({ queryKey: ['instagram'] })
      toast.success('Instagram desconectado.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const conectado = ligacao?.connection != null
  const retrato = data.snapshot
  // O que a última atualização recusou; antes de atualizar, o que ficou guardado.
  const recusas = recusadas ?? retrato?.refused ?? []

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <IconTile icon={InstagramGlyph} tom="instagram" />
          <div className="min-w-0">
            <h1 className="text-lg leading-tight font-semibold text-grafite">
              Analytics Instagram
            </h1>
            <p className="text-sm text-ardosia">
              {retrato
                ? `Painel de desempenho · atualizado em ${formatDateTime(retrato.fetchedAt)}`
                : 'Painel de desempenho do perfil, direto da Meta'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {(retrato || erroMeta) && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setDiagnostico((d) => !d)}
            >
              <Stethoscope />
              Diagnosticar
            </Button>
          )}
          {isBoss && conectado && (
            <>
              <Button
                variant="outline"
                className="rounded-full text-red-600 hover:text-red-700"
                disabled={desconectar.isPending}
                onClick={() => (confirmarSaida ? desconectar.mutate() : setConfirmarSaida(true))}
                onBlur={() => setConfirmarSaida(false)}
              >
                {confirmarSaida ? 'Confirmar desconexão' : 'Desconectar'}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={atualizar.isPending}
                onClick={() => atualizar.mutate()}
              >
                <RefreshCw className={atualizar.isPending ? 'animate-spin' : undefined} />
                {atualizar.isPending ? 'Atualizando…' : 'Atualizar'}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Sem conexão, o Analytics vazio é o lugar onde o chefe procura como
          ligar o Instagram — então a conexão aparece aqui mesmo, e não só em
          Configurações. Espera a consulta responder para não piscar o
          formulário para quem já está conectado. */}
      {isBoss && ligacao && !conectado && (
        <section className="space-y-3">
          <SectionHeading>Conectar o Instagram</SectionHeading>
          <p className="max-w-2xl text-sm leading-relaxed text-ardosia">
            Ligue a conta profissional da empresa para a plataforma começar a guardar as métricas.
            Também dá para fazer isso em Configurações → Instagram.
          </p>
          <InstagramConnection />
        </section>
      )}

      {erroMeta && (
        <Panel className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="min-w-0 text-sm leading-relaxed text-grafite">
            <span className="font-semibold text-noite">Não consegui atualizar.</span> {erroMeta}
          </p>
        </Panel>
      )}

      {diagnostico && <Diagnostico recusas={recusas} fetchedAt={retrato?.fetchedAt ?? null} />}

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={!retrato}
        empty={{
          icon: BarChart3,
          title: 'Nenhuma métrica ainda',
          description: conectado
            ? 'O Instagram está conectado. Clique em "Atualizar" para buscar os números na Meta — e se a conta foi convertida há pouco, o Instagram ainda leva alguns dias acumulando dado.'
            : isBoss
              ? 'Conecte o Instagram da empresa logo acima para a plataforma começar a buscar as métricas.'
              : 'Quando o chefe conectar o Instagram da empresa, as métricas passam a aparecer aqui.',
        }}
      >
        {retrato && <Painel retrato={retrato} posts={data.posts} score={data.score} />}
      </AsyncState>
    </>
  )
}

/** O que a Meta recusou na última coleta, com o motivo dela. */
function Diagnostico({ recusas, fetchedAt }: { recusas: Recusada[]; fetchedAt: string | null }) {
  return (
    <Panel>
      <p className="text-sm font-semibold text-noite">
        {recusas.length === 0
          ? 'A Meta entregou todas as métricas pedidas.'
          : `A Meta não entregou ${recusas.length === 1 ? 'uma métrica' : `${recusas.length} métricas`}`}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ardosia">
        {fetchedAt && <>Última coleta em {formatDateTime(fetchedAt)}. </>}O resto foi guardado
        normalmente. Em perfil recém-convertido isso é comum: o Instagram leva alguns dias
        acumulando dado, e público, horários e seguidores novos só existem acima de 100 seguidores.
        Impressões, visitas ao perfil e cliques no site saíram da API da Meta em 2025.
      </p>
      {recusas.length > 0 && (
        <ul className="mt-4 space-y-2">
          {recusas.map((r) => (
            <li key={r.metrica} className="text-sm text-grafite">
              <code className="text-noite">{r.metrica}</code> — {r.motivo}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

type Retrato = NonNullable<MetricsResponse['snapshot']>

function Painel({
  retrato,
  posts,
  score,
}: {
  retrato: Retrato
  posts: AnalyticsPost[]
  score: number | null
}) {
  const { profile, totals, contactTaps } = retrato

  const novos = retrato.newFollowersByDay.length
    ? retrato.newFollowersByDay.reduce((s, p) => s + p.value, 0)
    : totals.follows
  const visitasNosPosts = soma(posts.map((p) => p.profileVisits))

  const interacoesPorTipo = [
    { label: 'Curtidas', value: totals.likes },
    { label: 'Comentários', value: totals.comments },
    { label: 'Compartilhamentos', value: totals.shares },
    { label: 'Salvos', value: totals.saves },
    { label: 'Respostas', value: totals.replies },
    { label: 'Repostagens', value: totals.reposts },
  ].filter((i): i is { label: string; value: number } => i.value !== null)

  const toques = Object.entries(contactTaps)
    .map(([tipo, value]) => ({ label: BOTOES[tipo] ?? tipo, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6">
      <Perfil profile={profile} />

      <ScoreCard posts={posts} score={score} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Seguidores"
          value={fmt(profile.followers)}
          icon={Users}
          tom="roxo"
          destaque={
            novos != null && (
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="size-3.5" />+{inteiro.format(novos)} nos últimos 30d
              </span>
            )
          }
          nota={novos == null ? 'Ganho do mês só acima de 100 seguidores' : 'Hoje'}
        />
        <MetricCard
          label="Alcance total"
          value={fmt(totals.reach)}
          icon={UserCheck}
          tom="instagram"
          nota="Soma diária · 30 dias"
        />
        <MetricCard
          label="Visualizações"
          value={fmt(totals.views)}
          icon={TrendingUp}
          tom="laranja"
          nota="Substituiu as impressões"
        />
        <MetricCard
          label="Visitas ao perfil"
          value={fmt(visitasNosPosts)}
          icon={Eye}
          tom="azul"
          nota={`Vindas dos últimos ${posts.length} posts`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Toques nos botões"
          value={fmt(totals.profileLinksTaps)}
          icon={MousePointerClick}
          tom="violeta"
          nota={META_30D}
        />
        <MetricCard
          label="Ligações"
          value={totals.profileLinksTaps == null ? null : fmt(contactTaps.CALL ?? 0)}
          icon={Phone}
          tom="verde"
          nota={META_30D}
        />
        <MetricCard
          label="Direções"
          value={totals.profileLinksTaps == null ? null : fmt(contactTaps.DIRECTION ?? 0)}
          icon={MapPin}
          tom="ambar"
          nota={META_30D}
        />
        <MetricCard
          label="Interações totais"
          value={fmt(totals.interactions)}
          icon={Activity}
          tom="rosa"
          nota={META_30D}
        />
        <MetricCard
          label="Contas engajadas"
          value={fmt(totals.accountsEngaged)}
          icon={Users}
          tom="azul"
          nota={META_30D}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Curtidas"
          value={fmt(totals.likes)}
          icon={Heart}
          tom="rosa"
          nota={META_30D}
        />
        <MetricCard
          label="Comentários"
          value={fmt(totals.comments)}
          icon={MessageCircle}
          tom="azul"
          nota={META_30D}
        />
        <MetricCard
          label="Compartilhamentos"
          value={fmt(totals.shares)}
          icon={Send}
          tom="ciano"
          nota={META_30D}
        />
        <MetricCard
          label="Salvos"
          value={fmt(totals.saves)}
          icon={Bookmark}
          tom="ambar"
          nota={META_30D}
        />
        <MetricCard
          label="Começaram a seguir"
          value={fmt(totals.follows)}
          icon={UserPlus}
          tom="verde"
          nota={META_30D}
        />
        <MetricCard
          label="Deixaram de seguir"
          value={fmt(totals.unfollows)}
          icon={UserMinus}
          tom="laranja"
          nota={META_30D}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Alcance por dia" subtitle={META_30D} className="lg:col-span-2">
          {retrato.reachByDay.length === 0 ? (
            <BlockEmpty>A Meta ainda não entregou o alcance diário desta conta.</BlockEmpty>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={retrato.reachByDay.map((p) => ({
                    dia: formatDayMonth(`${p.date}T12:00:00Z`),
                    valor: p.value,
                  }))}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillAlcance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-regua)" />
                  <XAxis
                    dataKey="dia"
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    dy={8}
                    minTickGap={16}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    width={48}
                    tickFormatter={(v: number) => compacto.format(v)}
                  />
                  <Tooltip content={<ChartTooltip unidade="de alcance" />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fill="url(#fillAlcance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Novos seguidores" subtitle={META_30D}>
          {retrato.newFollowersByDay.length === 0 ? (
            <BlockEmpty>
              A Meta só informa seguidores novos por dia em conta com 100 seguidores ou mais.
            </BlockEmpty>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={retrato.newFollowersByDay.map((p) => ({
                    dia: formatDayMonth(`${p.date}T12:00:00Z`),
                    valor: p.value,
                  }))}
                  margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--color-regua)" />
                  <XAxis
                    dataKey="dia"
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    dy={8}
                    minTickGap={16}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    width={32}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ChartTooltip unidade="novos" />}
                    cursor={{ fill: 'var(--color-gelo)' }}
                  />
                  <Bar dataKey="valor" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Interações por tipo" subtitle={META_30D}>
          {interacoesPorTipo.length === 0 ? (
            <BlockEmpty>A Meta não entregou as interações desta conta.</BlockEmpty>
          ) : (
            <BarList items={interacoesPorTipo} format={(n) => inteiro.format(n)} cor="#ec4899" />
          )}
        </ChartCard>

        <ChartCard title="Contatos pelo perfil" subtitle="Toques nos botões · 30 dias">
          {toques.length === 0 ? (
            <BlockEmpty>
              Nenhum toque nos botões de contato do perfil no período. Os botões (ligar, e-mail,
              rota) se configuram no app do Instagram, em Editar perfil.
            </BlockEmpty>
          ) : (
            <BarList items={toques} format={(n) => inteiro.format(n)} cor="#059669" />
          )}
        </ChartCard>
      </div>

      <Publico retrato={retrato} />

      <PostsRecentes posts={posts} />
    </div>
  )
}

function Perfil({ profile }: { profile: Retrato['profile'] }) {
  return (
    <TintCard className="overflow-hidden">
      <div
        aria-hidden
        className="h-24"
        style={{
          backgroundImage: 'linear-gradient(90deg,#e9d5ff,#fbcfe8 45%,#fed7aa 60%,#e9d5ff)',
        }}
      />
      <div className="px-5 pb-5">
        <div className="-mt-10 size-[4.5rem] overflow-hidden rounded-full border-4 border-white bg-gelo shadow-card">
          {profile.profilePictureUrl ? (
            <img
              src={profile.profilePictureUrl}
              alt=""
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="grid size-full place-items-center text-xl font-semibold text-ardosia">
              {profile.username.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="mt-3 text-lg font-semibold text-grafite">
          {profile.name ?? profile.username}
        </h2>
        <p className="text-sm text-ardosia">@{profile.username}</p>
        {profile.biography && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-grafite">
            {profile.biography}
          </p>
        )}
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block max-w-full truncate text-sm font-medium text-azul hover:underline"
          >
            {profile.website.replace(/^https?:\/\//, '')}
          </a>
        )}
        <dl className="mt-4 flex gap-6">
          {(
            [
              ['Seguidores', profile.followers],
              ['Seguindo', profile.follows],
              ['Posts', profile.mediaCount],
            ] as const
          ).map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dd className="tabular text-base font-bold text-grafite">{fmt(valor) ?? '—'}</dd>
              <dt className="text-xs text-ardosia">{rotulo}</dt>
            </div>
          ))}
        </dl>
      </div>
    </TintCard>
  )
}

function ScoreCard({ posts, score }: { posts: AnalyticsPost[]; score: number | null }) {
  const comScore = posts.filter((p): p is AnalyticsPost & { score: number } => p.score !== null)
  const melhor = comScore.reduce<(typeof comScore)[number] | null>(
    (m, p) => (m === null || p.score > m.score ? p : m),
    null,
  )
  // As barras vão do post mais antigo ao mais novo, como uma linha do tempo.
  const barras = [...posts].reverse()
  const maior = Math.max(1, ...comScore.map((p) => p.score))

  return (
    <section
      className="min-w-0 rounded-2xl border border-emerald-200/70 p-5 shadow-card"
      style={{ backgroundImage: 'linear-gradient(100deg,#cfdcd8,#e3ebee 45%,#eef4f8)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile icon={Zap} tom="verde" />
          <div>
            <h2 className="text-base font-semibold text-grafite">Score de Engajamento</h2>
            <p className="text-xs text-ardosia">
              Média de {comScore.length} {comScore.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>
        <Dica>
          <DicaGatilho asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs text-ardosia"
            >
              <Info className="size-3.5" /> Fórmula
            </button>
          </DicaGatilho>
          <DicaConteudo className="max-w-xs text-left leading-relaxed">
            Por post: (curtidas + comentários + compartilhamentos + salvos) ÷ alcance × 100. O score
            da conta é a média dos últimos posts. Ou seja: quantas interações a cada 100 pessoas
            alcançadas.
          </DicaConteudo>
        </Dica>
      </div>

      {score === null ? (
        <p className="mt-6 text-sm text-ardosia">
          Sem alcance por post ainda, não há como calcular. Publique e atualize em alguns dias.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 items-end gap-6 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <p className="tabular text-4xl leading-none font-bold text-emerald-500">
              {decimal.format(score)}
            </p>
            <p className="mt-2 text-xs text-ardosia">pts / 100 alcance</p>
          </div>

          {melhor && (
            <div className="flex min-w-0 items-center gap-3">
              <Thumb post={melhor} className="size-12 rounded-lg" />
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.14em] text-ardosia uppercase">
                  <Award className="size-3" /> Melhor post
                </p>
                <p className="truncate text-sm text-grafite">{melhor.caption ?? 'Sem legenda'}</p>
                <p className="tabular text-sm font-bold text-emerald-500">
                  {decimal.format(melhor.score)} pts
                </p>
              </div>
              {melhor.permalink && (
                <a
                  href={melhor.permalink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir o melhor post no Instagram"
                  className="ml-auto shrink-0 text-ardosia hover:text-grafite"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          )}

          <div
            className="flex h-16 items-end gap-1.5"
            aria-label="Score de cada post, do mais antigo ao mais novo"
          >
            {barras.map((p) => (
              <div
                key={p.igMediaId}
                title={`${formatDate(p.postedAt)} · ${p.score === null ? 'sem alcance' : `${decimal.format(p.score)} pts`}`}
                className="min-w-0 flex-1 rounded-t-sm bg-emerald-500"
                style={{
                  height: `${Math.max(6, ((p.score ?? 0) / maior) * 100)}%`,
                  opacity: p.score === null ? 0.25 : 1,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Publico({ retrato }: { retrato: Retrato }) {
  const { audience, onlineByHour } = retrato
  const totalGenero = audience?.gender.reduce((s, g) => s + g.value, 0) ?? 0
  const pico = onlineByHour?.reduce((m, h) => (h.value > m.value ? h : m), onlineByHour[0]!)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCard title="Cidades dos seguidores" subtitle="Este mês">
        {audience?.city.length ? (
          <BarList
            items={audience.city.slice(0, 6).map((c) => ({ label: c.key, value: c.value }))}
            format={(n) => inteiro.format(n)}
          />
        ) : (
          <BlockEmpty>A Meta só mostra o público em conta com 100 seguidores ou mais.</BlockEmpty>
        )}
      </ChartCard>

      <ChartCard title="Idade e gênero" subtitle="Este mês">
        {audience && (audience.age.length || audience.gender.length) ? (
          <div className="space-y-5">
            {totalGenero > 0 && (
              <div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-gelo">
                  {audience.gender.map((g, i) => (
                    <div
                      key={g.key}
                      style={{
                        width: `${(g.value / totalGenero) * 100}%`,
                        backgroundColor: ['#ec4899', '#0ea5e9', '#94a3b8'][i] ?? '#94a3b8',
                      }}
                    />
                  ))}
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ardosia">
                  {audience.gender.map((g) => (
                    <li key={g.key}>
                      {GENEROS[g.key] ?? g.key}{' '}
                      <span className="tabular font-semibold text-grafite">
                        {Math.round((g.value / totalGenero) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <BarList
              items={[...audience.age]
                .sort((a, b) => a.key.localeCompare(b.key))
                .map((a) => ({ label: `${a.key} anos`, value: a.value }))}
              format={(n) => inteiro.format(n)}
              cor="#f97316"
            />
          </div>
        ) : (
          <BlockEmpty>A Meta só mostra o público em conta com 100 seguidores ou mais.</BlockEmpty>
        )}
      </ChartCard>

      <ChartCard
        title="Seguidores online"
        subtitle={pico ? `Pico às ${pico.hour}h` : 'Por hora do dia'}
      >
        {onlineByHour ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={onlineByHour.map((h) => ({ hora: `${h.hour}h`, valor: h.value }))}
                margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="hora"
                  tickLine={false}
                  axisLine={false}
                  tick={axisTick}
                  interval={5}
                />
                <YAxis hide />
                <Tooltip
                  content={<ChartTooltip unidade="online" />}
                  cursor={{ fill: 'var(--color-gelo)' }}
                />
                <Bar dataKey="valor" fill="#a855f7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <BlockEmpty>
            A Meta só informa o horário dos seguidores em conta com 100 seguidores ou mais.
          </BlockEmpty>
        )}
      </ChartCard>
    </div>
  )
}

function Thumb({ post, className }: { post: AnalyticsPost; className?: string }) {
  return post.thumbnailUrl ? (
    <img
      src={post.thumbnailUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`shrink-0 bg-gelo object-cover ${className ?? ''}`}
    />
  ) : (
    <span className={`grid shrink-0 place-items-center bg-gelo text-ardosia ${className ?? ''}`}>
      <InstagramGlyph className="size-5" />
    </span>
  )
}

function PostsRecentes({ posts }: { posts: AnalyticsPost[] }) {
  return (
    <ChartCard title="Posts recentes" subtitle={`Os últimos ${posts.length} do feed`}>
      {posts.length === 0 ? (
        <BlockEmpty>A Meta não devolveu nenhum post do feed desta conta.</BlockEmpty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-6">
          {posts.map((p) => (
            <li
              key={p.igMediaId}
              className="min-w-0 overflow-hidden rounded-xl border border-regua bg-white"
            >
              <a href={p.permalink ?? undefined} target="_blank" rel="noreferrer" className="block">
                <Thumb post={p} className="aspect-square w-full" />
              </a>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2 text-xs text-ardosia">
                  <span>{formatDate(p.postedAt)}</span>
                  <span className="rounded-full bg-gelo px-2 py-0.5">
                    {p.mediaProductType === 'REELS'
                      ? 'Reels'
                      : p.mediaType === 'CAROUSEL_ALBUM'
                        ? 'Carrossel'
                        : p.mediaType === 'VIDEO'
                          ? 'Vídeo'
                          : 'Foto'}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-grafite">
                  {p.caption ?? 'Sem legenda'}
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  {(
                    [
                      [Heart, 'Curtidas', p.likes],
                      [MessageCircle, 'Comentários', p.comments],
                      [Bookmark, 'Salvos', p.saves],
                      [Repeat2, 'Compart.', p.shares],
                      [Eye, 'Alcance', p.reach],
                      [UserCheck, 'Visitas ao perfil', p.profileVisits],
                    ] as const
                  ).map(([Icone, rotulo, valor]) => (
                    <div key={rotulo} className="min-w-0" title={rotulo}>
                      <dt className="sr-only">{rotulo}</dt>
                      <dd className="tabular flex items-center gap-1 text-grafite">
                        <Icone className="size-3.5 shrink-0 text-ardosia" />
                        {fmt(valor) ?? '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 border-t border-regua pt-2 text-xs text-ardosia">
                  Score{' '}
                  <span className="tabular font-bold text-emerald-600">
                    {p.score === null ? '—' : `${decimal.format(p.score)} pts`}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
