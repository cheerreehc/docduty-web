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
    // ⭐ ระบุคอลัมน์ที่ต้องการ select อย่างชัดเจน เพื่อให้ TypeScript อนุมาน Type ได้ดีขึ้น
    const { data: profileData, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, nickname, avatar_url, title, year_level, phone')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 คือไม่พบข้อมูล (No rows found)
      console.error('Error fetching profile:', fetchError);
      setProfile(null);
    } else if (profileData) {
      // ⭐ Cast profileData ให้เป็น Profile type ที่ถูกต้อง
      // ตรวจสอบว่า profileData มี properties ครบตาม Profile Type หรือไม่
      setProfile({ ...(profileData as Profile), email: user.email || '' });
    } else {
      console.log('Profile not found for new user, creating one...');
      // เมื่อสร้างโปรไฟล์ใหม่ ควรใส่ค่าเริ่มต้นสำหรับคอลัมน์ที่จำเป็น
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: user.id, 
          email: user.email,
          // ใส่ค่าเริ่มต้นสำหรับคอลัมน์ใหม่ที่เพิ่มเข้ามา
          title: null, 
          first_name: null, 
          last_name: null, 
          nickname: null, 
          year_level: null, 
          phone: null, 
          avatar_url: null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        setProfile(null);
      } else {
        // ⭐ Cast newProfile ให้เป็น Profile type ที่ถูกต้อง
        setProfile(newProfile ? { ...(newProfile as Profile), email: user.email || '' } : null);
        console.log('✅ New profile created and set.');
      }
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
