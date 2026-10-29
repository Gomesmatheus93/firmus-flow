import { z } from 'zod'

export const roleSchema = z.enum(['chefe', 'funcionario'])

export type Role = z.infer<typeof roleSchema>
