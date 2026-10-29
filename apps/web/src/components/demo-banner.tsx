import { FlaskConical } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'

/**
 * Aparece só enquanto o Supabase não está no .env. Deixa explícito que o
 * login e os dados não são reais ainda.
 */
export function DemoBanner() {
  const { mode } = useAuth()

  if (mode !== 'demo') return null

  return (
    <div className="border-b border-ciano/20 bg-ciano/10">
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2 text-xs text-ciano sm:px-6 lg:px-8">
        <FlaskConical className="size-3.5 shrink-0" />
        <p>
          Modo demonstração: sem login de verdade e com dados de exemplo. Preencha as variáveis do
          Supabase no <code className="font-mono">.env</code> da raiz para ligar a plataforma.
        </p>
      </div>
    </div>
  )
}
