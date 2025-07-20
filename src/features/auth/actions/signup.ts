'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type SignupFormTypes = {
  email: string;
  password: string;
};

type ActionType = {
  isSuccess: boolean;
  userError: string | null;
};

export async function signupAction(
  formData: SignupFormTypes
): Promise<ActionType> {
  try {
    const { email, password } = formData;

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) return { isSuccess: false, userError: error.message };

    revalidatePath('/', 'layout');
    return { isSuccess: true, userError: null };
  } catch {
    return {
      isSuccess: false,
      userError:
        'Something went wrong while signing up. Please check your connection and try again.',
    };
  }
}
