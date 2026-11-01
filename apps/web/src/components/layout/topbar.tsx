import { Menu, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

/**
 * Fica direto sobre o degradê: os controles são de vidro, como os painéis.
 *
 * Tinha um campo de busca e um sino de notificações aqui. Os dois nunca
 * tiveram função, e controle que aceita clique sem responder faz quem usa
 * achar que a plataforma quebrou. Voltam quando busca e notificações
 * existirem de verdade.
 */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="glass rounded-full lg:hidden"
        onClick={onMenu}
        aria-label="Abrir menu"
      >
        <Menu />
      </Button>

      <Button asChild className="ml-auto rounded-full px-5 shadow-card">
        <Link to="/criacao">
          <Sparkles />
          <span className="hidden sm:inline">Gerar conteúdo</span>
        </Link>
      </Button>
    </div>
  )
}
