import { login as loginApi } from '@/lib/firebase/auth';

type loginFormTypes = {
  email: string;
  password: string;
};

type ActionType = {
  isSuccess: boolean;
  userError: string | null;
};

export async function loginAction(
  formData: loginFormTypes
): Promise<ActionType> {
  try {
    const { email, password } = formData;
    const userCredential = await loginApi(email, password);

    if (userCredential && userCredential.user) {
      return { isSuccess: true, userError: null };
    }
  } catch (error: any) {
    console.error('Firebase login error:', error);
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential'
    )
      return {
        isSuccess: false,
        userError: 'Invalid email or password.',
      };
    else if (error.code === 'auth/invalid-email')
      return {
        isSuccess: false,
        userError: 'Please enter a valid email address.',
      };
  }

  return {
    isSuccess: false,
    userError: 'Failed to login. Please check your credentials.',
  };
}
