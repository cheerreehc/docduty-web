import { createSupabaseClient } from '@/lib/supabase';

export async function signUp(email: string, password: string) {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}
