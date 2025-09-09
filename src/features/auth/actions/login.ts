'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type loginFormTypes = {
  email: string;
  password: string;
};

type ActionType = {
  isSuccess: boolean;
  error: string | null;
};

export async function loginAction(
  formData: loginFormTypes
): Promise<ActionType> {
  try {
    const supabase = await createClient();
    const { email, password } = formData;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if error is related to email confirmation
      if (error.message.includes('email not confirmed') || error.message.includes('Email not confirmed')) {
        return { 
          isSuccess: false, 
          error: 'لطفاً ابتدا ایمیل خود را تأیید کنید. لینک تأیید به ایمیل شما ارسال شده است.' 
        };
      }
      
      if (error.message.includes('Invalid login credentials')) {
        return { 
          isSuccess: false, 
          error: 'ایمیل یا پسورد اشتباه است. اگر حساب کاربری ندارید، ابتدا ثبت‌نام کنید.' 
        };
      }
      
      return { isSuccess: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { isSuccess: true, error: null };
  } catch {
    return {
      isSuccess: false,
      error:
        'Something went wrong while logging in. Please check your internet connection and try again.',
    };
  }
}
