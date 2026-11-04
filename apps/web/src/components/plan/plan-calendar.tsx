import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from 'cn'
import { FormatBadge } from '@/components/format-badge'
import { SectionHeading } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import type { ContentItem, PlanEntry } from '@/lib/api-types'
import { addDays, dayMonth, groupByWeek, todayInSaoPaulo, weekdayShort } from '@/lib/calendar'

/**
 * Uma pauta: formato, tema, objetivo e o caminho para criar a peça. Quando a
 * peça já existe e tem imagem, a capa dela aparece no topo do card: é o post
 * que vai sair naquele dia.
 */
function EntryCard({ entry, peca }: { entry: PlanEntry; peca: ContentItem | undefined }) {
  const criada = entry.contentItemId !== null
  const capa = peca?.images[0]

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white/80 shadow-card">
      {capa && (
        <Link
          to={`/criar/${entry.format}`}
          aria-label={`Abrir a peça ${peca.title}`}
          className="relative block"
        >
          <img
            src={capa}
            alt={`Capa de ${peca.title}`}
            loading="lazy"
            className={cn(
              'w-full object-cover',
              entry.format === 'story' || entry.format === 'reel'
                ? 'aspect-[9/16]'
                : 'aspect-[4/5]',
            )}
          />
          {peca.images.length > 1 && (
            <span className="tabular absolute right-1.5 bottom-1.5 rounded-full bg-noite/75 px-1.5 py-0.5 text-[0.65rem] font-medium text-white">
              {peca.images.length} slides
            </span>
          )}
        </Link>
      )}
      <div className="p-3">
        <FormatBadge format={entry.format} />
        <h4 className="mt-2 text-sm leading-snug font-medium text-noite">{entry.theme}</h4>
        {entry.goal && (
          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ardosia">{entry.goal}</p>
        )}

        <div className="mt-3 border-t border-border pt-2.5">
          {criada ? (
            <Link
              to={`/criar/${entry.format}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline"
            >
              <Check className="size-3.5" />
              Peça criada
            </Link>
          ) : (
            <Link
              to={`/criar/${entry.format}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-azul hover:underline"
            >
              Criar {entry.format === 'reel' ? 'roteiro' : 'peça'}
              <ArrowRight className="size-3.5" />
            </Link>
          )}
          {peca && (
            <div className="mt-2">
              <StatusBadge status={peca.status} className="max-w-full whitespace-normal" />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/**
 * As pautas em semanas de segunda a domingo.
 *
 * Em tela larga, sete colunas lado a lado. Em tela estreita, os dias viram uma
 * lista e os dias vazios somem: rolar por cinco "nada aqui" no celular não
 * ajuda ninguém.
 */
export function PlanCalendar({
  entries,
  pecas,
}: {
  entries: PlanEntry[]
  /** As peças da empresa, pelo id, para o card mostrar a capa. */
  pecas: Map<string, ContentItem>
}) {
  const semanas = groupByWeek(entries)
  const hoje = todayInSaoPaulo()

  return (
    <div className="space-y-8">
      {semanas.map((semana) => {
        const total = semana.days.reduce((soma, dia) => soma + dia.entries.length, 0)

        return (
          <section key={semana.start} aria-label={`Semana de ${dayMonth(semana.start)}`}>
            <SectionHeading
              aside={
                <span className="tabular text-xs text-ardosia">
                  {total} {total === 1 ? 'pauta' : 'pautas'}
                </span>
              }
            >
              Semana de {dayMonth(semana.start)} a {dayMonth(addDays(semana.start, 6))}
            </SectionHeading>

            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {semana.days.map((dia) => {
                const vazio = dia.entries.length === 0
                const ehHoje = dia.date === hoje

                return (
                  <li
                    key={dia.date}
                    className={cn(
                      'min-w-0 rounded-xl border border-border/70 bg-white/40 p-2.5',
                      vazio && 'hidden lg:block',
                    )}
                  >
                    <p
                      className={cn(
                        'label px-0.5 pb-2.5',
                        ehHoje ? 'text-azul' : 'text-ardosia/80',
                      )}
                    >
                      {weekdayShort(dia.date)} <span className="tabular">{dayMonth(dia.date)}</span>
                      {ehHoje && ' · hoje'}
                    </p>

                    {vazio ? (
                      <p className="px-0.5 text-xs text-ardosia/60">Sem pauta</p>
                    ) : (
                      <div className="space-y-2.5">
                        {dia.entries.map((entry) => (
                          <EntryCard
                            key={entry.id}
                            entry={entry}
                            peca={entry.contentItemId ? pecas.get(entry.contentItemId) : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
