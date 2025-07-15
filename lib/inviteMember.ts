// lib/inviteMember.ts

import { SupabaseClient } from '@supabase/supabase-js'

export async function inviteMember(
  supabase: SupabaseClient,
  email: string,
  workspaceId: string
): Promise<{ error: any | null }> {
  // 1. เช็คว่ามีอยู่แล้วไหม (แม้ถูกลบไปก่อนหน้า)
  const { data: existing, error: findError } = await supabase
    .from('members')
    .select('*')
    .eq('email', email)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (findError) {
    return { error: findError }
  }

  if (existing) {
    // 2. เคยมี → restore + reset
    const { error: updateError } = await supabase
      .from('members')
      .update({
        removed_at: null,
        status: 'invited',
        user_id: null,
        profile_user_id: null,
      })
      .eq('id', existing.id)

    return { error: updateError }
  }

  // 3. ไม่เคย → insert ใหม่
  const { error: insertError } = await supabase.from('members').insert([
    {
      email,
      workspace_id: workspaceId,
      status: 'invited',
    },
  ])

  return { error: insertError }
}
