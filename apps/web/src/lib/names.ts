/** Iniciais para o avatar: "Matheus Gomes" vira "MG". */
export function initialsFrom(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'

  const first = parts[0]![0] ?? ''
  const last = parts.length > 1 ? (parts.at(-1)![0] ?? '') : ''

  return (first + last).toUpperCase()
}

/** Primeiro nome, para cumprimentar. */
export function firstNameFrom(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}
