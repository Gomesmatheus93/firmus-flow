import { Link } from 'react-router'
import { Backdrop } from '@/components/backdrop'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <Backdrop />
      <div>
        <p className="font-display halo text-5xl text-ciano">404</p>
        <h1 className="mt-6 text-xl font-semibold text-gelo">Essa página não existe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço pode ter mudado ou o link está errado.
        </p>
        <Button asChild className="mt-6">
          <Link to="/painel">Voltar ao painel</Link>
        </Button>
      </div>
    </div>
  )
}
