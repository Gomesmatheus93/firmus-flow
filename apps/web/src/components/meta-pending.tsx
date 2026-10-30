/**
 * Aviso para as telas que dependem de permissão da Meta.
 * A revisão do app leva semanas, então o usuário precisa saber exatamente o
 * que está faltando em vez de achar que a tela está quebrada.
 */
export function MetaPending({ permission, what }: { permission: string; what: string }) {
  return (
    <div className="surface p-5">
      <p className="text-sm font-semibold text-noite">Aguardando liberação da Meta</p>
      <p className="mt-2 text-sm leading-relaxed text-ardosia">
        {what} depende da permissão <code className="text-noite">{permission}</code>, que só é
        liberada depois da revisão do app no Meta for Developers, com a conta do Instagram no modo
        comercial e ligada a uma Página do Facebook.
      </p>
      <p className="mt-2 text-sm text-ardosia">
        Até lá, o que você configurar aqui fica guardado e entra em vigor assim que a conta for
        aprovada.
      </p>
    </div>
  )
}
