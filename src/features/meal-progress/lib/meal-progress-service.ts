'use server';

import { getUser } from '@/lib/supabase/data-service';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { MealProgressEntry } from '../types';
import { MealEntryFormValues } from '../types/schema';

export async function getUserMealProgress(
  userId?: string
): Promise<MealProgressEntry[]> {
  const supabase = await createClient();

  try {
    const targetUserId = userId || (await getUser()).id;

    if (!targetUserId) throw new Error('Auth Error');

    const { data: progress, error } = await supabase
      .from('meal_progress')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) throw new Error(`Something went wrong: ${error.message}`);

    return progress as MealProgressEntry[];
  } catch (error) {
    throw error;
  }
}

export async function saveUserMealProgress(
  progressToSave: MealEntryFormValues,
  userId?: string
): Promise<void> {
  const supabase = await createClient();

  try {
    const targetUserId = userId || (await getUser()).id;

    if (!targetUserId) throw new Error('Auth Error');

    const { error } = await supabase
      .from('meal_progress')
      .insert({ user_id: targetUserId, ...progressToSave })
      .single();

    if (error) throw new Error(`Something went wrong: ${error.message}`);

    revalidatePath('/meal-progress');
  } catch (error) {
    throw error;
  }
}

export async function updateUserMealProgress(
  progressToUpdate: Partial<MealEntryFormValues>,
  userId?: string
): Promise<void> {
  const supabase = await createClient();

  try {
    const targetUserId = userId || (await getUser()).id;

    if (!targetUserId) throw new Error('Auth Error');

    const { date, meal_type, ...mealToUpdate } = progressToUpdate;

    const { error } = await supabase
      .from('meal_progress')
      .update({ ...mealToUpdate })
      .eq('user_id', targetUserId)
      .eq('date', date)
      .eq('meal_type', meal_type)
      .single();

    if (error) throw new Error(`Something went wrong: ${error.message}`);

    revalidatePath('/meal-progress');
  } catch (error) {
    throw error;
  }
}
