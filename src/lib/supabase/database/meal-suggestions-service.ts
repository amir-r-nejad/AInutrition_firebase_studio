'use server';

import { createClient } from '@/lib/supabase/server';
import { SuggestMealsForMacrosOutput } from '@/lib/schemas';

export interface MealSuggestionRecord {
  id: string;
  user_id: string;
  meal_name: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  suggestions: SuggestMealsForMacrosOutput;
  created_at: string;
  updated_at: string;
}

export async function saveMealSuggestions(
  userId: string,
  mealName: string,
  targetCalories: number,
  targetProtein: number,
  targetCarbs: number,
  targetFat: number,
  suggestions: SuggestMealsForMacrosOutput
): Promise<MealSuggestionRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('meal_suggestions')
    .upsert(
      {
        user_id: userId,
        meal_name: mealName,
        target_calories: targetCalories,
        target_protein: targetProtein,
        target_carbs: targetCarbs,
        target_fat: targetFat,
        suggestions: suggestions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, meal_name' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save meal suggestions: ${error.message}`);
  }

  return data as MealSuggestionRecord;
}

export async function getMealSuggestions(
  userId: string,
  mealName: string
): Promise<MealSuggestionRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('meal_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('meal_name', mealName)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No suggestions found
    }
    throw new Error(`Failed to fetch meal suggestions: ${error.message}`);
  }

  return data as MealSuggestionRecord;
}

export async function getAllMealSuggestions(
  userId: string
): Promise<MealSuggestionRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('meal_suggestions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch meal suggestions: ${error.message}`);
  }

  return data as MealSuggestionRecord[];
}

export async function deleteMealSuggestions(
  userId: string,
  mealName?: string
): Promise<void> {
  const supabase = await createClient();

  let query = supabase
    .from('meal_suggestions')
    .delete()
    .eq('user_id', userId);

  if (mealName) {
    query = query.eq('meal_name', mealName);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to delete meal suggestions: ${error.message}`);
  }
}
