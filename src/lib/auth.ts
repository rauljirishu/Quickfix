import supabase from './supabaseClient'

export type SignUpData = {
  email: string
  password: string
  full_name?: string
  age?: number
  gender?: string
  phone?: string
  role?: 'customer' | 'worker' | 'admin'
}

export async function signUp(data: SignUpData) {
  if (!supabase) return { error: new Error('Supabase is not configured') }
  const { email, password, full_name, age, gender, phone, role = 'customer' } = data

  const res = await supabase.auth.signUp({ email, password })
  if (res.error) return { error: res.error }

  // create a profile row (serverless example: this runs on client but you may prefer a server function)
  const user = res.data.user
  if (user) {
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name,
      age,
      gender,
      phone,
      role,
    })
  }

  return res
}

export async function signIn(email: string, password: string) {
  if (!supabase) return { error: new Error('Supabase is not configured') }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!supabase) return { error: new Error('Supabase is not configured') }
  return supabase.auth.signOut()
}

export async function getProfile(userId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return { data, error }
}

export async function updateProfile(userId: string, payload: Record<string, any>) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') }
  const { data, error } = await supabase.from('profiles').upsert({ id: userId, ...payload })
  return { data, error }
}

export async function getCurrentUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}
