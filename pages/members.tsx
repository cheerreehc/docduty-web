import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { initUserAndWorkspace } from '@/lib/initUserAndWorkspace';

export default function MembersPage() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const supabase = createSupabaseClient(true);

    useEffect(() => {
    initUserAndWorkspace(); // 👈 เรียกเช็ก/สร้าง workspace ก่อน
  }, []);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {

    const { data: user } = await supabase.auth.getUser();
      const { data: myMember } = await supabase
        .from('members')
        .select('*, workspaces(name)')
        .eq('user_id', user?.user?.id)
        .single();

      if (!myMember) return;

      setWorkspace(myMember.workspaces?.name || 'ไม่พบ');

      const { data: memberList } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', myMember.workspace_id);

      setMembers(memberList || []);
    };

    const invite = async () => {
      const { data: user } = await supabase.auth.getUser();

      const { data: myMember } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user?.user?.id)
        .single();

      if (!myMember) return;

      await supabase.from('members').insert({
        email,
        workspace_id: myMember.workspace_id,
        role: 'viewer',
      });

      setEmail('');
      load();
  };

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
        <button onClick={invite} className="bg-blue-500 text-white px-4 py-2">
          เชิญ
        </button>
      </div>

      <table className="border w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td className="border p-2">{m.email || 'ยังไม่ตอบรับ'}</td>
              <td className="border p-2">{m.role}</td>
              <td className="border p-2">{m.user_id ? 'สมาชิก' : 'รอตอบรับ'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
