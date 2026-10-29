import { ArrowRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/auth-provider'
import { AuthLayout } from './auth-layout'
import { FormError } from './form-error'

export function SignUpPage() {
  const { signUp, mode } = useAuth()
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (mode === 'demo') {
      setError('Modo demonstração: configure o Supabase no .env para criar contas de verdade.')
      return
    }

    const form = new FormData(event.currentTarget)
    setSubmitting(true)

    try {
      await signUp(String(form.get('nome')), String(form.get('email')), String(form.get('senha')))
      // Com confirmação de e-mail ligada no Supabase, ainda não há sessão aqui.
      setMessage('Conta criada. Se pedirmos confirmação por e-mail, confira sua caixa de entrada.')
      void navigate('/criar-empresa', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a conta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      description="Em dois minutos sua empresa está dentro."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/entrar" className="text-ciano hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="nome">Seu nome</Label>
          <Input id="nome" name="nome" required placeholder="Matheus Gomes" autoComplete="name" />
        </div>

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
          <Input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">Pelo menos 8 caracteres.</p>
        </div>

        <FormError message={error} />
        {message && <p className="text-sm text-ciano">{message}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full bg-linear-to-r from-firme to-ciano text-gelo shadow-lg shadow-firme/25 hover:opacity-90"
        >
          {submitting ? 'Criando...' : 'Criar conta'}
          {!submitting && <ArrowRight />}
        </Button>
      </form>
    </AuthLayout>
  )
}
