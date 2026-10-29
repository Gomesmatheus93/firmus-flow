import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { Panel } from '@/components/surface'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { plannedPosts } from '@/mocks/content'

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const formatTone: Record<string, string> = {
  Carrossel: 'bg-azul',
  Reels: 'bg-noite',
  'Post único': 'bg-amber-500',
}

/** Novembro de 2026 começa num domingo, então a primeira semana tem 6 vazios. */
const leadingBlanks = 6
const daysInMonth = 30

export function PlanPage() {
  const postsByDay = new Map(plannedPosts.map((post) => [post.day, post]))

  return (
    <>
      <PageHeader
        title="Planejamento"
        description="O que publicar, quando e com qual objetivo. Gerado a partir do Cérebro da Marca."
        badge={<SampleBadge />}
        actions={
          <Button>
            <Sparkles />
            Gerar planejamento
          </Button>
        }
      />

      <Panel>
        <SectionHeading
          aside={
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Mês anterior">
                <ChevronLeft />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Próximo mês">
                <ChevronRight />
              </Button>
            </div>
          }
        >
          Novembro de 2026
        </SectionHeading>

        <div className="mt-5 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-muted py-2 text-center text-[0.68rem] font-semibold text-ardosia"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`vazio-${i}`} className="min-h-24 bg-card" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const post = postsByDay.get(day)

            return (
              <div key={day} className="min-h-24 bg-card p-2">
                <span className="tabular text-xs text-ardosia">{day}</span>

                {post && (
                  <div className="mt-1.5">
                    <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-ardosia">
                      <span
                        aria-hidden
                        className={cn('size-1.5 shrink-0 rounded-full', formatTone[post.format])}
                      />
                      {post.format}
                    </span>
                    <p className="mt-1 line-clamp-3 text-[0.72rem] leading-snug text-noite">
                      {post.theme}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Panel>

      <DataTable
        caption="Lista do mês"
        rows={plannedPosts}
        rowKey={(post) => post.id}
        columns={[
          { header: 'Dia', cell: (post) => <span className="text-ardosia">{post.day}/11</span> },
          { header: 'Formato', cell: (post) => post.format, className: 'whitespace-nowrap' },
          {
            header: 'Tema',
            cell: (post) => <span className="font-medium text-noite">{post.theme}</span>,
          },
          { header: 'Objetivo', cell: (post) => <span className="text-ardosia">{post.goal}</span> },
        ]}
      />
    </>
  )
}
