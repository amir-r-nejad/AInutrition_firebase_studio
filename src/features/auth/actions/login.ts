"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type loginFormTypes = {
  email: string;
  password: string;
};

type ActionType = {
  isSuccess: boolean;
  error: string | null;
};

export async function loginAction(
  formData: loginFormTypes,
): Promise<ActionType> {
  try {
    const supabase = await createClient();
    const { email, password } = formData;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if error is related to email confirmation
      if (
        error.message.includes("email not confirmed") ||
        error.message.includes("Email not confirmed")
      ) {
        return {
          isSuccess: false,
          error:
            "Please verify your email first. A verification link has been sent to your email.",
        };
      }

      if (error.message.includes("Invalid login credentials")) {
        return {
          isSuccess: false,
          error:
            "Incorrect email or password. If you don't have an account, sign up first.",
        };
      }

      return { isSuccess: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { isSuccess: true, error: null };
  } catch {
    return {
      isSuccess: false,
      error:
        "Something went wrong while logging in. Please check your internet connection and try again.",
    };
  }
}
