import { z } from 'zod'

/** Com que frequência o plano é cobrado. */
export const billingIntervalSchema = z.enum(['mensal', 'anual'])

export type BillingInterval = z.infer<typeof billingIntervalSchema>

export const billingIntervalLabel: Record<BillingInterval, string> = {
  mensal: 'Mensal',
  anual: 'Anual',
}

/**
 * Situação da assinatura de um cliente.
 * `cancelada` é o que a gente chama de "desistiu".
 */
export const subscriptionStatusSchema = z.enum(['teste', 'ativa', 'inadimplente', 'cancelada'])

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>

export const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  teste: 'Em teste',
  ativa: 'Ativa',
  inadimplente: 'Inadimplente',
  cancelada: 'Cancelada',
}

export const invoiceStatusSchema = z.enum(['aberta', 'paga', 'vencida', 'cancelada'])

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  aberta: 'Em aberto',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
}

/** Centavos para texto em reais: 12990 vira "R$ 129,90". */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}
