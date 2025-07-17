// contexts/ScheduleContext.tsx
import { createContext, useContext, useState, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

// --- Type Definitions ---
export type ProfileDataFromSupabase = { id: string; nickname: string | null; first_name: string | null; last_name: string | null; email: string | null;  avatar_url?: string | null;
  phone?: string | null;
  year_level?: string | null;};
type MemberForSchedule = { id: string; user_id: string; profiles: ProfileDataFromSupabase | null; };
type DutyTypeForSchedule = { id: string; name: string; color: string; };
interface RawScheduleData { id: string; date: string; member_id: string; duty_type_id: string; workspace_id: string; created_at: string; }
export type ScheduleWithDetails = RawScheduleData & { members: MemberForSchedule | null; duty_types: DutyTypeForSchedule | null; };

// --- Context Type Definition ---
interface ScheduleContextType {
  schedules: ScheduleWithDetails[];
  setSchedules: Dispatch<SetStateAction<ScheduleWithDetails[]>>; // ✅ ส่ง setSchedules ออกไป
  loading: boolean;
  error: string | null;
  loadSchedules: (year: number, month: number) => Promise<void>; // ไม่ต้อง return แล้ว
  addSchedule: (date: string, memberId: string, dutyTypeId: string) => Promise<boolean>;
  removeSchedule: (scheduleId: string) => Promise<boolean>;
  updateSchedule: (scheduleId: string, newMemberId: string, newDutyTypeId: string) => Promise<boolean>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { profile } = useUser();
  const { currentWorkspace } = useWorkspace();
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const loadSchedules = useCallback(async (year: number, month: number) => {
    if (!profile || !currentWorkspace) {
      // ✅ FIX: เพิ่ม console.log เพื่อช่วยหาข้อผิดพลาดในอนาคต
      console.log('loadSchedules skipped: profile or workspace not ready.');
      setSchedules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const endDateString = `${year}-${String(month).padStart(2, '0')}-${endDate.getDate()}`;

    // ✅✅✅ FIX: เปลี่ยนการ join เป็น LEFT JOIN ด้วย !left ✅✅✅
    // เพื่อให้แน่ใจว่า schedule จะแสดงเสมอ แม้ว่า member หรือ duty type จะถูกลบไปแล้ว
    const { data, error: fetchError } = await supabase
      .from('schedules')
      .select('*, duty_types!left(*), members!left(*, profiles!left(*))') // <--- แก้ไขบรรทัดนี้
      .eq('workspace_id', currentWorkspace.id)
      .gte('date', startDate)
      .lte('date', endDateString)
      // เพิ่มการกรอง schedule ที่ยังไม่ถูกลบ (ถ้ามีคอลัมน์ deleted_at ในตาราง schedules)
      // .is('deleted_at', null); 

    if (fetchError) {
      console.error("Error fetching schedules:", fetchError);
      setError(fetchError.message);
      setSchedules([]);
    } else {
      // ข้อมูลที่ได้มาจะถูก join มาเรียบร้อยแล้ว
      setSchedules(data as ScheduleWithDetails[]);
      setError(null);
    }
    setLoading(false);
  }, [profile, currentWorkspace, supabase]);

  const addSchedule = useCallback(async (date: string, memberId: string, dutyTypeId: string): Promise<boolean> => {
    if (!currentWorkspace?.id) return false;
    const { error } = await supabase.from('schedules').insert({ date, member_id: memberId, duty_type_id: dutyTypeId, workspace_id: currentWorkspace.id });
    return !error;
  }, [currentWorkspace, supabase]);

  const removeSchedule = useCallback(async (scheduleId: string): Promise<boolean> => {
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
    return !error;
  }, [supabase]);

  const updateSchedule = useCallback(async (scheduleId: string, newMemberId: string, newDutyTypeId: string): Promise<boolean> => {
    const { error } = await supabase.from('schedules').update({ member_id: newMemberId, duty_type_id: newDutyTypeId }).eq('id', scheduleId);
    return !error;
  }, [supabase]);

  const contextValue = useMemo(() => ({
    schedules,
    setSchedules, // ✅ ส่ง setSchedules ออกไป
    loading,
    error,
    loadSchedules,
    addSchedule,
    removeSchedule,
    updateSchedule,
  }), [schedules, loading, error, loadSchedules, addSchedule, removeSchedule, updateSchedule]);

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
}

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) throw new Error('useSchedule must be used within a ScheduleProvider');
  return context;
};