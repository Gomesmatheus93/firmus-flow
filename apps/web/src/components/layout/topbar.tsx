import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { currentCompany } from '@/mocks/session'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-border bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenu}
          aria-label="Abrir menu"
        >
          <Menu />
        </Button>

        <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 sm:flex">
          <span className="size-1.5 rounded-full bg-ciano shadow-[0_0_8px_var(--color-ciano)]" />
          <span className="text-sm text-muted-foreground">{currentCompany.name}</span>
        </div>

        <div className="relative ml-auto hidden md:block">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar..."
            className="h-9 w-56 rounded-lg border border-border bg-muted pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ciano/50 focus-visible:ring-[3px] focus-visible:ring-ciano/20"
          />
        </div>

        <Button variant="ghost" size="icon" className="ml-auto md:ml-0" aria-label="Notificações">
          <Bell />
        </Button>

        <Button className="bg-linear-to-r from-firme to-ciano text-gelo shadow-lg shadow-firme/25 hover:opacity-90">
          <Sparkles />
          <span className="hidden sm:inline">Gerar conteúdo</span>
        </Button>
      </div>
    </header>
  )
}
