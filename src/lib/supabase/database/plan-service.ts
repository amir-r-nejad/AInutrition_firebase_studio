'use server';

import { createClient } from '@/lib/supabase/server';
import type { UserPlanType } from '@/lib/schemas';
import { getUser } from '../data-service';

import { revalidatePath } from 'next/cache';

export async function getUserPlan(userId?: string): Promise<UserPlanType> {
  try {
    const supabase = await createClient();
    const targetUserId = userId || (await getUser()).id;

    const { data, error } = await supabase
      .from('smart_plan')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116')
        throw new Error(
          'No plan found for this user. Please create a plan first.'
        );

      throw new Error(
        `Unable to retrieve user plan. Please try again later. Error: ${error.message}`
      );
    }

    return data as UserPlanType;
  } catch {
    throw new Error(
      'Failed to retrieve user plan. Please check your connection and try again.'
    );
  }
}

export async function updateUserPlan(
  planData: Partial<UserPlanType>,
  userId?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const targetUserId = userId || (await getUser()).id;

    const { error } = await supabase
      .from('smart_plan')
      .update(planData)
      .eq('user_id', targetUserId);

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          'Unable to update plan due to conflicting data. Please check your input and try again.'
        );
      }
      throw new Error(
        `Plan update failed. Please verify your data and try again. Error: ${error.message}`
      );
    }

    revalidatePath('/', 'layout');
  } catch {
    throw new Error(
      'Plan update unsuccessful. Please check your connection and try again.'
    );
  }
}

export async function createUserPlan(
  planData: Partial<UserPlanType>,
  userId?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const targetUserId = userId || (await getUser()).id;

    const { error } = await supabase.from('smart_plan').insert({
      user_id: targetUserId,
      ...planData,
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          'A plan already exists for this user. Use update instead of create.'
        );
      }
      throw new Error(
        `Plan creation failed. Please verify your data and try again. Error: ${error.message}`
      );
    }

    revalidatePath('/', 'layout');
  } catch {
    throw new Error(
      'Unable to create new plan. Please check your connection and try again.'
    );
  }
}

export async function resetUserPlan(userId?: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('smart_plan')
    .update({
      bmr_kcal: null,
      maintenance_calories_tdee: null,
      target_daily_calories: null,
      target_protein_g: null,
      target_protein_percentage: null,
      target_carbs_g: null,
      target_carbs_percentage: null,
      target_fat_g: null,
      target_fat_percentage: null,
      custom_total_calories: null,
      custom_protein_per_kg: null,
      remaining_calories_carbs_percentage: null,
      custom_total_calories_final: null,
      custom_protein_g: null,
      custom_protein_percentage: null,
      custom_carbs_g: null,
      custom_carbs_percentage: null,
      custom_fat_g: null,
      custom_fat_percentage: null,
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to reset user plan: ${error.message}`);
  }
}
