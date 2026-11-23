import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from 'cn'
import { FormatBadge, formatStyle } from '@/components/format-badge'
import type { ContentItem, PlanEntry } from '@/lib/api-types'
import { dayMonth, weekdayShort } from '@/lib/calendar'

/** Um dia do período: a data e as pautas dele (pode não ter nenhuma). */
export type PlanDay = { date: string; entries: PlanEntry[] }

/** Um cartão de pauta: dia, formato, tema, objetivo, a capa da peça e o estado. */
function EntryCard({
  date,
  entry,
  peca,
  hoje,
}: {
  date: string
  entry: PlanEntry | null
  peca: ContentItem | undefined
  hoje: boolean
}) {
  const quando = hoje ? 'Hoje' : `${weekdayShort(date).toLowerCase()} ${dayMonth(date)}`
  const capa = peca?.images[0]
  const Icone = entry ? formatStyle[entry.format].icon : null

  return (
    <article
      className={cn(
        'flex w-48 shrink-0 flex-col rounded-2xl border bg-white p-3 transition-colors',
        hoje ? 'border-azul shadow-[0_8px_24px_-12px_rgb(28_140_255/0.6)]' : 'border-regua',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-xs', hoje ? 'font-semibold text-azul' : 'text-ardosia')}>
          {quando}
        </span>
        {entry && <FormatBadge format={entry.format} className="px-1.5 text-[0.65rem]" />}
      </div>

      {entry ? (
        <>
          <h3 className="mt-2 line-clamp-3 min-h-[3.75rem] text-[0.8rem] leading-snug font-semibold text-noite">
            {entry.theme}
          </h3>
          {entry.goal && (
            <p className="mt-1.5 line-clamp-2 text-[0.7rem] leading-snug text-azul">{entry.goal}</p>
          )}

          <Link
            to={`/criar/${entry.format}`}
            className="mt-3 block overflow-hidden rounded-xl bg-gelo"
            aria-label={peca ? `Abrir a peça ${peca.title}` : `Criar a peça de ${quando}`}
          >
            {capa ? (
              <img
                src={capa}
                alt={`Capa de ${peca.title}`}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-top"
              />
            ) : (
              <span className="grid aspect-[4/5] w-full place-items-center">
                {Icone && <Icone className="size-6 text-ardosia/40" />}
              </span>
            )}
          </Link>

          <div className="mt-auto pt-2.5 text-[0.7rem]">
            {entry.contentItemId ? (
              <Link
                to={`/criar/${entry.format}`}
                className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
              >
                <Check className="size-3" />
                criada · abrir
              </Link>
            ) : (
              <Link
                to={`/criar/${entry.format}`}
                className="inline-flex items-center gap-1 font-medium text-azul hover:underline"
              >
                criar {entry.format === 'reel' ? 'roteiro' : 'peça'}
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </>
      ) : (
        <div className="mt-2 grid flex-1 place-items-center rounded-xl border border-dashed border-regua px-3 py-10 text-center">
          <p className="text-xs text-ardosia">Sem pauta neste dia</p>
        </div>
      )}
    </article>
  )
}

/**
 * As pautas do período em cartões lado a lado, rolando para o lado. Na semana,
 * um cartão por dia, até nos dias vazios. No mês, só os dias com pauta.
 */
export function PlanStrip({
  days,
  pecas,
  today,
  showEmptyDays,
}: {
  days: PlanDay[]
  pecas: Map<string, ContentItem>
  today: string
  showEmptyDays: boolean
}) {
  const cartoes = days.flatMap((dia): { date: string; entry: PlanEntry | null }[] =>
    dia.entries.length > 0
      ? dia.entries.map((entry) => ({ date: dia.date, entry }))
      : showEmptyDays
        ? [{ date: dia.date, entry: null }]
        : [],
  )

  return (
    <ol className="flex gap-3 overflow-x-auto pb-2">
      {cartoes.map(({ date, entry }) => (
        <li key={entry?.id ?? date} className="flex">
          <EntryCard
            date={date}
            entry={entry}
            peca={entry?.contentItemId ? pecas.get(entry.contentItemId) : undefined}
            hoje={date === today}
          />
        </li>
      ))}
    </ol>
  )
}
