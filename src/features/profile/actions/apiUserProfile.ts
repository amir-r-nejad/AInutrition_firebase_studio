'use server';

import { createClient } from '@/lib/supabase/server';
import { UserAttributes } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { editPlan } from './apiUserPlan';

export async function editProfile(
  newProfile: any,
  newUser?: UserAttributes,
  userId?: string
) {
  try {
    const supabase = await createClient();

    let targetUserId;

    if (userId) targetUserId = userId;
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

    // Filter out null, undefined, and empty string values to prevent enum validation errors
    const filteredProfile = Object.entries(newProfile).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const { error } = await supabase
      .from('profile')
      .update(filteredProfile)
      .eq('user_id', targetUserId)
      .single();

    if (error)
      throw new Error(
        `Profile update failed: ${error.code} - ${error.message}`
      );

    console.log();

    if (newUser) {
      const { error: userError } = await supabase.auth.updateUser({
        ...newUser,
      });
      if (userError)
        throw new Error(
          `User update failed: ${userError.code} - ${userError.message}`
        );
    }

    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('editProfile error:', error);
    throw new Error('Failed to update profile');
  }
}

export async function resetProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError)
      throw new Error(`Authentication error: ${authError.message}`);
    if (!user) throw new Error('Unauthorized access!');

    const { data: userProfile, error: userError } = await supabase
      .from('profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (userError)
      throw new Error(`Failed to fetch user profile: ${userError.message}`);
    if (!userProfile) throw new Error('User profile not found');

    const { data: plan, error: planError } = await supabase
      .from('smart_plan')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (planError)
      throw new Error(`Failed to fetch user plan: ${planError.message}`);
    if (!plan) throw new Error('User plan not found');

    const protectedFields = ['id', 'user_id', 'created_at'];

    const updateProfile: Record<string, any> = {};
    const updatePlan: Record<string, any> = {};

    Object.keys(userProfile).forEach((key) => {
      if (!protectedFields.includes(key)) updateProfile[key] = null;
    });

    Object.keys(plan).forEach((key) => {
      if (!protectedFields.includes(key)) updatePlan[key] = null;
    });

    updatePlan.updated_at = new Date().toISOString();

    // Reset profile
    await editProfile({ ...updateProfile, is_onboarding_complete: false });

    // Reset plan
    await editPlan(updatePlan);
  } catch (error) {
    console.error('resetProfile error:', error);
    throw new Error('Failed to reset profile');
  }
}
