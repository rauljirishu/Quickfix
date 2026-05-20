import React, { createContext, useContext, useEffect, useState } from 'react'
import supabase, { hasSupabaseEnv } from './supabaseClient'
import type { User } from '@supabase/supabase-js'
import { getProfile } from './auth'

type AuthContextValue = {
  user: User | null
  profile: any | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, profile: null, loading: true })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    async function load() {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(data?.user ?? null)
      if (data?.user) {
        const { data: p } = await getProfile(data.user.id)
        setProfile(p ?? null)
      }
      setLoading(false)
    }

    load()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const { data: p } = await getProfile(u.id)
        setProfile(p ?? null)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export default AuthProvider
