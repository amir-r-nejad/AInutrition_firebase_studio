'use server';

import { confirmPassword } from '@/lib/firebase/auth';

type ResetPasswordTypes = {
  oobCode: string;
  newPassword: string;
};

type ActionType = {
  isSuccess: boolean;
  userError: string | null;
};

export async function resetPasswordAction(
  formData: ResetPasswordTypes
): Promise<ActionType> {
  try {
    const { oobCode, newPassword } = formData;
    await confirmPassword(oobCode, newPassword);

    return { isSuccess: true, userError: null };
  } catch (error: any) {
    console.error('Error confirming password reset:', error);

    if (error.code === 'auth/invalid-action-code')
      return {
        isSuccess: true,
        userError:
          'Invalid or expired password reset link. Please request a new one.',
      };
    else if (error.code === 'auth/weak-password')
      return {
        isSuccess: true,
        userError:
          'The new password is too weak. It must be at least 6 characters.',
      };
  }

  return {
    isSuccess: false,
    userError:
      'Failed to reset password. The link may have expired or been used already.',
  };
}
