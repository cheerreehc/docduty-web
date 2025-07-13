// lib/inviteMember.ts
import { createClient } from '@/utils/supabase/client'
import { toast } from 'react-toastify';

export async function inviteMember(email: string, workspaceId: string, role = 'viewer') {
  const supabase = createClient();

  // ดึง user ปัจจุบัน
  const { data: userData } = await supabase.auth.getUser();
  const currentUser = userData?.user;
  if (!currentUser) {
    toast.error('ยังไม่ได้เข้าสู่ระบบ');
    return;
  }

  // ห้ามเชิญตัวเอง
  if (email.toLowerCase() === currentUser.email?.toLowerCase()) {
    toast.error('ไม่สามารถเชิญตัวเองได้');
    return;
  }

  // ตรวจว่ามีการเชิญไปแล้วหรือยัง
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    toast.warning('อีเมลนี้ถูกเชิญแล้ว');
    return;
  }

  // บันทึกคำเชิญ
  const { error } = await supabase.from('members').insert({
    email,
    workspace_id: workspaceId,
    role,
    status: 'invited',
    user_id: null, // ยังไม่รู้ user_id
  });

  if (error) {
    toast.error('เกิดข้อผิดพลาดในการเชิญ');
    console.error(error);
    return;
  }

  toast.success(`เชิญไปยัง ${email} เรียบร้อยแล้ว`);
}
