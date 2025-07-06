// components/InviteMemberForm.tsx
import { useState } from 'react';
import { inviteMember } from '@/lib/inviteMember';

export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState('');

  const handleInvite = async () => {
    if (!email) return;
    await inviteMember(email, workspaceId);
    setEmail('');
  };

  return (
    <div className="space-y-2">
      <input
        type="email"
        value={email}
        placeholder="กรอกอีเมลเพื่อเชิญ"
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <button
        onClick={handleInvite}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        เชิญสมาชิก
      </button>
    </div>
  );
}
