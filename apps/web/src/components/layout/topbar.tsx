import { ChevronDown, LifeBuoy, LogOut, Menu, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { roleLabel } from '@/lib/demo-session'
import { initialsFrom } from '@/lib/names'
import { useAuth } from '@/providers/auth-provider'
import { pageTitleFor } from './nav-items'

/** "Segunda-feira, 23 de novembro", no fuso de São Paulo. */
function hojePorExtenso(): string {
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Quem está logado, com o menu de perfil e sair. */
function UserMenu() {
  const { user, company, signOut, mode } = useAuth()

  if (!user || !company) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-white"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-noite text-xs font-semibold text-white">
            {initialsFrom(user.fullName)}
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-40 truncate text-sm font-semibold text-noite">
              {user.fullName}
            </span>
            <span className="block text-xs text-ardosia">{roleLabel[company.role]}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-ardosia" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.fullName}</span>
          <span className="block truncate text-xs text-ardosia">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/configuracoes">
            <UserRound />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LifeBuoy />
          Ajuda
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={mode === 'demo'}
          onSelect={() => void signOut()}
        >
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * A barra do topo: o nome da tela e a data de hoje à esquerda, quem está
 * logado à direita.
 *
 * Busca e sino de notificações ficam de fora até existirem de verdade:
 * controle que aceita clique sem responder faz quem usa achar que a
 * plataforma quebrou.
 */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const titulo = pageTitleFor(pathname)

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-white lg:hidden"
        onClick={onMenu}
        aria-label="Abrir menu"
      >
        <Menu />
      </Button>

      <div className="min-w-0">
        {titulo && <p className="truncate text-base font-semibold text-noite">{titulo}</p>}
        <p className="truncate text-xs text-ardosia">{hojePorExtenso()}</p>
      </div>

      <div className="ml-auto flex items-center">
        <UserMenu />
      </div>
    </div>
  )
}
