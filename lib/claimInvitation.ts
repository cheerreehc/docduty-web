// lib/claimInvitation.ts
import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function claimPendingInvitations(supabase: SupabaseClient, user: User) {
  if (!user.email) return;

  const userEmail = user.email.trim().toLowerCase();

  // --- DEBUGGING STEP: เพิ่มโค้ดส่วนนี้เข้าไป ---
  // console.log(`[DEBUG] 1. กำลังค้นหาคำเชิญด้วย SELECT สำหรับ: '${userEmail}'`);
  const { data: foundInvitation, error: findError } = await supabase
    .from('members')
    .select('id, email, user_id') // เลือกคอลัมน์ที่เราใช้เป็นเงื่อนไข
    .eq('email', userEmail)
    .is('user_id', null);

  if (findError) {
    // console.error('[DEBUG] 2. เกิด Error ระหว่างการ SELECT:', findError);
    return;
  }

  if (!foundInvitation || foundInvitation.length === 0) {
    // console.log('[DEBUG] 2. ผลการ SELECT: ไม่พบคำเชิญที่ตรงเงื่อนไข (นี่คือจุดที่น่าจะเป็นปัญหา)');
    return;
  }

  // console.log(`[DEBUG] 2. ผลการ SELECT: ✅ พบคำเชิญที่ตรงเงื่อนไข:`, foundInvitation[0]);
  // --- END OF DEBUGGING STEP ---


  // ถ้าการ SELECT สำเร็จ ค่อยลอง UPDATE
  // console.log(`[DEBUG] 3. กำลังจะ UPDATE แถวที่มี id: ${foundInvitation[0].id}`);
  const { data, error } = await supabase
    .from('members')
    .update({
      user_id: user.id,
      status: 'active',
    })
    .eq('id', foundInvitation[0].id) // เปลี่ยนมาอัปเดตด้วย id ที่เจอโดยตรง
    .select();

  if (error) {
    // console.error('[DEBUG] 4. เกิด Error ระหว่างการ UPDATE:', error);
  } else {
    if (data && data.length > 0) {
      // console.log(`[DEBUG] 4. ✅ UPDATE สำเร็จ! ข้อมูลใหม่:`, data[0]);
    } else {
      // console.log('[DEBUG] 4. 🟡 UPDATE ทำงาน แต่ไม่กระทบแถวข้อมูลใดๆ');
    }
  }
}