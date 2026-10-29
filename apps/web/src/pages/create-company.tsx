import { ArrowRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { AuthLayout } from '@/pages/auth/auth-layout'
import { FormError } from '@/pages/auth/form-error'
import { useAuth } from '@/providers/auth-provider'

/**
 * Primeiro login: o usuário cria a empresa e vira o chefe dela.
 * Quem chegou por convite não passa por aqui — entra direto na empresa
 * de quem convidou.
 */
export function CreateCompanyPage() {
  const { refresh, signOut } = useAuth()
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    setSubmitting(true)

    try {
      await api.post('/companies', {
        name: String(form.get('nome')),
        segment: String(form.get('segmento')) || undefined,
        instagramHandle: String(form.get('instagram')) || undefined,
      })

      await refresh()
      void navigate('/painel', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a empresa.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Criar sua empresa"
      description="É o primeiro passo. Você vira o chefe dela e pode convidar sua equipe depois."
      footer={
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-muted-foreground hover:text-ciano"
        >
          Sair da conta
        </button>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome da empresa</Label>
          <Input id="nome" name="nome" required minLength={2} placeholder="Studio Aura" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="segmento">Segmento</Label>
          <Input id="segmento" name="segmento" placeholder="Estética e bem-estar · Mossoró/RN" />
          <p className="text-xs text-muted-foreground">Opcional, dá para preencher depois.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" placeholder="@suaempresa" />
        </div>

        <FormError message={error} />

        <Button type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? 'Criando...' : 'Criar empresa'}
          {!submitting && <ArrowRight />}
        </Button>
      </form>
    </AuthLayout>
  )
}
