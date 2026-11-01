import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // O .env do projeto fica na raiz do monorepo, não aqui. Sem isto, o Vite
  // procuraria em apps/web e as variáveis VITE_ nunca chegariam ao navegador.
  envDir: fileURLToPath(new URL('../../', import.meta.url)),

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
})
