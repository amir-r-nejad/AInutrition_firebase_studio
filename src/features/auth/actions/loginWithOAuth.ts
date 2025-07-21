import { createClient } from '@/lib/supabase/client';
import { getURL } from '@/lib/utils';

export async function loginWithGoogle() {
  const redirectTo = `${getURL()}api/auth/callback`;

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) throw new Error(`Google sign-in failed: ${error.message}`);
}
