/**
 * Qual empresa o operador da Firmus está olhando no momento.
 *
 * Fica no navegador porque é escolha de sessão, não dado. Quem decide se a
 * escolha vale é a api, que confere o papel no banco antes de obedecer — o
 * valor guardado aqui não dá poder nenhum a quem não é operador.
 */
const CHAVE = 'firmus:empresa-escolhida'

export type EmpresaEscolhida = { id: string; nome: string }

export function lerEmpresaEscolhida(): EmpresaEscolhida | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return null

    const valor: unknown = JSON.parse(bruto)
    if (
      typeof valor === 'object' &&
      valor !== null &&
      'id' in valor &&
      typeof valor.id === 'string'
    ) {
      return valor as EmpresaEscolhida
    }
  } catch {
    // localStorage bloqueado ou conteúdo estragado: segue sem escolha.
  }

  return null
}

export function escolherEmpresa(empresa: EmpresaEscolhida) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(empresa))
  } catch {
    // Sem localStorage a escolha não persiste entre recargas, mas a sessão continua.
  }
}

export function sairDaEmpresa() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // nada a fazer
  }
}
