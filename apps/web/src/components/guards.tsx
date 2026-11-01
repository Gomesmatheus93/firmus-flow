import { Navigate, Outlet } from 'react-router'
import { Splash } from '@/components/splash'
import { useAuth } from '@/providers/auth-provider'

/**
 * Exige login e empresa.
 *
 * Operador da Firmus nao tem empresa propria: em vez de mandar ele criar uma,
 * manda escolher qual cliente quer ver.
 */
export function RequireCompany() {
  const { loading, user, company } = useAuth()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/entrar" replace />

  if (!company) {
    return <Navigate to={user.platformRole === 'operador' ? '/admin' : '/criar-empresa'} replace />
  }

  return <Outlet />
}

/** Exige login e papel de operador, mas nao exige empresa escolhida. */
export function RequireOperator() {
  const { loading, user } = useAuth()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/entrar" replace />
  if (user.platformRole !== 'operador') return <Navigate to="/painel" replace />

  return <Outlet />
}

/** Exige login, mas não exige empresa. Para a tela de criar empresa. */
export function RequireUser() {
  const { loading, user } = useAuth()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/entrar" replace />

  return <Outlet />
}

/**
 * Telas de entrada. Quem já está logado é mandado para dentro.
 * Em modo demonstração não redirecionamos, para dar para ver o desenho delas.
 */
export function GuestOnly() {
  const { loading, user, company, mode } = useAuth()

  if (loading) return <Splash />
  if (user && mode === 'supabase') {
    return <Navigate to={company ? '/painel' : '/criar-empresa'} replace />
  }

  return <Outlet />
}
