/**
 * Monta e baixa um CSV que o Excel em português abre direito.
 *
 * Duas decisões que não são frescura:
 *
 * - **separador `;`**, não vírgula. No Excel configurado em português, a
 *   vírgula é separador decimal, então um CSV com vírgula abre tudo empilhado
 *   numa coluna só.
 * - **BOM no começo** (o caractere U+FEFF). Sem ele o Excel lê o arquivo como ANSI e
 *   todo acento vira caractere quebrado.
 *
 * Quem abre no Google Sheets ou no LibreOffice não precisa de nenhum dos dois,
 * mas eles também não atrapalham lá.
 */

/** Protege o campo: aspas dobradas, e aspas em volta quando há separador ou quebra. */
function campo(valor: string | null | undefined): string {
  const texto = (valor ?? '').replace(/"/g, '""')
  return /[;"\n\r]/.test(texto) ? `"${texto}"` : texto
}

export function toCsv(cabecalho: string[], linhas: (string | null | undefined)[][]): string {
  return [cabecalho, ...linhas].map((linha) => linha.map(campo).join(';')).join('\r\n')
}

/** Entrega o arquivo ao navegador e limpa a URL temporária depois. */
export function baixarCsv(nomeDoArquivo: string, conteudo: string): void {
  const blob = new Blob([`\uFEFF${conteudo}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = nomeDoArquivo
  document.body.append(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}
