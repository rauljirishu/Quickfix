import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export function getAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export default getAuthClient
