import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'


export type Profile = {
  id: string
  email?: string
  nickname?: string
  phone?: string
  avatar_url?: string
  year_level?: string
  title?: string
  first_name?: string
  last_name?: string
}

type UserContextType = {
  session: Session | null
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  fetchProfile: () => Promise<void>
  loading: boolean
  isSessionLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  children,
  supabase,
}: {
  children: ReactNode
  supabase: SupabaseClient
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

  const fetchProfile = async () => {
    const currentSession = await supabase.auth.getSession()
    const user = currentSession.data.session?.user

    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.warn('⚠️ fetchProfile error:', error)
      setProfile(null)
    } else {
      setProfile({
        id: user.id,
        email: user.email,
        ...data,
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsSessionLoading(false)

      if (data.session?.user) {
        fetchProfile()
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsSessionLoading(false)

      if (session?.user) {
        fetchProfile()
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])


  return (
    <UserContext.Provider
      value={{ session, profile, setProfile, fetchProfile, loading, isSessionLoading }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
