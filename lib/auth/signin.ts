import { createSupabaseClient } from '@/lib/supabase';

export async function signIn(email: string, password: string, rememberMe = true) {
  const client = createSupabaseClient(rememberMe);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
