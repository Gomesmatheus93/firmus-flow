import { contentStatusLabel, type ContentStatus } from '@firmus/shared'
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCheck,
  Contact,
  Gauge,
  GalleryHorizontalEnd,
  Layers,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { FormatBadge } from '@/components/format-badge'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { StatStrip } from '@/components/stat-card'
import { FeatureBlock, Panel } from '@/components/surface'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/dates'
import { firstNameFrom } from '@/lib/names'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { BrandBrain } from './brand'
import type { ContentItem, ConversationRow, LeadRow } from '@/lib/api-types'

const funnelStages: { status: ContentStatus; color: string }[] = [
  { status: 'rascunho', color: 'bg-slate-300' },
  { status: 'aguardando', color: 'bg-amber-400' },
  { status: 'ajustar', color: 'bg-rose-400' },
  { status: 'aprovado', color: 'bg-emerald-500' },
]

/** Atalhos do Painel: navegação, não dado, então podem ser fixos. */
const shortcuts: { label: string; hint: string; to: string; icon: LucideIcon }[] = [
  {
    label: 'Criar carrossel',
    hint: 'Uma peça nova com a marca',
    to: '/criar/carrossel',
    icon: GalleryHorizontalEnd,
  },
  { label: 'Planejamento', hint: 'A pauta da semana', to: '/planejamento', icon: CalendarDays },
  { label: 'Conversas', hint: 'O atendimento no WhatsApp', to: '/conversas', icon: MessagesSquare },
  { label: 'Analytics', hint: 'Como o Instagram está indo', to: '/analytics', icon: BarChart3 },
]

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

  const brand = useCompanyData<{ brain: BrandBrain | null }>(['brand'], '/brand', { brain: null })
  const content = useCompanyData<{ items: ContentItem[] }>(['content'], '/content', { items: [] })
  const leads = useCompanyData<{ leads: LeadRow[] }>(['leads'], '/leads', { leads: [] })
  const conversations = useCompanyData<{ conversations: ConversationRow[] }>(
    ['conversations'],
    '/conversations',
    { conversations: [] },
  )

  const completion = brandCompletion(brand.data.brain)
  const audit = brand.data.brain?.auditFindings ?? null
  const waiting = content.data.items.filter((item) => item.status === 'aguardando')

  const funnel = funnelStages.map((stage) => ({
    ...stage,
    count: content.data.items.filter((item) => item.status === stage.status).length,
  }))
  const funnelTotal = content.data.items.length

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName} 👋`}
        description={`Veja o que está acontecendo na ${company?.name ?? 'sua empresa'} hoje.`}
      />

      <StatStrip
        stats={[
          {
            label: 'Nota da auditoria',
            value: audit ? audit.overallScore.toLocaleString('pt-BR') : '—',
            hint: audit ? 'última análise' : 'auditoria não rodou',
            icon: Gauge,
            accent: true,
          },
          {
            label: 'Conteúdos criados',
            value: String(funnelTotal),
            hint: waiting.length > 0 ? `${waiting.length} aguardando você` : 'nada na fila',
            icon: Layers,
          },
          {
            label: 'Conversas',
            value: String(conversations.data.conversations.length),
            hint: 'no WhatsApp',
            icon: MessagesSquare,
          },
          {
            label: 'Leads captados',
            value: String(leads.data.leads.length),
            hint: 'no total',
            icon: Contact,
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <SectionHeading
              aside={<span className="text-xs text-ardosia">{funnelTotal} peças no total</span>}
            >
              Funil de conteúdo
            </SectionHeading>

            {/* Uma barra só, dividida pelas etapas, e a legenda embaixo. */}
            <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-gelo">
              {funnelTotal > 0 &&
                funnel.map((stage) => (
                  <div
                    key={stage.status}
                    className={stage.color}
                    style={{ width: `${(stage.count / funnelTotal) * 100}%` }}
                  />
                ))}
            </div>

            <ol className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {funnel.map((stage) => (
                <li key={stage.status} className="min-w-0">
                  <p className="flex items-center gap-2 text-xs text-ardosia">
                    <span className={`size-2 shrink-0 rounded-full ${stage.color}`} />
                    {contentStatusLabel[stage.status]}
                  </p>
                  <p className="tabular mt-1.5 text-2xl leading-none font-bold text-noite">
                    {stage.count}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel padded={false}>
            <div className="p-5 pb-3">
              <SectionHeading
                aside={
                  <Link
                    to="/aprovacoes"
                    className="inline-flex items-center gap-1 text-xs font-medium text-azul hover:underline"
                  >
                    Ver tudo
                    <ArrowRight className="size-3.5" />
                  </Link>
                }
              >
                Aguardando sua aprovação
              </SectionHeading>
            </div>

            {waiting.length === 0 ? (
              <p className="flex items-center gap-2 px-5 pb-5 text-sm text-ardosia">
                <CheckCheck className="size-4 text-emerald-600" />
                Nada esperando aprovação.
              </p>
            ) : (
              <div className="data-table-wrap px-1 pb-2">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Peça</th>
                      <th>Formato</th>
                      <th>Criada em</th>
                      <th>Por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waiting.slice(0, 6).map((item) => (
                      <tr key={item.id}>
                        <td data-label="Peça" className="max-w-0 truncate font-medium text-noite">
                          {item.title}
                        </td>
                        <td data-label="Formato">
                          <FormatBadge format={item.type} />
                        </td>
                        <td data-label="Criada em" className="text-ardosia">
                          {formatDate(item.createdAt)}
                        </td>
                        <td data-label="Por" className="text-ardosia">
                          {item.authorName ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel>
            <SectionHeading>Atalhos</SectionHeading>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {shortcuts.map((atalho) => (
                <li key={atalho.to}>
                  <Link
                    to={atalho.to}
                    className="group flex items-center gap-3 rounded-xl border border-regua px-3 py-2.5 transition-colors hover:border-azul/40 hover:bg-gelo"
                  >
                    <span className="icon-chip size-9">
                      <atalho.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-noite">
                        {atalho.label}
                      </span>
                      <span className="block truncate text-xs text-ardosia">{atalho.hint}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ardosia transition-transform group-hover:translate-x-0.5 group-hover:text-azul" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <FeatureBlock>
            <p className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Brain className="size-4" />
              Cérebro da Marca
            </p>

            <p className="tabular mt-5 text-5xl leading-none font-bold tracking-tight">
              {completion.percent}
              <span className="text-2xl text-white/60">%</span>
            </p>
            <p className="mt-1.5 text-sm text-white/70">preenchido</p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-ciano"
                style={{ width: `${completion.percent}%` }}
              />
            </div>

            {completion.missing.length > 0 && (
              <>
                <p className="mt-6 text-xs font-medium text-white/60">Ainda falta</p>
                <ul className="mt-2 space-y-1.5 text-sm text-white/90">
                  {completion.missing.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            <Button
              asChild
              className="mt-6 w-full rounded-full bg-white text-noite hover:bg-white/90"
            >
              <Link to="/marca">
                {completion.percent === 0 ? 'Começar' : 'Completar'}
                <ArrowRight />
              </Link>
            </Button>
          </FeatureBlock>
        </div>
      </div>
    </>
  )
}
