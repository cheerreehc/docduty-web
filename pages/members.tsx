// pages/members.tsx
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ChevronDown, Check } from "lucide-react";


const MySwal = withReactContent(Swal);

// สร้าง Type สำหรับข้อมูล Member เพื่อความปลอดภัย
type Member = {
  id: string;
  email: string | null;
  role: string | null;
  status: string | null; // เพิ่ม status เข้ามาใน Type
  user_id: string | null;
  removed_at: string | null; // เพิ่ม removed_at เข้ามาใน Type
};

export default function MembersPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const { currentWorkspace, currentRole, loading: workspaceLoading } = useWorkspace();

  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      if (workspaceLoading || !currentWorkspace) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: memberList, error } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .is('removed_at', null) // ⭐ กลับมาใช้ .is('removed_at', null) เพื่อไม่แสดงสมาชิกที่ถูกลบ
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching members:", error);
        toast.error("ไม่สามารถโหลดข้อมูลสมาชิกได้");
      } else {
        setMembers(memberList || []);
      }
      setLoading(false);
    };

    loadMembers();
  }, [currentWorkspace, workspaceLoading, supabase]);

  const invite = async () => {
    if (!email.trim() || !currentWorkspace) return;

    setLoading(true);
    const lowerCaseEmail = email.trim().toLowerCase();

    // ⭐ ตรวจสอบว่ามีสมาชิกด้วยอีเมลนี้อยู่แล้วหรือไม่ (รวมถึงที่ถูกลบไปแล้ว)
    const { data: existingMembers, error: fetchExistingError } = await supabase
      .from('members')
      .select('id, removed_at')
      .eq('email', lowerCaseEmail)
      .eq('workspace_id', currentWorkspace.id);

    if (fetchExistingError) {
      console.error("Error checking existing member:", fetchExistingError);
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบสมาชิก: ' + fetchExistingError.message);
      setLoading(false);
      return;
    }

    if (existingMembers && existingMembers.length > 0) {
      // พบสมาชิกเดิม (อาจจะถูกลบไปแล้ว) ทำการอัปเดตให้กลับมา active
      const existingMember = existingMembers[0];
      const { error: updateError } = await supabase
        .from('members')
        .update({ removed_at: null, status: 'active' }) // ⭐ เคลียร์ removed_at และตั้ง status เป็น active
        .eq('id', existingMember.id);

      if (updateError) {
        console.error("Error reactivating member:", updateError);
        toast.error('ไม่สามารถเปิดใช้งานสมาชิกเดิมได้: ' + updateError.message);
      } else {
        toast.success('สมาชิกเดิมถูกเปิดใช้งานแล้ว');
        setEmail('');
        // โหลดข้อมูลสมาชิกใหม่ทั้งหมด
        const { data: memberList, error: fetchError } = await supabase
          .from('members')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .is('removed_at', null)
          .order('created_at', { ascending: true });

        if (fetchError) {
          console.error("Error fetching members after reactivation:", fetchError);
          toast.error("ไม่สามารถโหลดข้อมูลสมาชิกได้หลังจากเปิดใช้งาน");
        } else {
          setMembers(memberList || []);
        }
      }
    } else {
      // ไม่มีสมาชิกด้วยอีเมลนี้ ทำการเพิ่มใหม่
      const { error: insertError } = await supabase.from('members').insert({
        email: lowerCaseEmail,
        workspace_id: currentWorkspace.id,
        role: 'viewer',
        status: 'pending', // ⭐ กำหนด status เริ่มต้นสำหรับสมาชิกใหม่
      });

      if (insertError) {
        console.error("Error inviting new member:", insertError);
        toast.error('เชิญสมาชิกไม่สำเร็จ: ' + insertError.message);
      } else {
        toast.success('เชิญสมาชิกสำเร็จแล้ว');
        setEmail('');
        // โหลดข้อมูลสมาชิกใหม่ทั้งหมด
        const { data: memberList, error: fetchError } = await supabase
          .from('members')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .is('removed_at', null)
          .order('created_at', { ascending: true });

        if (fetchError) {
          console.error("Error fetching members after invite:", fetchError);
          toast.error("ไม่สามารถโหลดข้อมูลสมาชิกได้หลังจากเชิญ");
        } else {
          setMembers(memberList || []);
        }
      }
    }
    setLoading(false);
  };

  const removeMember = async (memberId: string) => {
    if (currentRole !== 'owner') {
      toast.error("คุณไม่มีสิทธิ์ลบสมาชิก");
      return;
    }

    const memberToRemove = members.find(m => m.id === memberId);
    if (memberToRemove && profile?.id === memberToRemove.user_id) {
        toast.error("คุณไม่สามารถลบตัวเองได้!");
        return;
    }

    MySwal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "คุณต้องการลบสมาชิกคนนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#008191',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        const { error } = await supabase
          .from('members')
          .update({
            removed_at: new Date().toISOString(),
            status: 'removed' // ⭐ อัปเดต status เป็น 'removed'
          })
          .eq('id', memberId);

        if (error) {
          console.error("Error updating member:", error);
          toast.error('ไม่สามารถลบสมาชิกได้: ' + error.message);
          setLoading(false);
        } else {
          toast.success('ลบสมาชิกสำเร็จ');
          // โหลดข้อมูลใหม่ทั้งหมด โดยกรองเฉพาะสมาชิกที่ยังไม่ถูกลบ
          const { data: memberList, error: fetchError } = await supabase
            .from('members')
            .select('*')
            .eq('workspace_id', currentWorkspace?.id)
            .is('removed_at', null) // ⭐ ยังคงกรอง removed_at เพื่อไม่แสดงสมาชิกที่ถูกลบ
            .order('created_at', { ascending: true });

          if (fetchError) {
            console.error("Error fetching members after deletion:", fetchError);
            toast.error("ไม่สามารถโหลดข้อมูลสมาชิกได้หลังจากลบ");
          } else {
            setMembers(memberList || []);
          }
          setLoading(false);
        }
      }
    });
  };

  if (workspaceLoading || !currentWorkspace) {
    return (
      <>
        <div className="min-h-screen bg-[#F7FCFD]">
        <Header />
        <div className="pt-32 p-6 max-w-3xl mx-auto text-center">
          <p>กรุณาเลือก Workspace จากเมนูด้านบน</p>
        </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FCFD]">
      <Header />
      <div className="max-w-4xl mx-auto pt-32 px-4 pb-12">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-round mb-2">จัดการสมาชิก</h1>
        <p className="text-gray-500 mb-6">Workspace: <strong>{currentWorkspace.name}</strong></p>
        
        {currentRole === 'owner' && (
          <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
            <label className="font-semibold block">เชิญหมอด้วย Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                className="border border-gray-300 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[#008191]"
              />
              <button
                onClick={invite}
                className="px-4 py-2 rounded-md text-white font-semibold transition bg-[#008191] hover:bg-[#015A66]"
              >
                เชิญ
              </button>
            </div>
          </div>
        )}

        {/* ตารางสมาชิก */}
        <div className="w-full text-sm text-left border shadow rounded-md overflow-hidden">
          <div className="bg-gray-50 border-b">
            <div className="flex justify-between items-center p-3 font-semibold text-gray-600">
              <span className="flex-1">Email</span>
              <span className="w-24 text-center">บทบาท</span>
              <span className="w-24 text-center">สถานะ</span>
              {currentRole === 'owner' && <span className="w-20 text-right">จัดการ</span>}
            </div>
          </div>
          <div className="divide-y">
            {loading ? (
              <p className="p-4 text-center">กำลังโหลดสมาชิก...</p>
            ) : members.length > 0 ? (
              members.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-3 hover:bg-[#f8fafa]">
                  <span className="flex-1">{m.email || 'ยังไม่ตอบรับ'}</span>
                  <span className="w-24 text-center capitalize">{m.role}</span>
                  <span className="w-24 text-center">
                    <span className={
                      `px-3 py-1 rounded-full text-xs font-medium 
                      ${
                        // ⭐ ใช้ m.status ในการกำหนดสีและข้อความ
                        m.status === 'removed'
                          ? 'bg-red-100 text-red-700'
                          : m.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : m.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-200 text-gray-600'
                      }`
                    }>
                      {
                        // ⭐ ใช้ m.status ในการกำหนดข้อความ
                        m.status === 'removed'
                          ? 'ถูกลบ'
                          : m.status === 'active'
                          ? 'สมาชิก'
                          : m.status === 'pending'
                          ? 'รอตอบรับ'
                          : '—'
                      }
                    </span>
                  </span>
                  {currentRole === 'owner' && (
                    <span className="w-20 text-right">
                      <button
                        onClick={() => removeMember(m.id)}
                        className={`text-red-600 hover:text-red-800 ${profile?.id === m.user_id || m.status === 'removed' ? 'cursor-not-allowed opacity-50' : ''}`}
                        disabled={profile?.id === m.user_id || m.status === 'removed'} // ปิดการใช้งานปุ่มถ้าเป็นตัวเอง หรือถูกลบไปแล้ว
                      >
                        ลบ
                      </button>
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-gray-500">ยังไม่มีสมาชิกใน Workspace นี้</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}