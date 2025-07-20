'use server';

import { createClient } from '@/lib/supabase/server';

type ResetPasswordTypes = string;

type ActionType = {
  isSuccess: boolean;
  userError: string | null;
};

export async function resetPasswordAction(
  formData: ResetPasswordTypes
): Promise<ActionType> {
  try {
    const supabase = await createClient();
    const newPassword = formData;

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) return { isSuccess: false, userError: error.message };

    return { isSuccess: true, userError: null };
  } catch {
    return {
      isSuccess: false,
      userError:
        'Something went wrong while updating your password. Please try again.',
    };
  }
}
