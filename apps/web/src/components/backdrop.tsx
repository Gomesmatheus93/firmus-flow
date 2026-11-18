/**
 * O fundo da plataforma: chapado, no cinza-azulado do tema.
 *
 * Já foi um degradê de borrões coloridos para o vidro fosco desfocar. Com os
 * cartões sólidos das referências SaaS (18/11/2026), o fundo só precisa ser
 * calmo. O componente continua para as telas que o usam não mudarem.
 */
export function Backdrop() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-fundo" />
}
