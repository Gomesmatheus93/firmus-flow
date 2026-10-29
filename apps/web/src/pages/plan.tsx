import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { plannedPosts } from '@/mocks/content'

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const formatTone: Record<string, string> = {
  Carrossel: 'border-ciano/30 bg-ciano/10 text-ciano',
  Reels: 'border-firme/40 bg-firme/20 text-[#9db8ff]',
  'Post único': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
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
          <Button className="bg-linear-to-r from-firme to-ciano text-gelo shadow-lg shadow-firme/25 hover:opacity-90">
            <Sparkles />
            Gerar planejamento
          </Button>
        }
      />

      <section className="glass rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-gelo">Novembro de 2026</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Mês anterior">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Próximo mês">
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="pb-1 text-center text-[0.68rem] font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const post = postsByDay.get(day)

            return (
              <div
                key={day}
                className={cn(
                  'min-h-24 rounded-lg border p-2 transition-colors',
                  post
                    ? 'border-border bg-muted hover:border-ciano/40'
                    : 'border-border/50 bg-transparent',
                )}
              >
                <span className="tabular text-xs text-muted-foreground">{day}</span>

                {post && (
                  <div className="mt-1.5">
                    <span
                      className={cn(
                        'inline-block rounded border px-1.5 py-0.5 text-[0.62rem] font-medium',
                        formatTone[post.format],
                      )}
                    >
                      {post.format}
                    </span>
                    <p className="mt-1.5 line-clamp-3 text-[0.72rem] leading-snug text-foreground">
                      {post.theme}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="glass rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-medium text-gelo">Lista do mês</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="pb-2.5 font-semibold">Dia</th>
                <th className="pb-2.5 font-semibold">Formato</th>
                <th className="pb-2.5 font-semibold">Tema</th>
                <th className="pb-2.5 font-semibold">Objetivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plannedPosts.map((post) => (
                <tr key={post.id}>
                  <td className="py-3 text-muted-foreground">{post.day}/11</td>
                  <td className="py-3 whitespace-nowrap text-foreground">{post.format}</td>
                  <td className="py-3 text-gelo">{post.theme}</td>
                  <td className="py-3 text-muted-foreground">{post.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
