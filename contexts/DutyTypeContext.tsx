// contexts/DutyTypeContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';

// --- Type Definition สำหรับ DutyType ---
export type DutyType = {
  id: string;
  name: string;
  color: string; // เช่น #FF0000
  workspace_id: string;
  created_at: string;
  deleted_at: string | null; // ⭐ เปลี่ยนเป็น deleted_at
};

// --- Type Definition สำหรับ Context ---
interface DutyTypeContextType {
  dutyTypes: DutyType[];
  loading: boolean;
  addDutyType: (name: string, color: string) => Promise<void>;
  updateDutyType: (id: string, name: string, color: string) => Promise<void>;
  deleteDutyType: (id: string) => Promise<void>;
  error: string | null;
}

// --- สร้าง Context ---
const DutyTypeContext = createContext<DutyTypeContextType | undefined>(undefined);

// --- DutyTypeProvider Component ---
export function DutyTypeProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { profile, loading: userLoading } = useUser();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ฟังก์ชันโหลด Duty Types ---
  const loadDutyTypes = useCallback(async () => {
    if (userLoading || workspaceLoading || !profile?.id || !currentWorkspace?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('duty_types')
      // ⭐ ระบุคอลัมน์ที่ต้องการดึงอย่างชัดเจน และกรองเฉพาะที่ยังไม่ถูกลบ
      .select('id, name, color, workspace_id, created_at, deleted_at') // ⭐ เปลี่ยนเป็น deleted_at
      .eq('workspace_id', currentWorkspace.id)
      .is('deleted_at', null) // ⭐ เปลี่ยนเป็น deleted_at
      .order('name', { ascending: true });

    if (fetchError) {
      console.error("Error fetching duty types:", fetchError);
      setError(fetchError.message);
      toast.error("ไม่สามารถโหลดประเภทเวรได้: " + fetchError.message);
    } else {
      setDutyTypes(data || []);
    }
    setLoading(false);
  }, [profile, userLoading, currentWorkspace, workspaceLoading, supabase]);

  // โหลด Duty Types เมื่อ loadDutyTypes เปลี่ยนแปลง
  useEffect(() => {
    loadDutyTypes();
  }, [loadDutyTypes]);

  // --- ฟังก์ชันเพิ่ม Duty Type ---
  const addDutyType = useCallback(async (name: string, color: string) => {
    if (!currentWorkspace?.id) {
      toast.error("กรุณาเลือก Workspace ก่อนเพิ่มประเภทเวร");
      return;
    }
    setLoading(true);
    setError(null);

    // ⭐ ตรวจสอบว่ามีประเภทเวรชื่อเดียวกันอยู่แล้วหรือไม่ (รวมถึงที่ถูกลบไปแล้ว)
    const { data: existingDutyTypes, error: checkError } = await supabase
      .from('duty_types')
      .select('id, name, deleted_at') // ⭐ เปลี่ยนเป็น deleted_at
      .eq('workspace_id', currentWorkspace.id)
      .eq('name', name); // ตรวจสอบจากชื่อ

    if (checkError) {
      console.error("Error checking existing duty type:", checkError);
      setError(checkError.message);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบประเภทเวร: " + checkError.message);
      setLoading(false);
      return;
    }

    if (existingDutyTypes && existingDutyTypes.length > 0) {
      const existingDutyType = existingDutyTypes[0];
      if (existingDutyType.deleted_at !== null) { // ⭐ เปลี่ยนเป็น deleted_at
        // ถ้าเคยถูกลบไปแล้ว ให้ทำการ "re-activate"
        const { data: reactivatedData, error: reactivateError } = await supabase
          .from('duty_types')
          .update({ deleted_at: null, color: color }) // ⭐ เปลี่ยนเป็น deleted_at
          .eq('id', existingDutyType.id)
          .select()
          .single();

        if (reactivateError) {
          console.error("Error reactivating duty type:", reactivateError);
          setError(reactivateError.message);
          toast.error("ไม่สามารถเปิดใช้งานประเภทเวรเดิมได้: " + reactivateError.message);
        } else if (reactivatedData) {
          setDutyTypes(prev => [...prev.filter(dt => dt.id !== reactivatedData.id), reactivatedData]);
          toast.success("เปิดใช้งานประเภทเวรเดิมแล้ว!");
        }
      } else {
        // มีอยู่แล้วและยัง Active
        toast.error("ประเภทเวรนี้มีอยู่แล้ว!");
      }
    } else {
      // ไม่มีอยู่ ทำการเพิ่มใหม่
      const { data, error: insertError } = await supabase
        .from('duty_types')
        .insert({
          name,
          color,
          workspace_id: currentWorkspace.id,
          deleted_at: null, // ⭐ เปลี่ยนเป็น deleted_at
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error adding duty type:", insertError);
        setError(insertError.message);
        toast.error("เพิ่มประเภทเวรไม่สำเร็จ: " + insertError.message);
      } else if (data) {
        setDutyTypes(prev => [...prev, data]);
        toast.success("เพิ่มประเภทเวรสำเร็จ!");
      }
    }
    setLoading(false);
  }, [currentWorkspace, supabase]);

  // --- ฟังก์ชันแก้ไข Duty Type ---
  const updateDutyType = useCallback(async (id: string, name: string, color: string) => {
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from('duty_types')
      .update({ name, color })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating duty type:", updateError);
      setError(updateError.message);
      toast.error("แก้ไขประเภทเวรไม่สำเร็จ: " + updateError.message);
    } else if (data) {
      setDutyTypes(prev => prev.map(dt => (dt.id === id ? data : dt)));
      toast.success("แก้ไขประเภทเวรสำเร็จ!");
    }
    setLoading(false);
  }, [supabase]);

  // --- ฟังก์ชันลบ Duty Type ---
  const deleteDutyType = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from('duty_types')
      // ⭐ เปลี่ยนเป็น update เพื่อทำ soft delete
      .update({ deleted_at: new Date().toISOString() }) // ⭐ เปลี่ยนเป็น deleted_at
      .eq('id', id);

    if (deleteError) {
      console.error("Error deleting duty type:", deleteError);
      setError(deleteError.message);
      toast.error("ลบประเภทเวรไม่สำเร็จ: " + deleteError.message);
    } else {
      // กรองประเภทเวรที่ถูกลบออกจาก state เพื่อไม่ให้แสดงผล
      setDutyTypes(prev => prev.filter(dt => dt.id !== id)); 
      toast.success("ลบประเภทเวรสำเร็จ!");
    }
    setLoading(false);
  }, [supabase]);

  return (
    <DutyTypeContext.Provider
      value={{
        dutyTypes,
        loading,
        addDutyType,
        updateDutyType,
        deleteDutyType,
        error,
      }}
    >
      {children}
    </DutyTypeContext.Provider>
  );
}

// --- Custom Hook สำหรับเรียกใช้ Context ---
export const useDutyType = () => {
  const context = useContext(DutyTypeContext);
  if (context === undefined) {
    throw new Error('useDutyType must be used within a DutyTypeProvider');
  }
  return context;
};
