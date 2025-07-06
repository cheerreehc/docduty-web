import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { initUserAndWorkspace } from '@/lib/initUserAndWorkspace';
import { InviteMemberForm } from '@/components/InviteMemberForm';
import { inviteMember } from '@/lib/inviteMember';

export default function MembersPage() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createSupabaseClient(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


    useEffect(() => {
    initUserAndWorkspace(); // 👈 เรียกเช็ก/สร้าง workspace ก่อน

    supabase.auth.getUser().then(({ data }) => {
      setMyUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {

    setLoading(true);

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
        // .eq('status', 'active')
        // .order('created_at', { ascending: true });
        console.log('All members:', memberList);
        console.log('workspace_id:', myMember.workspace_id);
      setMembers(memberList || []);
    
      setLoading(false);
  }; //end of load()

  //invite function
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
        alert('อีเมลนี้เป็นสมาชิกอยู่แล้ว');
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
              alert('อีเมลนี้เป็นสมาชิกใน workspace นี้อยู่แล้ว');
            } else {
              alert('เกิดข้อผิดพลาด: ' + insertError.message);
            }
            return; 
          }
        }
      setEmail('');
      load();
    };//end of invite function

    //remove member 
    const removeMember = async (memberId: string) => {
      const confirmed = confirm('คุณแน่ใจว่าต้องการลบสมาชิกคนนี้ออกจาก workspace?');
      if (!confirmed) return;

      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      if (!userId) return;

      const { data: myMember } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!myMember || myMember.role !== 'owner') {
        alert('ไม่มีสิทธิ์ลบ');
        return;
      }

      if (myMember.id === memberId) {
        alert('ไม่สามารถลบตัวเองได้');
        return;
      }

      const { error } = await supabase
        .from('members')
        .update({ status: 'removed' })
        .eq('id', memberId)
        .eq('workspace_id', myMember.workspace_id); // กันลบข้าม workspace

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
      } else {
        alert('ลบสมาชิกแล้ว');
        load();
      }
    };//end of remove member

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">จัดการสมาชิก</h1>
      <p className="mb-4">Workspace: <b>{workspace || 'ไม่พบ'}</b></p>

      <div className="flex gap-2 items-center mb-6">
        <label>เชิญหมอด้วย Email</label>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="doctor@example.com"
          className="border p-2 w-full"
        />
        <button disabled={loading} onClick={invite} className="bg-blue-500 text-white px-4 py-2">
          {loading ? 'กำลังเชิญ...' : 'เชิญ'}
        </button>
      </div>
      {/* ตารางแสดงรายการ members */}
      <table className="border w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">สถานะ</th>
            <th className="border p-2 text-center">ลบ</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td className="border p-2">{m.email || 'ยังไม่ตอบรับ'}</td>
              <td className="border p-2">{m.role}</td>
              <td className="border p-2">
                {m.status === 'removed'
                    ? 'ถูกลบ'
                    : m.user_id
                    ? 'สมาชิก'
                    : m.email
                    ? 'รอตอบรับ'
                    : '—'}
                </td>
              <td className="border p-2 text-center">
                {m.user_id === myUserId ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-red-500 hover:underline"
                  >
                    ลบ
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* END OF รายการแสดง member */}
    </div>
  );
}
