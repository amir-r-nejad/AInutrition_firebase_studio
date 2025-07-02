'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

function PasswordResetError({ errorMessage }: { errorMessage: string | null }) {
  return (
    <Card className='w-full max-w-sm shadow-xl text-center'>
      <CardHeader>
        <div className='flex justify-center items-center mb-4'>
          <ShieldAlert className='h-10 w-10 text-destructive' />
        </div>
        <CardTitle className='text-2xl font-bold'>Link Error</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-destructive'>
          {errorMessage || 'Invalid password reset link.'}
        </p>
      </CardContent>
      <CardFooter>
        <Link href='/forgot-password' passHref className='w-full'>
          <Button className='w-full'>Request New Reset Link</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default PasswordResetError;
