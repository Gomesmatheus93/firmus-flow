import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/** O que a web precisa para sair do modo demonstração e falar com a api. */
const OBRIGATORIAS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_BASE_URL']

export default defineConfig(({ command, mode }) => {
  // O .env do projeto fica na raiz do monorepo, não aqui. Sem isto, o Vite
  // procuraria em apps/web e as variáveis VITE_ nunca chegariam ao navegador.
  const envDir = fileURLToPath(new URL('../../', import.meta.url))

  // Na Vercel, as variáveis vêm do painel, não de arquivo. Elas entram no
  // código na hora do build — faltar uma lá publica a plataforma em modo
  // demonstração, sem erro nenhum. Então o build diz o que recebeu e, na
  // Vercel, para quando falta alguma.
  if (command === 'build') {
    const env = loadEnv(mode, envDir, 'VITE_')
    const faltam = OBRIGATORIAS.filter((nome) => !env[nome]?.trim())

    console.log(
      `[web] variáveis no build: ${OBRIGATORIAS.map((n) => `${n} ${faltam.includes(n) ? 'FALTANDO' : 'ok'}`).join(' · ')}`,
    )

    if (process.env.VERCEL && faltam.length > 0) {
      throw new Error(
        `[web] Faltam no painel da Vercel: ${faltam.join(', ')}. ` +
          'Cadastre em Settings → Environment Variables, marcando "Production", e publique de novo.',
      )
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    envDir,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
  }
})
