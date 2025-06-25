'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Home,
  Loader2,
  MailCheck,
  MailWarning,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useEmailVerificationFlow } from '../../hooks/useEmailVerificationFlow ';

function VerifyEmailContent() {
  const { status, message } = useEmailVerificationFlow();

  return (
    <Card className='w-full max-w-md shadow-xl text-center'>
      <CardHeader>
        <div className='flex justify-center items-center mb-4'>
          {status === 'verifying' && (
            <Loader2 className='h-12 w-12 text-primary animate-spin' />
          )}
          {status === 'success' && (
            <ShieldCheck className='h-12 w-12 text-green-500' />
          )}
          {status === 'error' && (
            <MailWarning className='h-12 w-12 text-destructive' />
          )}
        </div>
        <CardTitle className='text-2xl font-bold'>
          {status === 'verifying' && 'Verifying Your Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Problem'}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'verifying' && (
          <p className='text-sm text-muted-foreground'>
            Please wait a moment...
          </p>
        )}
      </CardContent>
      <CardFooter className='flex flex-col items-center space-y-3'>
        {status === 'success' && (
          <Link href='/login' passHref className='w-full'>
            <Button className='w-full'>
              <MailCheck className='mr-2 h-4 w-4' /> Proceed to Login
            </Button>
          </Link>
        )}
        {status === 'error' && (
          <Link href='/signup' passHref className='w-full'>
            <Button variant='outline' className='w-full'>
              Try Signing Up Again
            </Button>
          </Link>
        )}
        <Link href='/' passHref className='w-full text-sm'>
          <Button variant='link' className='w-full text-primary'>
            <Home className='mr-2 h-4 w-4' /> Go to Homepage
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default VerifyEmailContent;
