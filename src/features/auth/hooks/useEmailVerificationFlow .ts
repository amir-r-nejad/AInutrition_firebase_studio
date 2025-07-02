import { useToast } from '@/hooks/use-toast';
import { applyActionCodeForVerification, auth } from '@/lib/firebase/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useEmailVerificationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  );
  const [message, setMessage] = useState('Verifying your email address...');
  const { toast } = useToast();

  useEffect(() => {
    if (!oobCode) {
      setMessage('Invalid verification link. Code is missing.');
      setStatus('error');
      return;
    }

    const verifyEmail = async () => {
      setStatus('verifying');
      try {
        await applyActionCodeForVerification(oobCode);

        if (auth.currentUser) await auth.currentUser.reload();

        setMessage(
          'Your email has been successfully verified! You can now log in.'
        );
        setStatus('success');

        toast({
          title: 'Email Verified',
          description: 'You can now log in with your credentials.',
          variant: 'default',
        });
      } catch (error: any) {
        console.error('Error verifying email:', error);
        let userErrorMessage =
          'Failed to verify email. The link may be invalid or expired.';
        if (error.code === 'auth/invalid-action-code') {
          userErrorMessage =
            'Invalid or expired verification link. Please try signing up again or requesting a new verification email if applicable.';
        }

        setMessage(userErrorMessage);
        setStatus('error');

        toast({
          title: 'Verification Failed',
          description: userErrorMessage,
          variant: 'destructive',
        });
      }
    };

    verifyEmail();
  }, [oobCode, router, toast]);

  return { status, message, oobCode };
}
