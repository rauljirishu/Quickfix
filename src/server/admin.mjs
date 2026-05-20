import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin
if (!supabaseUrl || !supabaseServiceRoleKey) {
  if (process.env.NODE_ENV === 'test') {
    // Test-safe placeholder: tests can inject fake clients directly where needed.
    supabaseAdmin = {
      from() {
        throw new Error('Supabase client not configured in test environment')
      },
      auth: {
        getUser: async () => ({ data: null, error: new Error('not configured') }),
      },
    }
  } else {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment')
    process.exit(1)
  }
} else {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
}

export { supabaseAdmin }

export default supabaseAdmin
