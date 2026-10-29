import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Fica direto sobre o fundo tingido: sem barra branca, sem borda. */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="shadow-card rounded-full border-0 bg-card lg:hidden"
        onClick={onMenu}
        aria-label="Abrir menu"
      >
        <Menu />
      </Button>

      <div className="relative ml-auto">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ardosia" />
        <input
          type="search"
          placeholder="Buscar"
          aria-label="Buscar"
          className="shadow-card h-10 w-36 rounded-full bg-card pr-4 pl-10 text-sm text-foreground outline-none placeholder:text-ardosia focus-visible:ring-[3px] focus-visible:ring-azul/25 sm:w-64"
        />
      </div>

      <Button
        variant="outline"
        size="icon"
        className="shadow-card rounded-full border-0 bg-card"
        aria-label="Notificações"
      >
        <Bell />
      </Button>

      <Button className="rounded-full px-5">
        <Sparkles />
        <span className="hidden sm:inline">Gerar conteúdo</span>
      </Button>
    </div>
  )
}
