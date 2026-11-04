import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from 'cn'
import { FormatBadge } from '@/components/format-badge'
import { SectionHeading } from '@/components/page-header'
import type { PlanEntry } from '@/lib/api-types'
import { addDays, dayMonth, groupByWeek, todayInSaoPaulo, weekdayShort } from '@/lib/calendar'

/** Uma pauta: formato, tema, objetivo e o caminho para criar a peça. */
function EntryCard({ entry }: { entry: PlanEntry }) {
  const criada = entry.contentItemId !== null

  return (
    <article className="rounded-lg border border-border bg-white/80 p-3 shadow-card">
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
export function PlanCalendar({ entries }: { entries: PlanEntry[] }) {
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
                          <EntryCard key={entry.id} entry={entry} />
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
