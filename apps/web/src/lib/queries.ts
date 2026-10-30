import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'

/**
 * Busca dados da empresa na api.
 *
 * Em modo demonstração não existe sessão nem banco, então nem tentamos a
 * chamada: devolvemos vazio. O aviso no topo da tela já explica o porquê, e
 * isso é melhor do que encher a plataforma de mensagem de erro.
 */
export function useCompanyData<T>(key: readonly unknown[], path: string, emptyValue: T) {
  const { mode } = useAuth()
  const isDemo = mode === 'demo'

  const query = useQuery({
    queryKey: key,
    queryFn: () => api.get<T>(path),
    enabled: !isDemo,
  })

  return {
    data: (isDemo ? emptyValue : query.data) ?? emptyValue,
    isPending: !isDemo && query.isPending,
    error: isDemo ? null : query.error,
  }
}
