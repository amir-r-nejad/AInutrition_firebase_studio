'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function editPlan(newPlan: any, clientId?: string) {
  try {
    const supabase = await createClient();

    let targetUserId;

    if (clientId) targetUserId = clientId;
    else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError)
        throw new Error(`Authentication error: ${authError.message}`);
      if (!user) throw new Error('Unauthorized access!');

      targetUserId = user.id;
    }

    // First check if profile exists
    const { data: profileExists } = await supabase
      .from('profile')
      .select('user_id')
      .eq('user_id', targetUserId)

    if (!profileExists) {
      throw new Error('Profile must be created before saving plan');
    }

    // Filter out null, undefined, and empty string values
    const filteredPlan = Object.entries(newPlan).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const { error } = await supabase
      .from('smart_plan')
      .update(filteredPlan)
      .eq('user_id', targetUserId);

    if (error) throw new Error(`Plan update failed: ${error.message}`);

    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('editPlan error:', error);
    throw new Error('Failed to update plan');
  }
}