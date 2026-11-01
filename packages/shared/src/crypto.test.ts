import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { decrypt, encrypt, hasEncryptionKey } from './crypto'

const chave = () => randomBytes(32).toString('base64')

const TOKEN = 'EAABsbCS1iHgBO7ZCZAexemplo1234567890'

describe('ida e volta', () => {
  it('decifra o que cifrou', () => {
    const k = chave()

    expect(decrypt(encrypt(TOKEN, k), k)).toBe(TOKEN)
  })

  it('aguenta acento e emoji', () => {
    const k = chave()
    const texto = 'Estética avançada ✨ em Mossoró'

    expect(decrypt(encrypt(texto, k), k)).toBe(texto)
  })

  it('o texto cifrado não contém o original', () => {
    const k = chave()

    const guardado = encrypt(TOKEN, k)

    // O que vai para o banco não pode ter o token legível em lugar nenhum.
    expect(guardado).not.toContain(TOKEN)
    expect(Buffer.from(guardado, 'base64').toString('utf8')).not.toContain(TOKEN)
  })
})

describe('o mesmo texto não dá o mesmo resultado', () => {
  it('porque o IV é sorteado a cada chamada', () => {
    const k = chave()

    const a = encrypt(TOKEN, k)
    const b = encrypt(TOKEN, k)

    // Se fossem iguais, daria para descobrir no banco que duas empresas usam a
    // mesma credencial, sem decifrar nada.
    expect(a).not.toBe(b)
    expect(decrypt(a, k)).toBe(decrypt(b, k))
  })
})

describe('o que precisa falhar', () => {
  it('chave errada não decifra', () => {
    const guardado = encrypt(TOKEN, chave())

    expect(() => decrypt(guardado, chave())).toThrow()
  })

  it('texto adulterado falha em vez de devolver lixo', () => {
    const k = chave()
    const bytes = Buffer.from(encrypt(TOKEN, k), 'base64')

    // Vira um bit no meio do texto cifrado. É isso que o GCM pega — com CBC,
    // a decifragem devolveria bytes sem sentido e o resto do código trataria
    // como token válido.
    bytes[bytes.length - 3]! ^= 0x01

    expect(() => decrypt(bytes.toString('base64'), k)).toThrow()
  })

  it('etiqueta de autenticação adulterada falha', () => {
    const k = chave()
    const bytes = Buffer.from(encrypt(TOKEN, k), 'base64')

    bytes[13]! ^= 0x01

    expect(() => decrypt(bytes.toString('base64'), k)).toThrow()
  })

  it('texto curto demais não passa por válido', () => {
    expect(() => decrypt('YWJj', chave())).toThrow(/curto demais/)
  })

  it('sem chave, o erro diz como gerar uma', () => {
    expect(() => encrypt(TOKEN, '')).toThrow(/FIRMUS_ENCRYPTION_KEY/)
  })

  it('chave do tamanho errado é recusada', () => {
    const curta = randomBytes(16).toString('base64')

    expect(() => encrypt(TOKEN, curta)).toThrow(/32 bytes/)
  })
})

describe('hasEncryptionKey', () => {
  it('diz que sim para chave boa e não para o resto', () => {
    expect(hasEncryptionKey(chave())).toBe(true)
    expect(hasEncryptionKey('')).toBe(false)
    expect(hasEncryptionKey(randomBytes(8).toString('base64'))).toBe(false)
  })
})
