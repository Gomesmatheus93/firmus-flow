/**
 * Camada de brilho que fica atrás de tudo. Dois borrões radiais muito desfocados,
 * em azul firme e ciano, mais uma grade quase invisível.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-1/3 -left-1/4 h-[70rem] w-[70rem] rounded-full opacity-55 blur-[140px]"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in oklab, var(--color-firme) 60%, transparent), transparent)',
        }}
      />
      <div
        className="absolute -top-40 right-[-20%] h-[50rem] w-[50rem] rounded-full opacity-40 blur-[130px]"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in oklab, var(--color-ciano) 45%, transparent), transparent)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-gelo) 1px, transparent 1px), linear-gradient(90deg, var(--color-gelo) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 75%)',
        }}
      />
    </div>
  )
}
