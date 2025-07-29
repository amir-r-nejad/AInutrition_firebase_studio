'use server';

import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/schemas';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('User profile not found');
    }
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return data as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profile')
    .update(profileData)
    .eq('user_id', userId);

  if (error) {
    if (error.code === '23505') {
      throw new Error('Profile data conflicts with existing records');
    }
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

export async function createUserProfile(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('profile').insert({
    user_id: userId,
    ...profileData,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('User profile already exists');
    }
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
}

export async function resetUserProfile(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profile')
    .update({
      is_onboarding_complete: false,
      age: null,
      biological_sex: null,
      height_cm: null,
      current_weight_kg: null,
      target_weight_kg: null,
      physical_activity_level: null,
      primary_diet_goal: null,
      preferred_diet: null,
      allergies: null,
      medical_conditions: null,
      medications: null,
      pain_mobility_issues: null,
      exercise_goals: null,
      preferred_exercise_types: null,
      exercise_frequency: null,
      equipment_access: null,
      bf_current: null,
      bf_target: null,
      waist_current: null,
      waist_target: null,
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to reset user profile: ${error.message}`);
  }
}
