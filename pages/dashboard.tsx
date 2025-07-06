import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createSupabaseClient } from '@/lib/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const supabase = createSupabaseClient(true); // ใช้ localStorage เพื่ออ่าน session เดิม

  useEffect(() => {
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session || !data.session.user.email) {
        router.push('/signin');
        return;
      }

      setUserEmail(data.session.user.email);
      setLoading(false);
    }

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('ออกจากระบบเรียบร้อยแล้ว');
    setTimeout(() => {
      setShowToast(false);
      router.push('/signin');
    }, 1500); // แสดง toast 1.5 วิ แล้วค่อย redirect
  };

  if (loading) return <p className="p-6">กำลังโหลด...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
      <div className="p-8 bg-white rounded shadow w-full max-w-md text-center">
        <h1 className="text-xl font-bold mb-4">ยินดีต้อนรับ 👋</h1>
        <p>คุณเข้าสู่ระบบด้วยอีเมล: <strong>{userEmail}</strong></p>

        <button
          onClick={handleLogout}
          className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Toast Container ต้องอยู่ในหน้าด้วย */}
      <ToastContainer
        position="bottom-center"
        autoClose={1800}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
}
