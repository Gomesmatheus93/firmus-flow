import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from './env'

/** Nulo em modo demonstração. Quem usa precisa checar antes. */
export const supabase: SupabaseClient | null = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
