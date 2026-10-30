import { contentStatusLabel, type ContentStatus } from '@firmus/shared'
import { ArrowRight, Brain, CheckCheck } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { StatStrip } from '@/components/stat-card'
import { FeatureBlock, Panel } from '@/components/surface'
import { Button } from '@/components/ui/button'
import { firstNameFrom } from '@/lib/names'
import { useCompanyData } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { BrandBrain } from './brand'
import type { ContentItem, ConversationRow, LeadRow } from '@/lib/api-types'

const funnelStages: ContentStatus[] = ['rascunho', 'aguardando', 'ajustar', 'aprovado']

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

  const funnel = funnelStages.map((status) => ({
    status,
    count: content.data.items.filter((item) => item.status === status).length,
  }))
  const funnelTotal = content.data.items.length

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description={`O que está acontecendo na ${company?.name ?? 'sua empresa'}.`}
      />

      <StatStrip
        stats={[
          {
            label: 'Nota da auditoria',
            value: audit ? audit.overallScore.toLocaleString('pt-BR') : '—',
            hint: audit ? 'última análise' : 'auditoria não rodou',
            accent: true,
          },
          {
            label: 'Conteúdos criados',
            value: String(funnelTotal),
            hint: waiting.length > 0 ? `${waiting.length} aguardando você` : 'nada na fila',
          },
          {
            label: 'Conversas',
            value: String(conversations.data.conversations.length),
            hint: 'no WhatsApp',
          },
          { label: 'Leads captados', value: String(leads.data.leads.length), hint: 'no total' },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Panel>
          <SectionHeading
            aside={<span className="text-xs text-ardosia">{funnelTotal} peças no total</span>}
          >
            Funil de conteúdo
          </SectionHeading>

          <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {funnel.map((stage) => (
              <li key={stage.status} className="rounded-xl bg-white/55 p-4">
                <p className="text-xs text-ardosia">{contentStatusLabel[stage.status]}</p>
                <p className="tabular mt-3 text-2xl leading-none font-semibold text-noite">
                  {stage.count}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/70">
                  <div
                    className="h-full rounded-full bg-azul"
                    style={{ width: `${funnelTotal ? (stage.count / funnelTotal) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6">
            <SectionHeading
              aside={
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                  <Link to="/aprovacoes">Ver tudo</Link>
                </Button>
              }
            >
              Aguardando sua aprovação
            </SectionHeading>

            {waiting.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-ardosia">
                <CheckCheck className="size-4 text-emerald-600" />
                Nada esperando aprovação.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {waiting.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-white/55 px-3.5 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-noite">{item.title}</span>
                    <span className="shrink-0 text-xs text-ardosia">{item.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <FeatureBlock className="flex flex-col">
          <p className="flex items-center gap-2 text-sm font-medium text-white/70">
            <Brain className="size-4" />
            Cérebro da Marca
          </p>

          <p className="tabular mt-6 text-5xl leading-none font-semibold tracking-tight">
            {completion.percent}
            <span className="text-2xl text-white/50">%</span>
          </p>
          <p className="mt-2 text-sm text-white/60">preenchido</p>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-ciano"
              style={{ width: `${completion.percent}%` }}
            />
          </div>

          {completion.missing.length > 0 && (
            <>
              <p className="mt-7 text-xs font-medium text-white/50">Ainda falta</p>
              <ul className="mt-2.5 space-y-1.5 text-sm text-white/85">
                {completion.missing.slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}

          <Button
            asChild
            className="mt-7 w-full rounded-full bg-white text-noite hover:bg-white/90"
          >
            <Link to="/marca">
              {completion.percent === 0 ? 'Começar' : 'Completar'}
              <ArrowRight />
            </Link>
          </Button>
        </FeatureBlock>
      </div>
    </>
  )
}
