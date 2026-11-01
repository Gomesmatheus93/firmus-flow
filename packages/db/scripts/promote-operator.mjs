/**
 * Promove uma conta a operador da plataforma.
 *
 *   pnpm db:operador seu@email.com
 *   pnpm db:operador seu@email.com --remover
 *
 * Isto é de propósito um script de linha de comando, e não um botão na
 * interface: se a própria plataforma pudesse promover alguém, invadir uma
 * conta de chefe daria acesso a todas as empresas. Promover exige o banco.
 *
 * A pessoa precisa já ter criado a conta pela tela de cadastro — o registro em
 * `users` só nasce no primeiro login.
 */
import postgres from 'postgres'

const email = process.argv[2]?.trim().toLowerCase()
const remover = process.argv.includes('--remover')

if (!email) {
  console.error('Informe o e-mail: pnpm db:operador alguem@empresa.com')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não está no .env da raiz.')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: 'require',
  max: 1,
  onnotice: () => {},
})

try {
  const [pessoa] =
    await sql`select id, full_name, platform_role from users where lower(email) = ${email}`

  if (!pessoa) {
    console.error(`Não existe conta com o e-mail ${email}.`)
    console.error('Crie a conta pela tela de cadastro primeiro e rode isto de novo.')
    process.exit(1)
  }

  const novo = remover ? null : 'operador'

  await sql`update users set platform_role = ${novo}, updated_at = now() where id = ${pessoa.id}`

  console.log(
    remover
      ? `${pessoa.full_name} deixou de ser operador.`
      : `${pessoa.full_name} agora é operador da plataforma.`,
  )
  console.log('Saia e entre de novo na plataforma para o papel valer.')
} finally {
  await sql.end({ timeout: 5 })
}
