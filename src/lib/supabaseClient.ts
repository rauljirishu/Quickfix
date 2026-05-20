import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

if (!hasSupabaseEnv) {
  console.warn('Supabase client keys are not set in environment')
}

export const supabase = hasSupabaseEnv ? createClient(supabaseUrl, supabaseAnonKey) : null

export default supabase
