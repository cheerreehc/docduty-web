// contexts/WorkspaceContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUser } from '@/contexts/UserContext'
import type { SupabaseClient } from '@supabase/supabase-js'

// ประเภทข้อมูลของ Workspace และ Role
type WorkspaceInfo = {
  id: string;
  name: string | null;
}

type MemberInfo = {
  workspace_id: string;
  role: string | null;
  workspaces: WorkspaceInfo | null;
}

// ประเภทข้อมูลของ Context
type WorkspaceContextType = {
  workspace: WorkspaceInfo | null;
  myRole: string | null;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { session, isSessionLoading } = useUser()

  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ถ้า session ยังโหลดไม่เสร็จ หรือไม่มี user ก็ไม่ต้องทำอะไร
    if (isSessionLoading || !session?.user?.id) {
      if (!isSessionLoading) {
        setLoading(false); // ถ้าโหลด session เสร็จแล้วแต่ไม่มี user ก็ให้หยุด loading
        setWorkspace(null);
        setMyRole(null);
      }
      return;
    }

    const loadUserWorkspace = async (userId: string, supabaseClient: SupabaseClient) => {
      setLoading(true);

      // ดึงข้อมูล membership ของ user คนปัจจุบัน
      const { data: memberData, error } = await supabaseClient
        .from('members')
        .select(`
          workspace_id,
          role,
          workspaces (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .maybeSingle<MemberInfo>(); // ใช้ maybeSingle เพื่อรองรับกรณีที่ user ยังไม่มี workspace

      if (error) {
        console.error('⚠️ Error loading workspace membership:', error);
        setWorkspace(null);
        setMyRole(null);
      } else if (memberData && memberData.workspaces) {
        // ✅ พบข้อมูล: ตั้งค่า state ให้ถูกต้อง
        setWorkspace(memberData.workspaces);
        setMyRole(memberData.role);
      } else {
        // ✅ ไม่พบข้อมูล: User login อยู่ แต่ยังไม่ได้เข้าร่วม workspace ใดๆ
        console.log('✅ User is logged in but not a member of any workspace.');
        setWorkspace(null);
        setMyRole(null);
      }
      
      setLoading(false);
    };

    // เรียกใช้ฟังก์ชันเมื่อ user id พร้อมใช้งาน
    loadUserWorkspace(session.user.id, supabase);

  }, [session?.user?.id, isSessionLoading, supabase]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        myRole,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

// Custom hook สำหรับเรียกใช้ Context
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}