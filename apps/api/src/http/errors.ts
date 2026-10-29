import type { NextFunction, Request, Response } from 'express'

/**
 * Erro com status HTTP e mensagem pronta para o usuário, em português.
 * Qualquer outro erro vira 500 com mensagem genérica — detalhe interno
 * não vaza para o navegador.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const badRequest = (message: string, code = 'requisicao_invalida') =>
  new AppError(400, message, code)

export const unauthorized = (message = 'Faça login para continuar.', code = 'nao_autenticado') =>
  new AppError(401, message, code)

export const forbidden = (message = 'Você não tem permissão para isso.', code = 'sem_permissao') =>
  new AppError(403, message, code)

export const notFound = (message = 'Não encontrado.', code = 'nao_encontrado') =>
  new AppError(404, message, code)

export const conflict = (message: string, code = 'conflito') => new AppError(409, message, code)

export const unavailable = (message: string, code = 'indisponivel') =>
  new AppError(503, message, code)

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { message: error.message, code: error.code } })
    return
  }

  console.error('[api] erro não tratado:', error)

  res.status(500).json({
    error: { message: 'Algo deu errado do nosso lado. Tente de novo.', code: 'erro_interno' },
  })
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Rota não encontrada.', code: 'rota_inexistente' } })
}
