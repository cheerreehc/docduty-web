// contexts/WorkspaceContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/contexts/UserContext';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- ประเภทข้อมูล ---
type Workspace = {
  id: string;
  name: string | null;
  created_by: string | null;
};

// ประเภทข้อมูลสำหรับข้อมูลดิบที่ได้จาก Supabase query
// workspaces สามารถเป็น null ได้ถ้า join ไม่เจอ
// removed_at สามารถเป็น null ได้
interface RawMembershipData {
  role: string | null;
  // ⭐ ปรับให้รองรับทั้ง Workspace object เดี่ยวๆ, null, หรือ Array ของ Workspace object
  workspaces: Workspace | null | Workspace[]; 
  removed_at: string | null; 
  user_id: string; 
  id: string; 
}

// ประเภทข้อมูลของ Membership ที่ใช้งานได้จริง (workspaces จะต้องไม่เป็น null และไม่ถูกลบ)
export type Membership = { 
  role: string | null;
  workspaces: Workspace; 
  user_id: string;
  id: string;
};

type WorkspaceContextType = {
  memberships: Membership[];
  currentWorkspace: Workspace | null;
  currentRole: string | null;
  switchWorkspace: (workspaceId: string) => void;
  loading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { profile, isSessionLoading } = useUser();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- โหลดข้อมูล Workspace ทั้งหมดที่ User เป็นสมาชิก ---
  const loadMemberships = useCallback(async (supabaseClient: SupabaseClient) => {
    if (!profile) {
      setLoading(false);
      setMemberships([]);
      setCurrentWorkspace(null);
      setCurrentRole(null);
      localStorage.removeItem('activeWorkspaceId'); 
      return;
    }

    setLoading(true);
    
    // ⭐ ลบ Generic Type ใน select ออก และ cast ผลลัพธ์ในภายหลัง
    const { data, error } = await supabaseClient
      .from('members')
      .select(`
        id,
        role, 
        user_id,
        removed_at, 
        workspaces (id, name, created_by)
      `)
      .eq('user_id', profile.id);

    if (error) {
      console.error("Error fetching memberships:", error);
      setMemberships([]);
    } else if (data) {
      // ⭐ Cast 'data' ให้เป็น RawMembershipData[] อย่างชัดเจนที่นี่
      const rawMemberships: RawMembershipData[] = data as RawMembershipData[];

      // ⭐ ปรับปรุง logic ใน reduce เพื่อจัดการกับ workspaces ที่เป็น Array
      const validMemberships = rawMemberships.reduce<Membership[]>((acc, m) => {
        let workspaceData: Workspace | null = null;

        if (Array.isArray(m.workspaces) && m.workspaces.length > 0) {
          // ถ้าเป็น Array ให้ใช้ element แรก
          workspaceData = m.workspaces[0];
        } else if (m.workspaces && typeof m.workspaces === 'object' && !Array.isArray(m.workspaces)) {
          // ถ้าเป็น object เดี่ยวๆ และไม่เป็น null
          workspaceData = m.workspaces;
        }
        
        // เพิ่มเข้า Array ก็ต่อเมื่อมีข้อมูล workspace จริงๆ และยังไม่ถูกลบ
        if (workspaceData && m.removed_at === null) { 
          acc.push({ 
            id: m.id,
            role: m.role, 
            workspaces: workspaceData, // TypeScript รู้ว่าตรงนี้ไม่เป็น null แล้ว
            user_id: m.user_id,
          });
        }
        return acc;
      }, []);

      setMemberships(validMemberships);
      
      // --- ตรวจสอบและตั้งค่า Workspace ปัจจุบัน ---
      if (validMemberships.length > 0) {
        const lastWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const lastActive = validMemberships.find(m => m.workspaces.id === lastWorkspaceId);

        if (lastActive) {
          setCurrentWorkspace(lastActive.workspaces);
          setCurrentRole(lastActive.role);
        } else {
          const firstWorkspace = validMemberships[0].workspaces;
          setCurrentWorkspace(firstWorkspace);
          setCurrentRole(validMemberships[0].role);
          localStorage.setItem('activeWorkspaceId', firstWorkspace.id);
        }
      } else {
        setCurrentWorkspace(null);
        setCurrentRole(null);
        localStorage.removeItem('activeWorkspaceId'); 
      }
    }
    setLoading(false);
  }, [profile]); 

  useEffect(() => {
    if (!isSessionLoading) {
      loadMemberships(supabase);
    }
  }, [isSessionLoading, loadMemberships, supabase]);

  // --- ฟังก์ชันสำหรับสลับ Workspace ---
  const switchWorkspace = useCallback((workspaceId: string) => {
    const targetMembership = memberships.find(m => m.workspaces.id === workspaceId);
    if (targetMembership) {
      setCurrentWorkspace(targetMembership.workspaces);
      setCurrentRole(targetMembership.role);
      localStorage.setItem('activeWorkspaceId', workspaceId);
      console.log(`Switched to workspace: ${targetMembership.workspaces.name}`);
    } else {
        console.warn(`Attempted to switch to non-existent or inactive workspace: ${workspaceId}`);
        setCurrentWorkspace(null); 
        setCurrentRole(null);
        localStorage.removeItem('activeWorkspaceId');
    }
  }, [memberships]);

  return (
    <WorkspaceContext.Provider
      value={{
        memberships,
        currentWorkspace,
        currentRole,
        switchWorkspace,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
