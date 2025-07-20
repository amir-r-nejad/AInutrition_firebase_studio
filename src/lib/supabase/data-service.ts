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

export async function getUserProfile(): Promise<BaseProfileData> {
  const supabase = await createClient();
  const user = await getUser();

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!data) throw new Error('User profile not found');

  return data as BaseProfileData;
}

export async function getUserPlan(): Promise<UserPlanType> {
  const supabase = await createClient();
  const user = await getUser();

  const { data } = await supabase
    .from('smart_plan')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!data) throw new Error('User plan not found');

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
