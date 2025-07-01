import { sendForgetPassword } from '@/lib/firebase/auth';

type ActionType = {
  isSuccess: boolean;
  message: string | null;
  userError: string | null;
};

export async function forgotPasswordAction(
  formData: string
): Promise<ActionType> {
  const FORGOT_PASSWORD_MESSAGE =
    'If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).';

  try {
    const email = formData;
    await sendForgetPassword(email);
    return {
      isSuccess: true,
      message: FORGOT_PASSWORD_MESSAGE,
      userError: null,
    };
  } catch (error: any) {
    console.error('Forgot password error:', error);
    if (error.code === 'auth/invalid-email')
      return {
        isSuccess: false,
        message: null,
        userError: 'The email address is not valid.',
      };
    else if (error.code === 'auth/user-not-found')
      return {
        isSuccess: false,
        message: FORGOT_PASSWORD_MESSAGE,
        userError: 'Failed to send password reset email. Please try again.',
      };
  }

  return { isSuccess: false, message: null, userError: null };
}
