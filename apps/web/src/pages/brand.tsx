import { AtSign, Check, Pencil, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { brandBrain } from '@/mocks/brand'

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground"
        >
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Contexto da empresa">
            <p className="text-sm leading-relaxed text-foreground">{brandBrain.context}</p>
          </Panel>

          <Panel title="Serviços">
            <Chips items={brandBrain.services} />
          </Panel>

          <Panel title="Público">
            <p className="text-sm leading-relaxed text-foreground">{brandBrain.audience}</p>
          </Panel>

          <Panel title="Diferenciais">
            <ul className="space-y-2">
              {brandBrain.differentiators.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-ciano" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Tom de voz">
            <p className="text-sm leading-relaxed text-foreground">{brandBrain.tone.summary}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-300 uppercase">
                  <Check className="size-3.5" />O que fazer
                </p>
                <ul className="mt-3 space-y-2">
                  {brandBrain.tone.dos.map((item) => (
                    <li key={item} className="text-sm text-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-destructive uppercase">
                  <X className="size-3.5" />O que evitar
                </p>
                <ul className="mt-3 space-y-2">
                  {brandBrain.tone.donts.map((item) => (
                    <li key={item} className="text-sm text-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Identidade visual">
            <p className="text-xs text-muted-foreground">Paleta do cliente</p>
            <ul className="mt-2.5 flex gap-2">
              {brandBrain.palette.map((color) => (
                <li key={color} className="flex-1">
                  <span
                    className="block h-14 rounded-lg border border-border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="tabular mt-1.5 block text-center text-[0.68rem] text-muted-foreground">
                    {color}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs text-muted-foreground">Logo</p>
            <div className="mt-2 grid h-24 place-items-center rounded-lg border border-dashed border-border bg-muted text-sm text-muted-foreground">
              nenhum logo enviado
            </div>
          </Panel>

          <Panel title="Instagram">
            <a
              href={`https://instagram.com/${brandBrain.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-sm text-ciano hover:underline"
            >
              <AtSign className="size-4" />
              {brandBrain.instagram}
            </a>
          </Panel>

          <Panel title="Perguntas frequentes">
            <ul className="space-y-4">
              {brandBrain.faq.map((item) => (
                <li key={item.q}>
                  <p className="text-sm font-medium text-gelo">{item.q}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  )
}
