import type { AuditFindings, FaqItem, ToneOfVoice } from '@firmus/shared'
import { AtSign, Brain, Check, RefreshCw, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { AsyncState } from '@/components/async-state'
import { StyleReferences } from '@/components/brand/style-references'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { Panel } from '@/components/surface'
import { useCompanyData } from '@/lib/queries'

export type BrandBrain = {
  context: string | null
  services: string[]
  audience: string | null
  differentiators: string[]
  toneOfVoice: ToneOfVoice | null
  colorPalette: string[]
  logoUrl: string | null
  instagramHandle: string | null
  faq: FaqItem[]
  auditFindings: AuditFindings | null
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel>
      <SectionHeading>{title}</SectionHeading>
      <div className="mt-4">{children}</div>
    </Panel>
  )
}

/** Mostra o texto, ou avisa que o campo ainda está em branco. */
function Filled({ value }: { value: string | null }) {
  if (!value) return <p className="text-sm text-ardosia italic">ainda não preenchido</p>
  return <p className="text-sm leading-relaxed text-grafite">{value}</p>
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ardosia italic">ainda não preenchido</p>
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-lg bg-white/60 px-2.5 py-1 text-sm text-grafite">
          {item}
        </li>
      ))}
    </ul>
  )
}

export function BrandPage() {
  const { data, isPending, error } = useCompanyData<{ brain: BrandBrain | null }>(
    ['brand'],
    '/brand',
    { brain: null },
  )

  const brain = data.brain

  return (
    <>
      <PageHeader
        title="Cérebro da Marca"
        description="Tudo que a plataforma sabe sobre a empresa. Todos os agentes leem daqui — se algo estiver errado, o conteúdo sai errado."
        actions={
          brain && (
            <Button asChild variant="outline">
              <Link to="/marca/montar">
                <RefreshCw />
                Refazer o Cérebro
              </Link>
            </Button>
          )
        }
      />

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={!brain}
        empty={{
          icon: Brain,
          title: 'Cérebro da Marca vazio',
          description:
            'O onboarding de marca é o primeiro passo: contexto, serviços, público, tom de voz, cores e Instagram. Sem isso, nenhum agente consegue escrever como a empresa.',
          action: (
            <Button asChild>
              <Link to="/marca/montar">Começar o onboarding</Link>
            </Button>
          ),
        }}
      >
        {brain && (
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
              <div className="space-y-5">
                <Block title="Contexto da empresa">
                  <Filled value={brain.context} />
                </Block>

                <Block title="Serviços">
                  <Chips items={brain.services} />
                </Block>

                <Block title="Público">
                  <Filled value={brain.audience} />
                </Block>

                <Block title="Diferenciais">
                  {brain.differentiators.length === 0 ? (
                    <p className="text-sm text-ardosia italic">ainda não preenchido</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {brain.differentiators.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm text-grafite">
                          <Check className="mt-0.5 size-4 shrink-0 text-azul" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </Block>

                <Block title="Tom de voz">
                  {!brain.toneOfVoice ? (
                    <p className="text-sm text-ardosia italic">ainda não preenchido</p>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed text-grafite">
                        {brain.toneOfVoice.summary}
                      </p>

                      <div className="mt-6 grid gap-6 sm:grid-cols-2">
                        <div>
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <Check className="size-3.5" />O que fazer
                          </p>
                          <ul className="mt-3 space-y-2 border-l-2 border-emerald-500/40 pl-3.5">
                            {brain.toneOfVoice.dos.map((item) => (
                              <li key={item} className="text-sm text-grafite">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                            <X className="size-3.5" />O que evitar
                          </p>
                          <ul className="mt-3 space-y-2 border-l-2 border-destructive/40 pl-3.5">
                            {brain.toneOfVoice.donts.map((item) => (
                              <li key={item} className="text-sm text-grafite">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </Block>
              </div>

              <div className="space-y-5">
                <Block title="Identidade visual">
                  <p className="text-xs text-ardosia">Paleta do cliente</p>
                  {brain.colorPalette.length === 0 ? (
                    <p className="mt-2 text-sm text-ardosia italic">nenhuma cor cadastrada</p>
                  ) : (
                    <ul className="mt-2.5 flex gap-1.5">
                      {brain.colorPalette.map((color) => (
                        <li key={color} className="flex-1">
                          <span
                            className="block h-12 rounded-lg border border-white/80"
                            style={{ backgroundColor: color }}
                          />
                          <span className="tabular mt-1.5 block text-center text-[0.65rem] text-ardosia">
                            {color}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="mt-6 text-xs text-ardosia">Logo</p>
                  <div className="mt-2 grid h-24 place-items-center rounded-lg border border-dashed border-white/80 bg-white/35 text-sm text-ardosia">
                    {brain.logoUrl ? (
                      <img src={brain.logoUrl} alt="Logo do cliente" className="max-h-20" />
                    ) : (
                      'nenhum logo enviado'
                    )}
                  </div>
                </Block>

                <Block title="Instagram">
                  {brain.instagramHandle ? (
                    <a
                      href={`https://instagram.com/${brain.instagramHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-azul hover:underline"
                    >
                      <AtSign className="size-4" />
                      {brain.instagramHandle}
                    </a>
                  ) : (
                    <p className="text-sm text-ardosia italic">ainda não preenchido</p>
                  )}
                </Block>

                <Block title="Perguntas frequentes">
                  {brain.faq.length === 0 ? (
                    <p className="text-sm text-ardosia italic">nenhuma pergunta cadastrada</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {brain.faq.map((item, index) => (
                        <li key={item.question} className={index === 0 ? 'pb-3' : 'py-3 last:pb-0'}>
                          <p className="text-sm font-medium text-noite">{item.question}</p>
                          <p className="mt-1 text-sm text-ardosia">{item.answer}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Block>
              </div>
            </div>

            <StyleReferences />
          </div>
        )}
      </AsyncState>
    </>
  )
}
