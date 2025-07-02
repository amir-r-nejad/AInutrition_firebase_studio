import { verifyOob } from '@/lib/firebase/auth';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function usePasswordResetVerification() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!oobCode) {
      setVerificationError(
        'Invalid or missing password reset code. Please request a new link.'
      );
      setIsVerifying(false);
      return setIsValidCode(false);
    }

    const verifyCode = async () => {
      setIsVerifying(true);
      try {
        await verifyOob(oobCode);
        setIsValidCode(true);
      } catch (error: any) {
        console.error('Error verifying reset code:', error);
        setVerificationError(
          'Invalid or expired password reset link. Please request a new one.'
        );
        setIsValidCode(false);
      } finally {
        setIsVerifying(false);
      }
    };
    verifyCode();
  }, [oobCode]);

  return { isVerifying, isValidCode, verificationError };
}
