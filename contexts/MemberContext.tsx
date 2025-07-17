// contexts/MemberContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Profile } from '@/contexts/UserContext'; // Import Profile type

// --- Type Definitions ---
export type MemberWithProfile = {
  id: string; // Member ID
  user_id: string;
  role: string | null;
  profiles: Profile | null; // ข้อมูล Profile ที่ join มา
};

interface MemberContextType {
  members: MemberWithProfile[];
  loading: boolean;
  error: string | null;
  refreshMembers: () => Promise<void>;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ ปรับปรุงฟังก์ชัน fetchMembers ให้ดึงข้อมูลแบบ 2 ขั้นตอนเพื่อความแน่นอน
  const fetchMembers = useCallback(async () => {
    if (workspaceLoading || !currentWorkspace?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // --- ขั้นตอนที่ 1: ดึงข้อมูล "members" ทั้งหมดใน Workspace ---
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, user_id, role')
        .eq('workspace_id', currentWorkspace.id)
        .is('removed_at', null);

      if (membersError) throw membersError;

      // --- ขั้นตอนที่ 2: ดึงข้อมูล "profiles" ของ members ทั้งหมด ---
      const userIds = membersData.map(m => m.user_id).filter(Boolean);
      let profilesMap = new Map<string, Profile>();

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        
        if (profilesError) throw profilesError;
        
        profilesData.forEach(p => profilesMap.set(p.id, p as Profile));
      }

      // --- ขั้นตอนที่ 3: ประกอบร่าง members และ profiles เข้าด้วยกัน ---
      const combinedMembers = membersData.map(member => ({
        ...member,
        profiles: profilesMap.get(member.user_id) || null
      })).sort((a, b) => { // จัดเรียงตามชื่อเพื่อความสวยงาม
          const nameA = a.profiles?.first_name || a.profiles?.nickname || '';
          const nameB = b.profiles?.first_name || b.profiles?.nickname || '';
          return nameA.localeCompare(nameB);
      });

      setMembers(combinedMembers);

    } catch (err: any) {
      console.error("Error fetching members:", err);
      setError(err.message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, workspaceLoading, supabase]);

  useEffect(() => {
    if (currentWorkspace?.id) {
        fetchMembers();
    }
  }, [currentWorkspace?.id, fetchMembers]);
  
  const refreshMembers = fetchMembers;

  return (
    <MemberContext.Provider value={{ members, loading, error, refreshMembers }}>
      {children}
    </MemberContext.Provider>
  );
}

export const useMember = () => {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
};