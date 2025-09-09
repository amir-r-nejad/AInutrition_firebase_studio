"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type SignupFormTypes = {
  email: string;
  password: string;
};

type ActionType = {
  isSuccess: boolean;
  userError: string | null;
};

export async function signupAction(
  formData: SignupFormTypes,
): Promise<ActionType> {
  try {
    const { email, password } = formData;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.includes("User already registered")) {
        return {
          isSuccess: false,
          userError:
            'This email has already been registered. If you have forgotten your password, use the "Forgot Password" option or log in with the same information.',
        };
      }

      return { isSuccess: false, userError: error.message };
    }

    revalidatePath("/", "layout");
    return { isSuccess: true, userError: null };
  } catch {
    return {
      isSuccess: false,
      userError:
        "Something went wrong while signing up. Please check your connection and try again.",
    };
  }
}
