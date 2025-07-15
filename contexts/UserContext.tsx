// contexts/UserContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import { claimPendingInvitations } from '@/lib/claimInvitation'

type Profile = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  nickname: string | null
  avatar_url: string | null
}

type UserContextType = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isSessionLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

  useEffect(() => {
    const processUser = async (user: User | null) => {
      if (user) {
        // 1. Claim invitations first
        await claimPendingInvitations(supabase, user)

        // 2. Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // 👇 ======== ส่วนที่แก้ไขและเพิ่มเติม ======== 👇
        if (profileData) {
          // ถ้าเจอโปรไฟล์ ก็ set state ตามปกติ
          setProfile({ ...profileData, email: user.email || '' })
        } else {
          // ถ้าไม่เจอโปรไฟล์ (กรณี user ใหม่) ให้สร้างใหม่
          console.log('Profile not found for new user, creating one...')
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, email: user.email }) // เราใส่แค่ id กับ email ที่จำเป็นก่อน
            .select()
            .single()

          if (insertError) {
            console.error('Error creating profile:', insertError)
            setProfile(null)
          } else {
            setProfile(newProfile ? { ...newProfile, email: user.email || '' } : null)
            console.log('✅ New profile created and set.')
          }
        }
        // 👆 ======== จบส่วนที่แก้ไข ======== 👆

      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsSessionLoading(false)
      processUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setIsSessionLoading(false)
        processUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <UserContext.Provider value={{ session, profile, loading, isSessionLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}