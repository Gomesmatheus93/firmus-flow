/**
 * Degradê de fundo: é o que os painéis de vidro desfocam por trás.
 * Três borrões bem suaves nas cores da marca sobre a base clara — sem eles o
 * vidro não tem o que mostrar e vira só um branco acinzentado.
 *
 * Fica `fixed` para não rolar junto com a página, e atrás de tudo.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[28rem] -left-[18rem] h-[62rem] w-[62rem] rounded-full opacity-60 blur-[120px]"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in oklab, var(--color-azul) 38%, transparent), transparent)',
        }}
      />
      <div
        className="absolute -top-[16rem] right-[-14rem] h-[48rem] w-[48rem] rounded-full opacity-55 blur-[120px]"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in oklab, var(--color-ciano) 34%, transparent), transparent)',
        }}
      />
      <div
        className="absolute bottom-[-24rem] left-1/3 h-[52rem] w-[52rem] rounded-full opacity-45 blur-[130px]"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in oklab, var(--color-azul) 26%, transparent), transparent)',
        }}
      />
    </div>
  )
}
