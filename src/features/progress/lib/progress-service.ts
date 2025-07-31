'use server';

import { getUser } from '@/lib/supabase/data-service';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { BodyProgressEntry } from '../types';
import { EntryFormValues } from '../types/schema';

export async function getUserProgress(userId?: string) {
  const supabase = await createClient();

  try {
    const targetUserId = userId || (await getUser()).id;

    if (!targetUserId) throw new Error('Auth Error');

    const { data: progress, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) throw new Error(`Something wen't wrong: ${error.message}`);

    return progress as BodyProgressEntry[];
  } catch (error) {
    throw error;
  }
}

export async function saveUserProgress(
  progressToSave: EntryFormValues,
  userId?: string
) {
  const supabase = await createClient();

  try {
    const targetUserId = userId || (await getUser()).id;

    if (!targetUserId) throw new Error('Auth Error');

    const { error } = await supabase
      .from('progress')
      .insert({ user_id: targetUserId, ...progressToSave })
      .single();

    if (error) throw new Error(`Something wen't wrong: ${error.message}`);

    revalidatePath('/progress');
  } catch (error) {
    throw error;
  }
}

export async function updateUserProgress(
  progressToUpdate: EntryFormValues,
  userId?: string
) {
  const supabase = await createClient();

  try {
    const targetUserId = userId || (await getUser()).id;

    if (!targetUserId) throw new Error('Auth Error');

    const { date, ...dataToUpdate } = progressToUpdate;

    const { error } = await supabase
      .from('progress')
      .update({ ...dataToUpdate })
      .eq('user_id', targetUserId)
      .eq('date', date)
      .single();

    if (error) throw new Error(`Something wen't wrong: ${error.message}`);

    revalidatePath('/progress');
  } catch (error) {
    throw error;
  }
}

export async function deleteUserProgress(
  progressToDelete: BodyProgressEntry,
  userId?: string
) {
  const supabase = await createClient();

  try {
    const targetUserId = userId || (await getUser()).id;

    if (!targetUserId) throw new Error('Auth Error');

    const { date, id } = progressToDelete;
    const { error } = await supabase
      .from('progress')
      .delete()
      .eq('user_id', targetUserId)
      .eq('date', date)
      .eq('id', id)
      .single();

    if (error) throw new Error(`Something wen't wrong: ${error.message}`);

    revalidatePath('/progress');
  } catch (error) {
    throw error;
  }
}
