import type { RequestHandler } from 'express'
import { forbidden } from '../http/errors'

/** Restringe a rota à equipe da Firmus. Use depois de requireAuth. */
export const requireOperator: RequestHandler = (req, _res, next) => {
  if (req.auth?.platformRole !== 'operador') {
    next(forbidden('Esta área é da equipe da Firmus.', 'sem_acesso_operador'))
    return
  }

  next()
}

/**
 * Barra o operador numa rota, mesmo tendo ele escolhido a empresa.
 *
 * É a fronteira de privacidade escrita em código: conversas de WhatsApp e
 * dados de leads são de pessoas que nunca contrataram a Firmus — são clientes
 * do nosso cliente. O suporte não precisa delas para funcionar.
 *
 * Devolve 403 com explicação em vez de lista vazia: tela vazia faria o
 * operador achar que o cliente não tem dado, o que é mentira.
 */
export const blockOperator: RequestHandler = (req, _res, next) => {
  if (req.company?.asOperator) {
    next(
      forbidden(
        'Conversas e leads trazem dados pessoais dos clientes desta empresa. A equipe da Firmus não acessa esta parte.',
        'bloqueado_para_operador',
      ),
    )
    return
  }

  next()
}
