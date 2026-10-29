import { Bot, ChevronsUpDown, LifeBuoy, LogOut, UserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { cn } from 'cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Logo } from '@/components/logo'
import { initialsFrom } from '@/lib/names'
import { roleLabel } from '@/mocks/session'
import { useAuth } from '@/providers/auth-provider'
import { visibleGroups, type NavItem } from './nav-items'

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'bg-noite font-medium text-white shadow-card'
            : 'text-grafite hover:bg-white/70 hover:text-noite',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-4 shrink-0', isActive ? 'text-ciano' : 'text-ardosia')} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

/** Cartão de destaque do rodapé: o estado do atendente de IA, sempre à vista. */
function AiCard() {
  return (
    <div className="rounded-xl bg-ciano p-3.5">
      <div className="flex items-center gap-2">
        <Bot className="size-4 shrink-0 text-noite" />
        <p className="text-sm font-semibold text-noite">Atendente de IA</p>
      </div>
      <p className="mt-1 text-xs text-noite/70">Ligado · 38 conversas hoje</p>
      <Link
        to="/conversas"
        className="mt-3 flex items-center justify-between rounded-lg bg-noite px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
      >
        4 esperam você
        <span aria-hidden>→</span>
      </Link>
    </div>
  )
}

function UserRow() {
  const { user, company, signOut, mode } = useAuth()

  if (!user || !company) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/70"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-noite text-[0.7rem] font-semibold text-white">
            {initialsFrom(user.fullName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-noite">{user.fullName}</span>
            <span className="block truncate text-xs text-ardosia">{roleLabel[company.role]}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-ardosia" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-60">
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

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { company } = useAuth()
  const groups = visibleGroups(company?.role ?? 'funcionario')

  return (
    <div className="glass-strong flex h-full flex-col rounded-2xl">
      <div className="px-5 py-5">
        <Link to="/painel" onClick={onNavigate} className="inline-flex">
          <Logo />
        </Link>
      </div>

      <div className="px-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/70 px-3 py-2.5">
          <span className="size-1.5 shrink-0 rounded-full bg-ciano" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-noite">{company?.name}</span>
            <span className="block truncate text-xs text-ardosia">{company?.segment}</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="label px-3 pb-2 text-ardosia/70">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 p-3">
        <AiCard />
        <UserRow />
      </div>
    </div>
  )
}
