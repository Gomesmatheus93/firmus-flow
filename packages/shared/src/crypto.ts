import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Cifra para guardar segredo de cliente no banco.
 *
 * A regra 2 do CLAUDE.md manda segredo só no `.env`. Num SaaS multi-empresa isso
 * não cabe: cada cliente tem o token do Instagram e do WhatsApp dele, e são
 * dezenas. A saída é cifrar no banco com uma chave que fica no `.env`:
 *
 * - a chave é **da plataforma**, uma só, e mora no `.env` como manda a regra
 * - o token de cada empresa vai cifrado para o banco
 * - banco vazado sem a chave é lixo; a chave sozinha não tem o que decifrar
 *
 * AES-256-GCM e não CBC porque o GCM **autentica**: texto cifrado adulterado
 * falha na decifragem em vez de devolver lixo que o resto do código trataria
 * como token válido.
 *
 * Vive numa entrada própria (`@firmus/shared/crypto`) porque usa `node:crypto`
 * e o barril principal é lido pelo navegador — o mesmo arranjo de
 * `@firmus/shared/env`.
 */

const ALGORITMO = 'aes-256-gcm'

/** 12 bytes é o tamanho de IV recomendado para GCM. */
const TAMANHO_IV = 12
const TAMANHO_TAG = 16
const TAMANHO_CHAVE = 32

export class EncryptionKeyError extends Error {}

/**
 * A chave, em bytes. Lida a cada chamada, e não no carregamento do módulo,
 * para o teste poder trocá-la.
 */
function lerChave(chaveBase64 = process.env.FIRMUS_ENCRYPTION_KEY): Buffer {
  if (!chaveBase64) {
    throw new EncryptionKeyError(
      'FIRMUS_ENCRYPTION_KEY não está no .env. Gere uma com: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    )
  }

  const bytes = Buffer.from(chaveBase64, 'base64')

  if (bytes.length !== TAMANHO_CHAVE) {
    throw new EncryptionKeyError(
      `FIRMUS_ENCRYPTION_KEY precisa ter ${TAMANHO_CHAVE} bytes em base64, e tem ${bytes.length}.`,
    )
  }

  return bytes
}

/** Diz se dá para cifrar, sem estourar. Rotas usam para devolver 503 com instrução. */
export function hasEncryptionKey(chaveBase64 = process.env.FIRMUS_ENCRYPTION_KEY): boolean {
  try {
    lerChave(chaveBase64)
    return true
  } catch {
    return false
  }
}

/**
 * Cifra um texto. O resultado carrega tudo que a decifragem precisa:
 * `IV + etiqueta de autenticação + texto cifrado`, em base64.
 *
 * O IV é sorteado a cada chamada, então cifrar o mesmo token duas vezes dá
 * resultados diferentes — é o que impede alguém de descobrir, olhando o banco,
 * que duas empresas usam a mesma credencial.
 */
export function encrypt(texto: string, chaveBase64?: string): string {
  const iv = randomBytes(TAMANHO_IV)
  const cifrador = createCipheriv(ALGORITMO, lerChave(chaveBase64), iv)

  const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()])

  return Buffer.concat([iv, cifrador.getAuthTag(), cifrado]).toString('base64')
}

/**
 * Decifra o que `encrypt` guardou.
 *
 * Levanta erro quando a chave está errada ou o texto foi adulterado — nunca
 * devolve lixo. É o ponto do GCM.
 */
export function decrypt(guardado: string, chaveBase64?: string): string {
  const bytes = Buffer.from(guardado, 'base64')

  if (bytes.length <= TAMANHO_IV + TAMANHO_TAG) {
    throw new Error('Texto cifrado curto demais para ser válido.')
  }

  const iv = bytes.subarray(0, TAMANHO_IV)
  const tag = bytes.subarray(TAMANHO_IV, TAMANHO_IV + TAMANHO_TAG)
  const cifrado = bytes.subarray(TAMANHO_IV + TAMANHO_TAG)

  const decifrador = createDecipheriv(ALGORITMO, lerChave(chaveBase64), iv)
  decifrador.setAuthTag(tag)

  return Buffer.concat([decifrador.update(cifrado), decifrador.final()]).toString('utf8')
}
