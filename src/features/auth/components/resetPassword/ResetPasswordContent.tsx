'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PasswordResetError from '@/features/auth/components/resetPassword/PasswordResetError';
import PasswordResetVerifying from '@/features/auth/components/resetPassword/PasswordResetVerifying';
import ResetPasswordForn from '@/features/auth/components/resetPassword/ResetPasswordForn';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePasswordResetVerification } from '../../hooks/usePasswordResetVerification';

function ResetPasswordContent() {
  const { isValidCode, isVerifying, verificationError } =
    usePasswordResetVerification();

  if (isVerifying) return <PasswordResetVerifying />;

  if (!isValidCode || verificationError)
    return <PasswordResetError errorMessage={verificationError} />;

  return (
    <Card className='w-full max-w-sm shadow-xl'>
      <CardHeader className='space-y-1 text-center'>
        <div className='flex justify-center items-center mb-4'>
          <ShieldCheck className='h-10 w-10 text-primary' />
        </div>
        <CardTitle className='text-2xl font-bold'>Set New Password</CardTitle>
        <CardDescription>Please enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForn />
      </CardContent>
      <CardFooter className='flex flex-col items-center space-y-2'>
        <Link
          href='/login'
          className='text-sm font-medium text-primary hover:underline'
        >
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}

export default ResetPasswordContent;
