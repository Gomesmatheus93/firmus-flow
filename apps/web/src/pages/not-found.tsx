import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo'

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <LogoMark className="mx-auto h-8" />
        <p className="label mt-8 text-ardosia">Erro 404</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-noite">
          Essa página não existe
        </h1>
        <p className="mt-2 text-sm text-ardosia">
          O endereço pode ter mudado ou o link está errado.
        </p>
        <Button asChild className="mt-7">
          <Link to="/painel">Voltar ao painel</Link>
        </Button>
      </div>
    </div>
  )
}
