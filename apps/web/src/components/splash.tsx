import { Backdrop } from '@/components/backdrop'
import { LogoMark } from '@/components/logo'

/** Tela de espera enquanto descobrimos se há sessão. */
export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Backdrop />
      <LogoMark className="size-12 animate-pulse" />
    </div>
  )
}
