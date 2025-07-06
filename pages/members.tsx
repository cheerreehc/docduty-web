// pages/members.tsx
import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

export default function MembersPage() {
  const [workspace, setWorkspace] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const supabase = createSupabaseClient(true);

  useEffect(() => {
    // โหลด workspace และสมาชิก
    const load = async () => {
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('members')
        .select('*, workspaces(name)')
        .eq('user_id', user.data.user?.id);

      if (data && data.length > 0) {
        setWorkspace(data[0].workspaces.name);
        setMembers(data);
      }
    };

    load();
  }, []);

  const inviteMember = async () => {
    // ส่งคำเชิญโดยเพิ่ม row ใหม่ใน members
    const user = await supabase.auth.getUser();
    const { data: myMember } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.data.user?.id)
      .single();

    await supabase.from('members').insert([
      {
        user_id: null, // ยังไม่รู้ user_id ของคนที่ถูกเชิญ
        workspace_id: myMember.workspace_id,
        role: 'pending',
        email, // เก็บ email ไว้ต่างหากถ้าอยาก track
      },
    ]);

    alert(`เชิญ ${email} สำเร็จ`);
    setEmail('');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">จัดการสมาชิก</h1>
      <p className="mt-2">Workspace: <strong>{workspace || 'ไม่พบ'}</strong></p>

      <div className="mt-4">
        <label>เชิญหมอด้วย Email</label>
        <div className="flex gap-2 mt-1">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 flex-1"
            placeholder="doctor@example.com"
          />
          <button onClick={inviteMember} className="bg-blue-500 text-white px-4 py-2">
            เชิญ
          </button>
        </div>
      </div>

      <table className="mt-6 w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-left">Role</th>
            <th className="border p-2 text-left">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td className="border p-2">{m.email || 'ยังไม่ตอบรับ'}</td>
              <td className="border p-2">{m.role}</td>
              <td className="border p-2">
                {m.user_id ? 'สมาชิก' : 'รอตอบรับ'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
