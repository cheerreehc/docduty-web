// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '@/components/Header';
import { useUser } from '@/contexts/UserContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { createClient } from '@/utils/supabase/client';
import { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { Crown, Users, ChevronRight } from 'lucide-react';

// --- ประเภทข้อมูลที่ใช้ในหน้านี้ ---
type Invitation = {
  workspace_id: string;
  workspace_name: string;
  member_id: string;
};

// ประเภทข้อมูลสำหรับสมาชิก (เพื่อใช้ตรวจสอบสถานะการลบ)
type MemberStatus = {
  id: string;
  removed_at: string | null;
  user_id: string | null;
  email: string | null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/signin?redirectedFrom=/dashboard',
        permanent: false,
      },
    };
  }
  return { props: {} };
};

export default function DashboardPage() {
  const supabase = createClient();
  const { profile, loading: userLoading } = useUser();
  const { memberships, currentWorkspace, switchWorkspace, loading: workspaceLoading } = useWorkspace();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // --- useEffect สำหรับค้นหาคำเชิญ (เมื่อไม่มี Workspace ที่ Active เท่านั้น) ---
  useEffect(() => {
    // จะทำงานก็ต่อเมื่อ user และ workspace โหลดเสร็จแล้ว และ user ยังไม่มี membership ที่ active
    if (!userLoading && !workspaceLoading && profile && memberships.length === 0) {
      const checkForInvitation = async () => {
        const { data: inviteData, error: inviteError } = await supabase.rpc('get_pending_invitation');

        if (inviteError) {
          console.error("Error fetching pending invitation RPC:", inviteError);
          setInvitation(null);
          return;
        }

        if (inviteData && inviteData.length > 0) {
          const fetchedInvitation: Invitation = inviteData[0];

          // ⭐ เพิ่มการตรวจสอบสถานะ removed_at ของสมาชิกที่ถูกเชิญ
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id, removed_at, user_id, email') // เลือกคอลัมน์ที่จำเป็น
            .eq('id', fetchedInvitation.member_id)
            .eq('workspace_id', fetchedInvitation.workspace_id)
            .single<MemberStatus>(); // คาดหวังผลลัพธ์เดียว

          if (memberError) {
            console.error("Error fetching member status for invitation:", memberError);
            setInvitation(null); // ไม่พบข้อมูลสมาชิกที่ถูกต้อง
            return;
          }

          // ถ้าพบข้อมูลสมาชิกและ removed_at เป็น null (คือยังไม่ถูกลบ)
          if (memberData && memberData.removed_at === null) {
            setInvitation(fetchedInvitation);
          } else {
            // ถ้าถูกลบไปแล้ว หรือไม่พบข้อมูลสมาชิกที่ตรงกัน
            setInvitation(null);
          }
        } else {
          setInvitation(null); // เคลียร์ค่าเก่าถ้าไม่เจอคำเชิญ
        }
      };
      checkForInvitation();
    }
  }, [userLoading, workspaceLoading, profile, memberships, supabase]);


  // --- ฟังก์ชันสำหรับจัดการ Event (ปรับปรุงการแจ้งเตือน) ---
  const handleAcceptInvitation = async () => {
    if (!invitation) return;
    setIsAccepting(true);
    const { error } = await supabase.rpc('accept_invitation', {
      invite_id: invitation.member_id
    });
    if (error) {
      toast.error('เกิดข้อผิดพลาดในการรับคำเชิญ: ' + error.message);
    } else {
      toast.success('เข้าร่วม Workspace สำเร็จ! กำลังรีเฟรชหน้า...');
      window.location.reload();
    }
    setIsAccepting(false);
  };

  // --- ส่วนแสดงผลขณะโหลด ---
  if (userLoading || workspaceLoading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="p-6">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FCFD]">
      <Header />
      <div className="max-w-4xl mx-auto pt-32 px-4 pb-12">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
          
          {/* --- ส่วนหัวของ Dashboard --- */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#00677F]">ยินดีต้อนรับ 👋</h1>
              <p className="text-gray-600">คุณเข้าสู่ระบบด้วยอีเมล: <strong>{profile.email}</strong></p>
            </div>
            <Link
              href="/create-workspace"
              className="w-full md:w-auto text-center bg-[#008191] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#015A66] transition shadow"
            >
              + สร้าง Workspace ใหม่
            </Link>
          </div>

          {/* --- ส่วนแสดงผลหลัก --- */}
          <div className="mt-6 space-y-4">
            {memberships.length > 0 ? (
              // Case 1: User มี Workspace แล้ว (เฉพาะที่ Active)
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Workspace ของคุณ</h2>
                <div className="space-y-3">
                  {memberships.map((membership) => (
                      <button 
                        key={membership.workspaces.id} 
                        onClick={() => switchWorkspace(membership.workspaces.id)}
                        className={`w-full flex items-center justify-between p-4 border rounded-lg transition text-left ${currentWorkspace?.id === membership.workspaces.id ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200' : 'hover:bg-gray-50'}`}
                      >
                        <span className="font-medium text-gray-700">{membership.workspaces.name}</span>
                        <div className="flex items-center gap-4">
                          {membership.workspaces.created_by === profile.id ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                              <Crown size={14} />
                              Owner
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
                              <Users size={14} />
                              Member
                            </span>
                          )}
                          <ChevronRight size={20} className="text-gray-400" />
                        </div>
                      </button>
                  ))}
                </div>
              </div>
            ) : invitation ? (
              // Case 2: User ไม่มี Workspace ที่ Active แต่มีคำเชิญที่รอดำเนินการ
              <div className="p-4 border border-green-300 bg-green-50 rounded-lg text-green-900">
                <p className="font-semibold">คุณถูกเชิญให้เข้าร่วม Workspace "{invitation.workspace_name}"</p>
                <button
                  onClick={handleAcceptInvitation}
                  disabled={isAccepting}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  {isAccepting ? 'กำลังเข้าร่วม...' : '✅ รับคำเชิญ'}
                </button>
              </div>
            ) : (
              // Case 3: User ไม่มี Workspace ที่ Active และไม่มีคำเชิญที่รอดำเนินการ
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg text-blue-800">
                <p>⚠️ คุณยังไม่ได้เข้าร่วมหรือสร้าง Workspace ใดๆ เลย</p>
                <p className="text-sm mt-1">ลองสร้าง Workspace ใหม่เพื่อเริ่มต้นใช้งานได้เลย</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-center" autoClose={1800} hideProgressBar={false} closeOnClick pauseOnHover draggable theme="colored" />
    </div>
  );
}
