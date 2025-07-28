'use server';

import { BaseProfileData, UserPlanType } from '@/lib/schemas';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

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
