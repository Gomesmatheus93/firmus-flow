import type { ReactNode } from 'react'

type Column<T> = {
  /** Vira o cabeçalho e, no celular, o rótulo de cada campo. */
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  /** Nome acessível da tabela. Fica visível acima dela. */
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
}

/**
 * Tabela com cabeçalho fixo ao rolar.
 *
 * O wrapper leva role="region" e tabIndex={0} para quem navega só pelo teclado
 * conseguir rolar a tabela na horizontal. Em tela estreita o cabeçalho some e
 * cada linha vira uma ficha, com o rótulo vindo do atributo data-label
 * (regras em .data-table, no index.css).
 */
export function DataTable<T>({ caption, columns, rows, rowKey }: DataTableProps<T>) {
  const captionId = `tabela-${caption.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <div
      className="data-table-wrap surface p-5"
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
    >
      <table className="data-table">
        <caption id={captionId} className="text-base font-semibold text-noite">
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.header} data-label={column.header} className={column.className}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
