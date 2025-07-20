'use server';

import { createClient } from '@/lib/supabase/server';

type ActionType = {
  isSuccess: boolean;
  message: string | null;
  userError: string | null;
};

export async function forgotPasswordAction(
  formData: string
): Promise<ActionType> {
  const supabase = await createClient();
  const email = formData;

  try {
    await supabase.auth.resetPasswordForEmail(email);

    return {
      isSuccess: true,
      message:
        'If an account exists for this email, we’ve sent a password reset link. Please check your inbox and spam folder.',
      userError: null,
    };
  } catch {
    return {
      isSuccess: false,
      message:
        'Something went wrong while trying to send the reset link. Please check your connection and try again.',
      userError: null,
    };
  }
}
