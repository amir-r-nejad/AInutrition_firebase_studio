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
      throw new Error('Authentication failed. Please log in again.');

    if (!user) throw new Error('User session expired. Please log in again.');

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
      throw new Error(
        `Unable to update your profile information. Please verify your data and try again. Error: ${updateError.message}`
      );

    // Upsert coach data (insert or update)
    const { error: coachError } = await supabase
      .from('coaches')
      .update({
        ...coachInfo,
      })
      .eq('user_id', user.id)
      .single();

    if (coachError) {
      if (coachError.code === '23505')
        throw new Error(
          'Coach profile data conflicts with existing records. Please check your input and try again.'
        );

      if (coachError.code === 'PGRST116')
        throw new Error(
          'Coach profile not found. Please contact support for assistance.'
        );

      throw new Error(
        `Failed to save coach information. Please verify your data and try again. Error: ${coachError.message}`
      );
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch {
    throw new Error(
      'Onboarding process failed. Please check your connection and try again.'
    );
  }
}

export async function saveCoachProfile(profileData: CoachProfileFormValues) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError)
      throw new Error('Authentication failed. Please log in again.');

    if (!user) throw new Error('User session expired. Please log in again.');

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
      throw new Error(
        `Unable to update your profile information. Please verify your data and try again. Error: ${updateError.message}`
      );

    // Upsert coach data (insert or update)
    const { error: coachError } = await supabase
      .from('coaches')
      .update({
        ...coachInfo,
      })
      .eq('user_id', user.id)
      .single();

    if (coachError) {
      if (coachError.code === '23505')
        throw new Error(
          'Coach profile data conflicts with existing records. Please check your input and try again.'
        );

      if (coachError.code === 'PGRST116')
        throw new Error(
          'Coach profile not found. Please contact support for assistance.'
        );

      throw new Error(
        `Failed to update coach profile. Please verify your data and try again. Error: ${coachError.message}`
      );
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch {
    throw new Error(
      'Profile update failed. Please check your connection and try again.'
    );
  }
}
