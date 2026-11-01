import { z } from 'zod'

export const roleSchema = z.enum(['chefe', 'funcionario'])

export type Role = z.infer<typeof roleSchema>

/**
 * Papel na plataforma inteira, separado do papel dentro de uma empresa.
 * Só a equipe da Firmus tem. Nulo = usuário comum.
 */
export const platformRoleSchema = z.enum(['operador'])

export type PlatformRole = z.infer<typeof platformRoleSchema>
