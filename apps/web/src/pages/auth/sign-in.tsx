import { ArrowRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/auth-provider'
import { AuthLayout } from './auth-layout'
import { FormError } from './form-error'

export function SignInPage() {
  const { signIn, mode } = useAuth()
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (mode === 'demo') {
      setError('Modo demonstração: configure o Supabase no .env para entrar de verdade.')
      return
    }

    const form = new FormData(event.currentTarget)
    setSubmitting(true)

    try {
      await signIn(String(form.get('email')), String(form.get('senha')))
      void navigate('/painel', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      description="Acesse o painel da sua empresa."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/criar-conta" className="text-ciano hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="voce@empresa.com.br"
            autoComplete="email"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" name="senha" type="password" required autoComplete="current-password" />
        </div>

        <FormError message={error} />

        <Button type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? 'Entrando...' : 'Entrar'}
          {!submitting && <ArrowRight />}
        </Button>
      </form>
    </AuthLayout>
  )
}
