import { Link, NavLink } from 'react-router'
import { cn } from 'cn'
import { Logo } from '@/components/logo'
import { initialsFrom } from '@/lib/names'
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
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'bg-azul font-medium text-white shadow-[0_8px_20px_-8px_rgb(28_140_255/0.75)]'
            : 'text-grafite/80 hover:bg-gelo hover:text-noite',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn('size-[1.125rem] shrink-0', isActive ? 'text-white' : 'text-ardosia')}
          />
          <span className="min-w-0 truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

/**
 * A barra lateral: branca, com uma linha fina separando do conteúdo, o menu
 * em seções (Planejar, Criar, Publicar, Medir…) e o item ativo numa pílula
 * Azul Firmus. Quem está logado fica no pé, com o e-mail.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { company, user } = useAuth()
  const groups = visibleGroups(company?.role ?? 'funcionario', user?.platformRole)

  return (
    <div className="flex h-full flex-col border-r border-regua bg-white">
      <div className="px-6 pt-6 pb-4">
        <Link to="/painel" onClick={onNavigate} className="inline-flex">
          <Logo />
        </Link>
        {company && (
          <p className="mt-3 truncate text-xs text-ardosia">
            <span className="font-medium text-noite">{company.name}</span>
            {company.segment ? ` · ${company.segment}` : ''}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-4 pt-3 pb-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="label px-3 pb-2 text-ardosia/70">{group.label}</p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {user && (
        <Link
          to="/configuracoes"
          onClick={onNavigate}
          className="flex items-center gap-3 border-t border-regua px-6 py-4 transition-colors hover:bg-gelo"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-noite text-xs font-semibold text-white">
            {initialsFrom(user.fullName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-noite">{user.fullName}</span>
            <span className="block truncate text-xs text-ardosia">{user.email}</span>
          </span>
        </Link>
      )}
    </div>
  )
}
