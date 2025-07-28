'use server';

import { getUser } from '@/features/profile/lib/data-services';
import {
  GeneratePersonalizedMealPlanOutput,
  MealPlans,
  WeeklyMealPlan,
} from '@/lib/schemas';
import { createClient } from '@/lib/supabase/client';
import { revalidatePath } from 'next/cache';

export async function editMealPlan(
  mealPlan: { meal_data: WeeklyMealPlan },
  userId?: string
): Promise<MealPlans> {
  const supabase = createClient();
  const targetUserId = userId || (await getUser()).id;

  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .update(mealPlan)
    .eq('user_id', targetUserId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116')
      throw new Error('No meal plan found to update for this user');

    if (error.code === '23505')
      throw new Error('Meal plan update conflict - please try again');

    throw new Error(`Failed to update meal plan: ${error.message}`);
  }

  revalidatePath('/meal-plan/current');
  return data as MealPlans;
}

export async function editAiPlan(
  aiPlan: {
    ai_plan: GeneratePersonalizedMealPlanOutput;
  },
  userId?: string
): Promise<MealPlans> {
  const supabase = createClient();
  const targetUserId = userId || (await getUser()).id;

  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .update(aiPlan)
    .eq('user_id', targetUserId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116')
      throw new Error('No meal plan found to update for this user');

    if (error.code === '23505')
      throw new Error('AI plan update conflict - please try again');

    throw new Error(`Failed to update AI-generated plan: ${error.message}`);
  }

  return data as MealPlans;
}
