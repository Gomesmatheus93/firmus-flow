import type { Role } from '@firmus/shared'
import type { RequestHandler } from 'express'
import { forbidden } from '../http/errors'

/**
 * Restringe a rota a certos papéis. Use sempre depois de requireCompany,
 * porque o papel vem de lá — do banco, não do navegador.
 */
export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.company || !allowed.includes(req.company.role)) {
      next(forbidden('Só o chefe da empresa pode fazer isso.', 'papel_insuficiente'))
      return
    }

    next()
  }
}
