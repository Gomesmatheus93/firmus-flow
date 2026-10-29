import type { Request } from 'express'
import { badRequest } from './errors'

/**
 * Lê um parâmetro da URL como texto.
 * O Express tipa req.params de forma frouxa; esta função fecha isso num lugar só.
 */
export function pathParam(req: Request, name: string): string {
  const value = req.params[name]

  if (typeof value !== 'string' || value.length === 0) {
    throw badRequest('Endereço inválido.', 'parametro_invalido')
  }

  return value
}
