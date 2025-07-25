'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function editPlan(newPlan: any) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError)
      throw new Error(`Authentication error: ${authError.message}`);
    if (!user) throw new Error('Unauthorized access!');

    const { error } = await supabase
      .from('smart_plan')
      .update(newPlan)
      .eq('user_id', user.id)

    if (error) throw new Error(`Plan update failed: ${error.message}`);

    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('editPlan error:', error);
    throw new Error('Failed to update plan');
  }
}
