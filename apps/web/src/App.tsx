const pilares = [
  {
    titulo: 'Marca',
    texto: 'O Cérebro da Marca guarda contexto, tom de voz, público e identidade visual.',
  },
  {
    titulo: 'Auditoria',
    texto: 'Diagnóstico do Instagram e do atendimento, com prioridades e recomendações.',
  },
  {
    titulo: 'Conteúdo',
    texto: 'Planejamento, legendas, carrosséis e artes já na identidade da empresa.',
  },
  {
    titulo: 'Atendimento',
    texto: 'Atendente de IA no WhatsApp que responde, qualifica e passa para um humano.',
  },
]

export function App() {
  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-16 sm:px-8">
        <header>
          <span className="inline-flex items-center gap-2 rounded-full border border-ciano/30 bg-ciano/10 px-3 py-1 text-xs font-medium tracking-wide text-ciano uppercase">
            Firmus Tech
          </span>

          <h1 className="font-display mt-8 text-3xl leading-tight text-gelo sm:text-5xl">
            Firmus Flow
          </h1>

          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A plataforma que entende a marca da sua empresa, audita sua presença digital, gera o
            conteúdo e atende seus clientes no WhatsApp.
          </p>
        </header>

        <main className="mt-14 grid gap-4 sm:grid-cols-2">
          {pilares.map((pilar) => (
            <article
              key={pilar.titulo}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-firme"
            >
              <h2 className="text-lg font-semibold text-card-foreground">{pilar.titulo}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{pilar.texto}</p>
            </article>
          ))}
        </main>

        <footer className="mt-auto pt-14 text-sm text-muted-foreground">
          <span className="font-medium text-gelo">Em construção.</span> Mossoró, RN.
        </footer>
      </div>
    </div>
  )
}
