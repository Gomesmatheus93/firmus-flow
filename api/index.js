// A porta de entrada da Vercel quando a web e a api sobem juntas (vercel.json
// desta pasta). É JavaScript de propósito: a api já vem compilada pelo tsup,
// com os pacotes @firmus dentro, e a Vercel não recompila o TypeScript.
//
// Quando houver VPS, a api sai daqui e este arquivo some (ver apps/api/vercel.json
// e apps/web/vercel.json, que publicam cada parte separada).
export { default } from '../apps/api/dist/vercel.js'
