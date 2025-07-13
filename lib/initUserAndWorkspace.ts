// lib/initUserAndWorkspace.ts
import { createClient } from '@/utils/supabase/client'

export async function initUserAndWorkspace() {
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    console.warn('ยังไม่ได้ login');
    return;
  }

  // เช็กว่าผู้ใช้นี้มี members อยู่แล้วหรือยัง
  const { data: existing, error: existingError } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError) {
    console.error('ตรวจสอบสมาชิกล้มเหลว', existingError);
    return;
  }

  if (existing) {
    console.log('ผู้ใช้มี workspace แล้ว ไม่ต้องสร้างใหม่');
    return;
  }

  // ✅ สร้าง workspace ใหม่
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ name: `${user.email}'s Workspace` })
    .select()
    .single();

  if (wsError || !workspace) {
    console.error('สร้าง workspace ไม่สำเร็จ', wsError);
    return;
  }

  // ✅ ใส่ตัวเองเป็นสมาชิก (owner)
  const { error: insertError } = await supabase.from('members').insert({
    user_id: user.id,
    email: user.email,
    workspace_id: workspace.id,
    role: 'owner',
  });

  if (insertError) {
    console.error('เพิ่มสมาชิกไม่สำเร็จ', insertError);
    return;
  }

  console.log('✅ สร้าง workspace และสมาชิก owner สำเร็จ');

  // 👉 reload หน้าปัจจุบันเพื่อให้ data ใหม่แสดงผล
  if (typeof window !== 'undefined') {
    location.reload();
  }
}
