'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CoachProfileFormValues } from '../schemas/coachSchemas';
import { editProfile } from '@/features/profile/actions/apiUserProfile';

export async function saveCoachOnboarding(
  onboardingData: CoachProfileFormValues & { user_role: 'coach' }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError)
      throw new Error(`Authentication error: ${authError.message}`);

    if (!user) throw new Error('Unauthorized access!');

    const { age, first_name, last_name, user_role, ...coachInfo } =
      onboardingData;

    // Update profile
    await editProfile({ age, user_role, is_onboarding_complete: true });

    // Update user data
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: `${first_name} ${last_name}`,
      },
    });

    if (updateError)
      throw new Error(`Failed to update user: ${updateError.message}`);

    // Upsert coach data (insert or update)
    const { error: coachError } = await supabase
      .from('coaches')
      .update({
        ...coachInfo,
      })
      .eq('user_id', user.id)
      .single();

    if (coachError)
      throw new Error(`Failed to save coach data: ${coachError.message}`);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('saveCoachOnboarding error:', error);
    throw error;
  }
}

export async function svaeCoachProfile(profileData: CoachProfileFormValues) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError)
      throw new Error(`Authentication error: ${authError.message}`);

    if (!user) throw new Error('Unauthorized access!');

    const { age, first_name, last_name, ...coachInfo } = profileData;

    // Update profile
    await editProfile({ age });

    // Update user data
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: `${first_name} ${last_name}`,
      },
    });

    if (updateError)
      throw new Error(`Failed to update user: ${updateError.message}`);

    // Upsert coach data (insert or update)
    const { error: coachError } = await supabase
      .from('coaches')
      .update({
        ...coachInfo,
      })
      .eq('user_id', user.id)
      .single();

    if (coachError)
      throw new Error(`Failed to save coach data: ${coachError.message}`);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('saveCoachOnboarding error:', error);
    throw error;
  }
}
