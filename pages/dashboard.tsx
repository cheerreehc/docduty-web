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

  useEffect(() => {
    if (!loading && !isSessionLoading && profile === null) {
      router.push('/signin?redirectedFrom=/dashboard');
    }
  }, [profile, loading, isSessionLoading]);

  useEffect(() => {
    async function loadData() {
      if (!profile) return;

      // const { data: userShifts } = await supabase
      //   .from('shifts')
      //   .select('date, duty_type')
      //   .contains('doctor_ids', [profile.id])
      //   .order('date', { ascending: true });

      // setShifts(userShifts || []);

      const { data: member } = await supabase
        .from('members')
        .select('workspace_id')
        .eq('user_id', profile.id)
        .single();

      if (member?.workspace_id) {
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', member.workspace_id)
          .single();

        if (workspace?.name) {
          setWorkspaceName(workspace.name);
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
          {workspaceName && (
            <p className="text-sm text-gray-500">Workspace: <strong>{workspaceName}</strong></p>
          )}

          {/* <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h2 className="text-sm text-blue-800 font-semibold">📆 เวรถัดไป</h2>
            {nextShift ? (
              <p className="text-gray-800 mt-1 text-sm">
                {format(parseISO(nextShift.date), 'EEEE dd MMM yyyy')} — {nextShift.duty_type}
              </p>
            ) : (
              <p className="text-gray-500 text-sm">ยังไม่มีเวรถัดไป</p>
            )}
          </div> */}
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
