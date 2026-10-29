import { z } from 'zod'

export const invitationStatusSchema = z.enum(['pendente', 'aceito', 'cancelado', 'expirado'])

export type InvitationStatus = z.infer<typeof invitationStatusSchema>
