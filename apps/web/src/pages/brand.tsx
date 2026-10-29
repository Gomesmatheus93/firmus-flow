import { AtSign, Check, Pencil, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/surface'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { brandBrain } from '@/mocks/brand'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel>
      <SectionHeading>{title}</SectionHeading>
      <div className="mt-4">{children}</div>
    </Panel>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-lg bg-muted px-2.5 py-1 text-sm text-grafite">
          {item}
        </li>
      ))}
    </ul>
  )
}

export function BrandPage() {
  return (
    <>
      <PageHeader
        title="Cérebro da Marca"
        description="Tudo que a plataforma sabe sobre a empresa. Todos os agentes leem daqui — se algo estiver errado, o conteúdo sai errado."
        badge={<SampleBadge />}
        actions={
          <Button variant="outline">
            <Pencil />
            Editar
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Block title="Contexto da empresa">
            <p className="text-sm leading-relaxed text-grafite">{brandBrain.context}</p>
          </Block>

          <Block title="Serviços">
            <Chips items={brandBrain.services} />
          </Block>

          <Block title="Público">
            <p className="text-sm leading-relaxed text-grafite">{brandBrain.audience}</p>
          </Block>

          <Block title="Diferenciais">
            <ul className="space-y-2.5">
              {brandBrain.differentiators.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-grafite">
                  <Check className="mt-0.5 size-4 shrink-0 text-azul" />
                  {item}
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Tom de voz">
            <p className="text-sm leading-relaxed text-grafite">{brandBrain.tone.summary}</p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Check className="size-3.5" />O que fazer
                </p>
                <ul className="mt-3 space-y-2 border-l-2 border-emerald-500/40 pl-3.5">
                  {brandBrain.tone.dos.map((item) => (
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
                  {brandBrain.tone.donts.map((item) => (
                    <li key={item} className="text-sm text-grafite">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Block>
        </div>

        <div className="space-y-6">
          <Block title="Identidade visual">
            <p className="text-xs text-ardosia">Paleta do cliente</p>
            <ul className="mt-2.5 flex gap-1.5">
              {brandBrain.palette.map((color) => (
                <li key={color} className="flex-1">
                  <span
                    className="block h-12 rounded-lg border border-border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="tabular mt-1.5 block text-center text-[0.65rem] text-ardosia">
                    {color}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs text-ardosia">Logo</p>
            <div className="mt-2 grid h-24 place-items-center rounded-lg border border-dashed border-border text-sm text-ardosia">
              nenhum logo enviado
            </div>
          </Block>

          <Block title="Instagram">
            <a
              href={`https://instagram.com/${brandBrain.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-azul hover:underline"
            >
              <AtSign className="size-4" />
              {brandBrain.instagram}
            </a>
          </Block>

          <Block title="Perguntas frequentes">
            <ul className="divide-y divide-border">
              {brandBrain.faq.map((item, index) => (
                <li key={item.q} className={index === 0 ? 'pb-3' : 'py-3 last:pb-0'}>
                  <p className="text-sm font-medium text-noite">{item.q}</p>
                  <p className="mt-1 text-sm text-ardosia">{item.a}</p>
                </li>
              ))}
            </ul>
          </Block>
        </div>
      </div>
    </>
  )
}
