import { getUser } from '@/features/profile/lib/data-services';
import {
  GeneratePersonalizedMealPlanOutput,
  MealPlans,
  WeeklyMealPlan,
} from '@/lib/schemas';
import { createClient } from '@/lib/supabase/client';

export async function editMealPlan(mealPlan: {
  meal_data: WeeklyMealPlan;
}): Promise<MealPlans> {
  const supabase = createClient();
  const user = await getUser();

  if (!user?.id) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .update(mealPlan)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116')
      throw new Error('No meal plan found to update for this user');

    if (error.code === '23505')
      throw new Error('Meal plan update conflict - please try again');

    throw new Error(`Failed to update meal plan: ${error.message}`);
  }

  return data as MealPlans;
}

export async function editAiPlan(aiPlan: {
  ai_plan: GeneratePersonalizedMealPlanOutput;
}): Promise<MealPlans> {
  const supabase = createClient();
  const user = await getUser();

  if (!user?.id) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .update(aiPlan)
    .eq('user_id', user.id)
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
