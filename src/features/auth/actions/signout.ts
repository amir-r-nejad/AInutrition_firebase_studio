'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signoutAction() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (!error) {
    revalidatePath('/', 'layout');
    redirect('/login');
  }
}
