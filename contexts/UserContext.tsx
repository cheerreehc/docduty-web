// contexts/UserContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import { claimPendingInvitations } from '@/lib/claimInvitation'

// ⭐ Profile Type Definition ที่ถูกต้องและครบถ้วน (ยืนยันจาก DB Schema)
export type Profile = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  nickname: string | null
  avatar_url: string | null
  title: string | null
  year_level: string | null
  phone: string | null
  // created_at และ updated_at อาจจะถูกดึงมาด้วย แต่ไม่จำเป็นต้องอยู่ใน Profile Type ถ้าไม่ได้ใช้
  // created_at?: string;
  // updated_at?: string;
}

type UserContextType = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isSessionLoading: boolean
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

  const fetchUserProfile = useCallback(async (user: User) => {
  setLoading(true);

  // 1. ลองดึงข้อมูลโปรไฟล์ก่อน
  const { data: profileData, error: fetchError } = await supabase
    .from('profiles')
    .select('*') // ดึงทุกคอลัมน์ที่ได้รับอนุญาต
    .eq('id', user.id)
    .single();

  if (profileData) {
    // ถ้าเจอโปรไฟล์ ให้ set state แล้วจบการทำงาน
    setProfile({ ...profileData, email: user.email || '' });
    setLoading(false);
    return;
  }

  // 2. ถ้าไม่เจอโปรไฟล์ (Error PGRST116) ให้ทำการสร้างใหม่
  if (fetchError && fetchError.code === 'PGRST116') {
    console.log('Profile not found, creating one...');
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email }) // ⭐ เพิ่มแค่ id กับ email ที่จำเป็น
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      setProfile(null);
    } else {
      setProfile(newProfile ? { ...newProfile, email: user.email || '' } : null);
      console.log('✅ New profile created and set.');
    }
  } else if (fetchError) {
    // ถ้าเป็น Error อื่นๆ ให้แสดงผล
    console.error('Error fetching profile:', fetchError);
    setProfile(null);
  }

  setLoading(false);
}, [supabase]);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchUserProfile(user);
    }
  }, [supabase, fetchUserProfile]);


  useEffect(() => {
    const processUser = async (user: User | null) => {
      if (user) {
        await claimPendingInvitations(supabase, user);
        await fetchUserProfile(user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsSessionLoading(false);
      processUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setIsSessionLoading(false);
        processUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchUserProfile]);

  return (
    <UserContext.Provider value={{ session, profile, loading, isSessionLoading, refreshProfile }}>
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
