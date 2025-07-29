'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  UserMealPlan,
  WeeklyMealPlan,
  GeneratePersonalizedMealPlanOutput,
} from '@/lib/schemas';

export async function getMealPlan(userId: string): Promise<UserMealPlan> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('No meal plan found for this user');
    }
    throw new Error(`Failed to fetch meal plan: ${error.message}`);
  }

  return data as UserMealPlan;
}

export async function getMealPlanOrDefault(
  userId: string
): Promise<UserMealPlan> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(`Failed to fetch meal plan: ${error.message}`);

  return data as UserMealPlan;
}

export async function updateMealPlan(
  userId: string,
  mealData: { meal_data: WeeklyMealPlan }
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('meal_plans')
    .update(mealData)
    .eq('user_id', userId);

  if (error) {
    if (error.code === '23505') {
      throw new Error('Meal plan data conflicts with existing records');
    }
    throw new Error(`Failed to update meal plan: ${error.message}`);
  }
}

export async function updateAiPlan(
  userId: string,
  aiPlan: { ai_plan: GeneratePersonalizedMealPlanOutput }
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('meal_plans')
    .update(aiPlan)
    .eq('user_id', userId);

  if (error) {
    if (error.code === '23505') {
      throw new Error('AI plan data conflicts with existing records');
    }
    throw new Error(`Failed to update AI plan: ${error.message}`);
  }
}

export async function createMealPlan(
  userId: string,
  mealPlanData: Partial<UserMealPlan>
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('meal_plans').insert({
    user_id: userId,
    ...mealPlanData,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Meal plan already exists for this user');
    }
    throw new Error(`Failed to create meal plan: ${error.message}`);
  }
}

export async function deleteMealPlan(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete meal plan: ${error.message}`);
  }
}
