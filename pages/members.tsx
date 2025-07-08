import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { initUserAndWorkspace } from '@/lib/initUserAndWorkspace';
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import WorkspaceName from '@/components/WorkSpaceName';
import Header from "@/components/Header";


const MySwal = withReactContent(Swal)

export default function MembersPage() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createSupabaseClient(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);

  useEffect(() => {
    initUserAndWorkspace(); // 👈 เรียกเช็ก/สร้าง workspace ก่อน

    supabase.auth.getUser().then(({ data }) => {
      setMyUserId(data.user?.id || null);
    });
    
    load();

  }, []); 
  // End useEffect 

  // LOAD FUCTION
  const load = async () => {
    const me = members.find((m) => m.user_id === myUserId);
    setMyRole(me?.role || null);

    setLoading(true);

    // loading member in workspace
    const { data: user } = await supabase.auth.getUser();
    const { data: myMember } = await supabase
      .from('members')
      .select('*, workspaces(name)')
      .eq('user_id', user?.user?.id)
      .single();

    if (!myMember) return;
    if (!user?.user?.id) return;

    setWorkspace(myMember.workspaces?.name || 'ไม่พบ');

    const { data: memberList } = await supabase
      .from('members')
      .select('*')
      .eq('workspace_id', myMember.workspace_id)
      .eq('status', 'active')
      .order('created_at', { ascending: true });
      console.log('All members:', memberList);
      console.log('workspace_id:', myMember.workspace_id);
    setMembers(memberList || []);
    // [members, myUserId]
    setLoading(false);
  }; 
  //end of load()

  //INVITE MEMBER FUNCTION
  const invite = async () => {
    const { data: user } = await supabase.auth.getUser();
    const myId = user?.user?.id;
    console.log('🔐 myID : ', myId)
    if (!myId) return;

    const { data: myMember } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', myId)
      .single();

    console.log('🔐 myMember : ', myMember)
    if (!myMember) return;

    // 1. เช็กว่ามี email นี้อยู่ใน workspace เดียวกันหรือไม่ (active)
    const { data: existing } = await supabase
      .from('members')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('workspace_id', myMember.workspace_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      toast.error('อีเมลนี้เป็นสมาชิกอยู่แล้ว');
      return;
    }

    // 2. ถ้ามีในสถานะ removed → update เป็น active
    const { data: removed } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .eq('workspace_id', myMember.workspace_id)
      .eq('status', 'removed')
      .maybeSingle();

    if (removed) {
      await supabase
        .from('members')
        .update({ status: 'active', role: 'viewer' })
        .eq('id', removed.id);
    } else {
      // 3. insert ใหม่
        const { error: insertError } = await supabase.from('members').insert({
          email : normalizedEmail,
          workspace_id: myMember.workspace_id,
          role: 'viewer',
          status: 'active',
        });

        if (insertError) {
          if (insertError.code === '23505') {
            toast.error('อีเมลนี้เป็นสมาชิกใน workspace นี้อยู่แล้ว');
          } else {
            toast.error('เกิดข้อผิดพลาด: ' + insertError.message);
          }
          return; 
        }
      }
    MySwal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'ส่งคำเชิญสำเร็จ',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    })
    setEmail('');
    load();
  };
  //end of invite function

  //REMOVE MEMBER FUNCTION
  const removeMember = async (memberId: string) => {
    const confirmed = await MySwal.fire({
      title: 'ลบสมาชิกคนนี้?',
      text: 'คุณแน่ใจว่าต้องการลบสมาชิกคนนี้ออกจาก workspace?\nเมื่อลบแล้วสามารถเชิญอีเมลนี้ใหม่ได้ภายหลัง',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      reverseButtons: true,
    }).then((result) => result.isConfirmed)

    if (!confirmed) return

    const { data: user } = await supabase.auth.getUser()
    const userId = user?.user?.id
    if (!userId) return

    const { data: myMember } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!myMember || myMember.role !== 'owner') {
      MySwal.fire('ไม่มีสิทธิ์ลบ', '', 'error')
      return
    }

    if (myMember.id === memberId) {
      MySwal.fire('ไม่สามารถลบตัวเองได้', '', 'error')
      return
    }

    const { error } = await supabase
      .from('members')
      .update({ status: 'removed', removed_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('workspace_id', myMember.workspace_id)

    console.log('workspace ID ที่ใช้ลบ:', myMember.workspace_id)
    console.log('🧪 ลบแล้ว:', memberId, error)

    if (error) {
      MySwal.fire('เกิดข้อผิดพลาด', error.message, 'error')
    } else {
      toast.success('ลบสมาชิกแล้ว')
      load()
    }
  }
  //end of remove member

  //UPDATE YEAR LEVEL FUNCTION
  const updateYearLevel = async (memberId: string, yearLevel: string) => {
    const { error } = await supabase
      .from('members')
      .update({ year_level: yearLevel })
      .eq('id', memberId);

    if (error) {
      toast.error('อัปเดตชั้นปีไม่สำเร็จ');
    } else {
      toast.success('อัปเดตชั้นปีเรียบร้อย');
      load(); // โหลดใหม่
    }
  };
  // end of update year level

  const updateWorkspaceName = async (newName: string) => {
    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id;
    if (!userId) return;

    const { data: myMember } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single();

    if (!myMember) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขชื่อ workspace');
      return;
    }

    if (!newName.trim()) {
      toast.error('กรุณาใส่ชื่อใหม่');
      return;
    }

    const { data, error } = await supabase
      .from('workspaces')
      .update({ name: newName })
      .eq('id', myMember.workspace_id)
      .select(); // ← ต้องมี select() ถ้าอยากได้ข้อมูลกลับมา

    if (error) {
      console.error('❌ update error:', error);
    } else {
      console.log('✅ update สำเร็จ:', data); // ค่านี้จะไม่ว่างแล้ว
    }

    // ✅ ดึงชื่อใหม่มาตั้งค่าใน UI
   if (!error) {
      setWorkspace(data?.[0]?.name ?? newName);
    }

    console.log('🧪 อัปเดตชื่อ workspace:', newName);
    console.log('📦 workspace ID:', myMember.workspace_id);
  };
  //end of update workspace name 

  return (
    <>
    <Header />
    <div className="pt-32 p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold font-round mb-2">จัดการสมาชิก</h1>
       {/* WORKSPACE NAME LOGIC */}
       <WorkspaceName
          workspace={workspace || ''}
          updateWorkspaceName={updateWorkspaceName}
        />
       {/* ENDOF WORKSPACE NAME LOGIC */}
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
            disabled={loading}
            onClick={invite}
            className={`px-4 py-2 rounded-md text-white font-semibold transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#008191] hover:bg-[#015A66]'
            }`}
          >
            {loading ? 'กำลังเชิญ...' : 'เชิญ'}
          </button>
        </div>
      </div>

      {/* ตารางสมาชิก */}
      <table className="w-full text-sm text-left border shadow rounded-md overflow-hidden">
        <thead className="bg-[#f0fafa] text-gray-700 font-medium">
          <tr>
            <th className="p-3">Email</th>
            <th className="p-3">Year</th>
            <th className="p-3">Role</th>
            <th className="p-3">สถานะ</th>
            <th className="p-3 text-center">ลบ</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-[#f8fafa]">
              <td className="p-3">{m.email || 'ยังไม่ตอบรับ'}</td>
              {/* ✅ ชั้นปี */}
              <td className="p-2">
                {typeof myRole !== 'undefined' ? (
                  <select
                    className="text-sm border rounded p-1"
                    value={m.year_level || ''}
                    onChange={(e) => updateYearLevel(m.id, e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="Extern">Extern</option>
                    <option value="Intern">Intern</option>
                    <option value="R1">R1</option>
                    <option value="R2">R2</option>
                    <option value="R3">R3</option>
                    <option value="Staff">Staff</option>
                  </select>
                ) : (
                  m.year_level || '—'
                )}
            </td>
              <td className="p-3 capitalize">{m.role}</td>
              <td className="p-3">
                <span className={
                  `px-3 py-1 rounded-full text-xs font-medium 
                  ${
                    m.status === 'removed'
                      ? 'bg-red-100 text-red-700'
                      : m.user_id
                      ? 'bg-green-100 text-green-700'
                      : m.email
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-200 text-gray-600'
                  }`
                }>
                  {
                    m.status === 'removed'
                      ? 'ถูกลบ'
                      : m.user_id
                      ? 'สมาชิก'
                      : m.email
                      ? 'รอตอบรับ'
                      : '—'
                  }
                </span>
              </td>
              <td className="p-3 text-center">
                {m.user_id === myUserId ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    ลบ
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
  );
}
