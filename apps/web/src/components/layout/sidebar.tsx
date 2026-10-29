import { ChevronsUpDown, LifeBuoy, LogOut, UserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { cn } from 'cn'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
          'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-linear-to-r from-firme/30 via-firme/10 to-transparent font-medium text-gelo'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-ciano shadow-[0_0_10px_var(--color-ciano)]" />
          )}
          <Icon className={cn('size-4.5 shrink-0', isActive && 'text-ciano')} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function UserCard() {
  const { user, company, signOut, mode } = useAuth()

  if (!user || !company) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="glass flex w-full items-center gap-3 rounded-xl border border-border bg-card px-2.5 py-2.5 text-left transition-colors hover:border-ciano/40"
        >
          <Avatar className="size-9 rounded-lg">
            <AvatarFallback className="rounded-lg bg-linear-to-br from-firme to-ciano text-xs font-semibold text-gelo">
              {initialsFrom(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-gelo">{user.fullName}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {company.name} · {roleLabel[company.role]}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.fullName}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
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
    <div className="glass flex h-full flex-col border-r border-border bg-card/70">
      <div className="px-4 py-5">
        <Link to="/painel" onClick={onNavigate} className="inline-flex">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">
              {group.label}
            </p>
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

      <div className="p-3">
        <UserCard />
      </div>
    </div>
  )
}
