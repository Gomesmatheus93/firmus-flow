import type { Database } from '@firmus/db'
import { instagramConnections } from '@firmus/db/schema'
import { encrypt, hasEncryptionKey } from '@firmus/shared/crypto'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest, unavailable } from '../http/errors'
import { InstagramApiError, type InstagramAccountFetcher } from '../meta/instagram'
import { blockOperator } from '../middleware/operator'
import { requireRole } from '../middleware/role'

const connectSchema = z.object({
  accessToken: z.string().trim().min(20, 'Esse token parece curto demais.').max(1000),
  /**
   * Opcional. Quando informado, a consulta vai direto na conta em vez de a api
   * tentar descobrir qual é — e descobrir nem sempre dá certo, porque depende
   * de como o token foi gerado.
   */
  igAccountId: z
    .string()
    .trim()
    .regex(/^\d*$/, 'O ID da conta é só números.')
    .max(40)
    .optional(),
})

/**
 * A ligação da empresa com o Instagram dela.
 *
 * O token entra por aqui, é provado na Meta e guardado cifrado. Ele **nunca
 * volta para o navegador**: a tela mostra o @ e os seguidores, não a credencial.
 */
export function instagramRoutes(db: Database, fetchAccount: InstagramAccountFetcher): Router {
  const router = Router()

  // Credencial de cliente não é dado de suporte: o operador da Firmus fica de
  // fora, como no PATCH /company. E configurar é do chefe.
  router.use('/instagram/connection', requireRole('chefe'), blockOperator)

  router.get('/instagram/connection', async (req, res) => {
    const { companyId } = req.company!

    const [ligacao] = await db
      .select({
        username: instagramConnections.username,
        igAccountId: instagramConnections.igAccountId,
        connectedAt: instagramConnections.connectedAt,
        lastVerifiedAt: instagramConnections.lastVerifiedAt,
      })
      .from(instagramConnections)
      .where(eq(instagramConnections.companyId, companyId))
      .limit(1)

    // Repare no select acima: accessTokenCipher não está na lista. O token não
    // sai desta tabela nem cifrado — não há motivo para o navegador vê-lo.
    res.json({ connection: ligacao ?? null })
  })

  router.post('/instagram/connection', async (req, res) => {
    const { companyId } = req.company!

    if (!hasEncryptionKey()) {
      throw unavailable(
        'Falta a chave de criptografia da plataforma. Preencha FIRMUS_ENCRYPTION_KEY no .env da raiz.',
        'sem_chave_de_cifra',
      )
    }

    const corpo = connectSchema.safeParse(req.body)
    if (!corpo.success) throw badRequest(z.prettifyError(corpo.error))

    // Provar antes de guardar: token que a Meta não aceita não entra no banco.
    let conta
    try {
      conta = await fetchAccount(corpo.data.accessToken, corpo.data.igAccountId || undefined)
    } catch (erro) {
      if (erro instanceof InstagramApiError) throw badRequest(erro.message, 'token_recusado')
      throw erro
    }

    const campos = {
      igAccountId: conta.id,
      username: conta.username,
      accessTokenCipher: encrypt(corpo.data.accessToken),
      lastVerifiedAt: new Date(),
    }

    await db
      .insert(instagramConnections)
      .values({ companyId, ...campos })
      .onConflictDoUpdate({ target: instagramConnections.companyId, set: campos })

    res.json({
      connection: { username: conta.username, igAccountId: conta.id },
      account: conta,
    })
  })

  router.delete('/instagram/connection', async (req, res) => {
    const { companyId } = req.company!

    await db.delete(instagramConnections).where(eq(instagramConnections.companyId, companyId))

    res.status(204).end()
  })

  return router
}
