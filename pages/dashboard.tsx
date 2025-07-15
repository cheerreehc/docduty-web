// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, parseISO, isAfter } from 'date-fns';
import Header from '@/components/Header';
import { useUser } from '@/contexts/UserContext';
import { createClient } from '@/utils/supabase/client';
import { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@/utils/supabase/server';

// เพิ่ม Type นี้เข้าไปใต้นิยาม GetServerSideProps
type Invitation = {
  workspace_id: string;
  workspace_name: string;
  member_id: string;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('✅ SSR session user:', user?.id)

  if (!user) {
    return {
      redirect: {
        destination: '/signin?redirectedFrom=/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading, isSessionLoading } = useUser();
  // const [shifts, setShifts] = useState<any[]>([]);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const supabase = createClient();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptInvitation = async () => {
  if (!invitation) return;

  setIsAccepting(true);
  
  // 👇 เปลี่ยนมาเรียก RPC Function ที่เราสร้างขึ้น
  const { error } = await supabase.rpc('accept_invitation', {
      invite_id: invitation.member_id
    });

    if (error) {
      alert('เกิดข้อผิดพลาดในการรับคำเชิญ: ' + error.message);
    } else {
      alert('เข้าร่วม Workspace สำเร็จ! กำลังรีเฟรชหน้า...');
      window.location.reload();
    }
    setIsAccepting(false);
  };

  useEffect(() => {
    if (!loading && !isSessionLoading && profile === null) {
      router.push('/signin?redirectedFrom=/dashboard');
    }
  }, [profile, loading, isSessionLoading]);

  // useEffect(() => {
  //   async function loadData() {
  //     if (!profile) return;

  //     // const { data: userShifts } = await supabase
  //     //   .from('shifts')
  //     //   .select('date, duty_type')
  //     //   .contains('doctor_ids', [profile.id])
  //     //   .order('date', { ascending: true });

  //     // setShifts(userShifts || []);

  //     const { data: member } = await supabase
  //       .from('members')
  //       .select('workspace_id')
  //       .eq('user_id', profile.id)
  //       .single();

  //     if (member?.workspace_id) {
  //       const { data: workspace } = await supabase
  //         .from('workspaces')
  //         .select('name')
  //         .eq('id', member.workspace_id)
  //         .single();

  //       if (workspace?.name) {
  //         setWorkspaceName(workspace.name);
  //       }
  //     }
  //   }

  //   loadData();
  // }, [profile, supabase]);

  useEffect(() => {
    async function loadData() {
      if (!profile) return;

      // 1. ตรวจสอบก่อนว่า user เป็น member อยู่แล้วหรือไม่
      const { data: member } = await supabase
        .from('members')
        .select('workspace_id, workspaces(name)') // ดึงชื่อมาเลยทีเดียว
        .eq('user_id', profile.id)
        .maybeSingle(); // ใช้ maybeSingle ป้องกัน error

      if (member && member.workspaces) {
          // ตรวจสอบก่อนว่า workspaces เป็น Array หรือไม่
          const ws = Array.isArray(member.workspaces) ? member.workspaces[0] : member.workspaces;
          
          // ดึงค่า name จาก object ที่ผ่านการตรวจสอบแล้ว
          setWorkspaceName(ws?.name ?? null);
        } else {
        // 👇 *** ส่วนที่เพิ่มเข้ามา *** 👇
        // 2. ถ้ายังไม่เป็น member ให้ลองค้นหาคำเชิญที่ค้างอยู่
        const { data: pendingInvite } = await supabase.rpc('get_pending_invitation');

        if (pendingInvite && pendingInvite.length > 0) {
          setInvitation(pendingInvite[0]);
        }
      }
    }

    loadData();
  }, [profile, supabase]);

  if (loading || !profile) return <p className="p-6">กำลังโหลด...</p>;

  const today = new Date();
  // const nextShift = shifts.find((shift) => isAfter(parseISO(shift.date), today));

  return (
    <div className="min-h-screen bg-[#F7FCFD]">
      <Header />
      <div className="max-w-3xl mx-auto pt-32 px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <h1 className="text-2xl font-bold text-[#00677F]">ยินดีต้อนรับ 👋</h1>
          <p className="text-gray-700">คุณเข้าสู่ระบบด้วยอีเมล: <strong>{profile.email}</strong></p>

          {/* ส่วนจัดการ Workspace และ Invitation */}
          {workspaceName ? (
            // Case 1: User มี Workspace แล้ว
            <p className="text-sm text-gray-500">Workspace: <strong>{workspaceName}</strong></p>
          ) : invitation ? (
            // Case 2: User ไม่มี Workspace แต่มีคำเชิญ
            <div className="mt-6 p-4 border border-green-300 bg-green-50 rounded-lg text-sm text-green-900">
              <p className="font-semibold">คุณถูกเชิญให้เข้าร่วม Workspace "{invitation.workspace_name}"</p>
              <button
                onClick={handleAcceptInvitation}
                disabled={isAccepting}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                {isAccepting ? 'กำลังเข้าร่วม...' : '✅ รับคำเชิญ'}
              </button>
            </div>
          ) : (
            // Case 3: User ไม่มีอะไรเลย
            <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg text-sm text-yellow-900">
              <p>⚠️ คุณยังไม่ได้เข้าร่วม workspace ใดเลย</p>
              <button
                onClick={() => router.push('/create-workspace')}
                className="mt-3 bg-[#008191] text-white px-4 py-2 rounded hover:bg-[#015A66] transition"
              >
                + สร้าง workspace ใหม่
              </button>
            </div>
          )}
          {/* END of ส่วน Workspace */}
  
        </div>
      </div>

      <ToastContainer
        position="bottom-center"
        autoClose={1800}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
}
