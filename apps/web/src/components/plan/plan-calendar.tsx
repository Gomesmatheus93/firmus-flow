import { contentStatusLabel, type ContentStatus } from '@firmus/shared'
import { Check, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from 'cn'
import { FormatBadge, formatStyle } from '@/components/format-badge'
import type { ContentItem, PlanEntry } from '@/lib/api-types'
import { dayMonth, groupByWeek, todayInSaoPaulo, weekdayShort } from '@/lib/calendar'

/** A cor do ponto de cada situação da peça, igual à do selo de status. */
const pontoStatus: Record<ContentStatus, string> = {
  rascunho: 'bg-ardosia',
  aguardando: 'bg-azul',
  ajustar: 'bg-amber-500',
  aprovado: 'bg-emerald-500',
  rejeitado: 'bg-red-500',
}

/**
 * Uma pauta, compacta: formato e tema no alto, a arte da peça embaixo, o
 * objetivo guardado em "detalhes" e a situação no pé. Sem peça ainda, o card
 * fica só com o texto e o caminho para criar.
 */
function EntryCard({ entry, peca }: { entry: PlanEntry; peca: ContentItem | undefined }) {
  const capa = peca?.images[0]
  const total = peca?.images.length ?? 0
  // Toda arte na mesma proporção, para os cards de um dia não ficarem desiguais;
  // o story é cortado embaixo, e abre inteiro na peça.
  const Icone = formatStyle[entry.format].icon
  const link = `/criar/${entry.format}`

  return (
    <article className="rounded-xl border border-regua bg-white p-2.5 shadow-card">
      <FormatBadge format={entry.format} className="px-1.5 py-0 text-[0.65rem]" />
      <h4 className="mt-1.5 text-xs leading-snug font-semibold text-noite">{entry.theme}</h4>

      {peca && (
        <div className="mt-2 overflow-hidden rounded-lg border border-regua bg-gelo">
          <Link to={link} aria-label={`Abrir a peça ${peca.title}`} className="relative block">
            {capa ? (
              <img
                src={capa}
                alt={`Capa de ${peca.title}`}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-top"
              />
            ) : (
              <span className="grid aspect-[4/5] w-full place-items-center">
                <Icone className="size-5 text-ardosia/40" />
              </span>
            )}
            {total > 1 && (
              <span className="tabular absolute top-1.5 right-1.5 rounded-full bg-noite/75 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
                {total} {entry.format === 'story' ? 'quadros' : 'slides'}
              </span>
            )}
          </Link>
          <Link
            to={link}
            className="flex items-center gap-1 bg-white px-2 py-1.5 text-[0.7rem] font-medium text-emerald-700 hover:underline"
          >
            <Check className="size-3" />
            criada · abrir
          </Link>
        </div>
      )}

      {entry.goal && (
        <details className="group mt-2">
          <summary className="flex cursor-pointer list-none items-center gap-0.5 text-[0.7rem] text-ardosia hover:text-noite [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
            detalhes
          </summary>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-grafite">{entry.goal}</p>
        </details>
      )}

      <div className="mt-1.5 space-y-1 text-[0.7rem]">
        {peca && (
          <p className="flex items-center gap-1.5 text-ardosia">
            <span className={cn('size-1.5 shrink-0 rounded-full', pontoStatus[peca.status])} />
            {contentStatusLabel[peca.status]}
          </p>
        )}
        {!peca && (
          <Link
            to={link}
            className="inline-flex items-center gap-1 font-medium text-azul hover:underline"
          >
            <Sparkles className="size-3" />
            criar {entry.format === 'reel' ? 'roteiro' : 'peça'}
          </Link>
        )}
      </div>
    </article>
  )
}

/**
 * As pautas num calendário contínuo de segunda a domingo, uma linha por
 * semana, com um resumo em cima.
 *
 * Em tela larga, sete colunas. Em tela estreita, os dias viram uma lista e os
 * dias vazios somem: rolar por cinco "sem pauta" no celular não ajuda ninguém.
 */
export function PlanCalendar({
  entries,
  pecas,
}: {
  entries: PlanEntry[]
  /** As peças da empresa, pelo id, para o card mostrar a arte. */
  pecas: Map<string, ContentItem>
}) {
  const semanas = groupByWeek(entries)
  const hoje = todayInSaoPaulo()
  const criadas = entries.filter((e) => e.contentItemId !== null).length

  return (
    <div className="space-y-3">
      <p className="text-sm text-ardosia">
        <span className="tabular font-medium text-noite">{entries.length}</span>{' '}
        {entries.length === 1 ? 'pauta' : 'pautas'} ·{' '}
        <span className="tabular font-medium text-noite">{criadas}</span>{' '}
        {criadas === 1 ? 'peça criada' : 'peças criadas'} · abra uma peça pela arte ou crie a que
        falta
      </p>

      <div className="space-y-3">
        {semanas.map((semana) => (
          <ol
            key={semana.start}
            aria-label={`Semana de ${dayMonth(semana.start)}`}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7"
          >
            {semana.days.map((dia) => {
              const vazio = dia.entries.length === 0
              const ehHoje = dia.date === hoje

              return (
                <li
                  key={dia.date}
                  className={cn(
                    'min-w-0 rounded-2xl border bg-white/60 p-2',
                    ehHoje ? 'border-azul/60' : 'border-regua',
                    vazio && 'hidden lg:block',
                  )}
                >
                  <p
                    className={cn(
                      'px-1 pt-0.5 pb-2 text-xs',
                      ehHoje ? 'font-semibold text-azul' : 'text-ardosia',
                    )}
                  >
                    {weekdayShort(dia.date)} <span className="tabular">{dayMonth(dia.date)}</span>
                    {ehHoje && ' · hoje'}
                  </p>

                  {!vazio && (
                    <div className="space-y-2">
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
        ))}
      </div>
    </div>
  )
}
