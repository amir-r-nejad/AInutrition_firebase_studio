import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ForgotPasswordForm from '@/features/auth/components/forgotPassword/ForgotPasswordForm';
import { Leaf } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <Card className='w-full max-w-sm shadow-xl'>
      <CardHeader className='space-y-1 text-center'>
        <div className='flex justify-center items-center mb-4'>
          <Leaf className='h-10 w-10 text-primary' />
        </div>
        <CardTitle className='text-2xl font-bold'>
          Forgot Your Password?
        </CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>

      <ForgotPasswordForm />

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
