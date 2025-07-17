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

// ✅ แก้ไข Type: นำ profiles ออกจาก Membership
// Context นี้มีหน้าที่จัดการ "การเป็นสมาชิก" ของ user ปัจจุบัน ไม่ใช่ข้อมูล profile ของสมาชิกทั้งหมด
type Membership = {
  role: string | null;
  workspaces: Workspace; // Supabase query จะ join ตาราง workspaces เข้ามา
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
  // ✅ เปลี่ยนไปใช้ isSessionLoading เพื่อรอให้ session พร้อมก่อนเริ่มโหลดข้อมูล
  const { profile, isSessionLoading } = useUser();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMemberships = useCallback(async (supabaseClient: SupabaseClient) => {
    if (!profile) {
      setLoading(false);
      setMemberships([]);
      setCurrentWorkspace(null);
      setCurrentRole(null);
      return;
    }

    setLoading(true);

    const { data, error } = await supabaseClient
      .from('members')
      .select('role, workspaces!inner(id, name, created_by)')
      .eq('user_id', profile.id)
      .is('removed_at', null);

    if (error) {
      console.error("Error fetching memberships:", error);
      setMemberships([]);
    } else if (data) {

      // ✅ ใช้ .reduce เพื่อสร้าง array ของ membership ที่ถูกต้อง
      const validMemberships = data.reduce<Membership[]>((accumulator, currentMember) => {
        
        let workspaceObject: Workspace | null = null;

        // --- Logic ใหม่ที่ยืดหยุ่น ---
        // 1. ตรวจสอบกรณีที่ workspaces เป็น Array (เหมือนที่เจอปัญหาตอนแรก)
        if (Array.isArray(currentMember.workspaces) && currentMember.workspaces.length > 0) {
          workspaceObject = currentMember.workspaces[0];
        
        // 2. ตรวจสอบกรณีที่ workspaces เป็น Object (สถานการณ์ปกติ)
        } else if (currentMember.workspaces && !Array.isArray(currentMember.workspaces)) {
          workspaceObject = currentMember.workspaces as Workspace;
        }
        // --- จบ Logic ใหม่ ---

        // 3. ถ้าหา workspaceเจอจากเงื่อนไขใดเงื่อนไขหนึ่งข้างบน ให้เพิ่มเข้า Array
        if (workspaceObject) {
          accumulator.push({
            role: currentMember.role,
            workspaces: workspaceObject
          });
        }
        
        return accumulator;
      }, []);
      
      setMemberships(validMemberships);
      
      // Logic การตั้งค่า currentWorkspace ส่วนที่เหลือยังคงเหมือนเดิม
      if (validMemberships.length > 0) {
        const lastWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const lastActive = validMemberships.find(m => m.workspaces.id === lastWorkspaceId);

        if (lastActive) {
          setCurrentWorkspace(lastActive.workspaces);
          setCurrentRole(lastActive.role);
        } else {
          const firstMembership = validMemberships[0];
          setCurrentWorkspace(firstMembership.workspaces);
          setCurrentRole(firstMembership.role);
          localStorage.setItem('activeWorkspaceId', firstMembership.workspaces.id);
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
    // ✅ รอให้การโหลด session เสร็จสิ้น และมีข้อมูล profile ก่อนที่จะเรียก loadMemberships
    if (!isSessionLoading && profile) {
      loadMemberships(supabase);
    } else if (!isSessionLoading && !profile) {
        // กรณีที่โหลด session เสร็จแล้วแต่ไม่มี user (logout) ให้เคลียร์ค่าทั้งหมด
        setLoading(false);
        setMemberships([]);
        setCurrentWorkspace(null);
        setCurrentRole(null);
    }
  }, [isSessionLoading, profile, loadMemberships, supabase]);

  const switchWorkspace = (workspaceId: string) => {
    const targetMembership = memberships.find(m => m.workspaces.id === workspaceId);
    if (targetMembership) {
      setCurrentWorkspace(targetMembership.workspaces);
      setCurrentRole(targetMembership.role);
      localStorage.setItem('activeWorkspaceId', workspaceId);
    }
  };

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