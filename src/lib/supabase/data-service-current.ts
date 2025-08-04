
'use server';

import { UserProfile, UserMealPlan, UserPlan } from '@/lib/schemas';
import { User } from '@supabase/supabase-js';
import { createClient } from './server';

export async function getUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  return user;
}
export async function getUserProfile(
  userId?: string
): Promise<UserProfile> {
  const supabase = await createClient();
  const targetUserId = userId || (await getUser()).id;

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (!data) throw new Error('User profile not found');

  return data as UserProfile;
}

export async function getMealPlan(
  userId?: string,
): Promise<UserMealPlan> {
  const supabase = await createClient();
  const user = await getUser();
  const targetUserId = userId || user.id;

  if (!targetUserId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("meal_plans_current")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No meal plan found, create a default empty one
      const defaultMealPlan = {
        user_id: targetUserId,
        meal_data: null,
        ai_plan: null,
      };

      const { data: newPlan, error: createError } = await supabase
        .from("meal_plans_current")
        .insert(defaultMealPlan)
        .select("*")
        .single();

      if (createError) {
        throw new Error(`Failed to create default meal plan: ${createError.message}`);
      }

      return newPlan as UserMealPlan;
    }
    throw new Error(`Failed to fetch meal plan: ${error.message}`);
  }

  return data as UserMealPlan;
}

export async function getUserPlan(
  userId?: string,
): Promise<UserPlan> {
  const supabase = await createClient();
  const targetUserId = userId || (await getUser()).id;

  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('smart_plan')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116')
      throw new Error('No user plan found for this user');

    throw new Error(`Failed to fetch user plan: ${error.message}`);
  }

  if (!data) throw new Error('User plan not found');

  return data as UserPlan;
}

export async function getProfileById(
  userId: string,
  userRole: 'client' | 'coach' = 'client',
  select: string = '*'
): Promise<UserProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profile')
    .select(select)
    .eq('user_id', userId)
    .eq('user_role', userRole)
    .single<UserProfile>();

  if (!data || error) throw new Error('User profile not found');

  return data;
}
export async function getUserDataById(userId: string): Promise<User> {
  const supabase = await createClient();
  try {
    const {
      data: { user: userData },
      error,
    } = await supabase.auth.admin.getUserById(userId);

    if (error) throw new Error(`Failed to fetch user data: ${error.message}`);

    if (!userData) throw new Error(`User with ID ${userId} not found`);

    return userData;
  } catch (error) {
    console.error('Error in getPrefix:', error);
    throw error;
  }
}