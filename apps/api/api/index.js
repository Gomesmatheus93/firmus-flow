// A porta de entrada da Vercel. É JavaScript de propósito: a api já vem
// compilada pelo tsup (`pnpm build` → dist/vercel.js), com os pacotes
// @firmus dentro. Assim a Vercel não recompila o TypeScript do jeito dela,
// que foi o que deu o erro do `helmet`.
export { default } from '../dist/vercel.js'
