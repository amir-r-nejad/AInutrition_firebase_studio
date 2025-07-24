'use server';

import { BaseProfileData, MealPlans, UserPlanType } from '@/lib/schemas';
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

export async function getUserProfile(): Promise<BaseProfileData | null> {
  const supabase = await createClient();
  const user = await getUser();

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data as BaseProfileData | null;
}

export async function getUserPlan(): Promise<UserPlanType | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(`Authentication error: ${authError.message}`);
  if (!user) throw new Error('Unauthorized access!');

  const { data, error } = await supabase
    .from('smart_plan')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If no rows found, return null instead of throwing error
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get user plan: ${error.message}`);
  }

  return data as UserPlanType;
}

export async function getMealPlan(): Promise<MealPlans> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user?.id) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116')
      throw new Error('No meal plan found for this user');

    throw new Error(`Failed to fetch meal plan: ${error.message}`);
  }

  return data as MealPlans;
}