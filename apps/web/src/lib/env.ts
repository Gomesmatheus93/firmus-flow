/**
 * Configuração que chega ao navegador. Só variáveis com prefixo VITE_ entram
 * aqui — nunca coloque segredo nelas, qualquer pessoa consegue ler.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabaseConfig =
  supabaseUrl && supabaseAnonKey ? { url: supabaseUrl, anonKey: supabaseAnonKey } : null

/**
 * Sem Supabase configurado, a plataforma roda em modo demonstração: entra
 * direto, com dados de exemplo. É o que permite navegar pelas telas antes de
 * criar o projeto no Supabase. Preencheu o .env, o login real assume sozinho.
 */
export const isDemoMode = supabaseConfig === null

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3333'
