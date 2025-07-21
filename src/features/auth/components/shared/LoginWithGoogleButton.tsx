'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Google from '../../../../public/google.svg';
import { useTransition } from 'react';
import { loginWithGoogle } from '../../actions/loginWithOAuth';
import { useToast } from '@/hooks/use-toast';

function LoginWithGoogleButton({ disabled }: { disabled: boolean }) {
  const { toast } = useToast();
  const [isLoggingIn, startLoginWithGoogle] = useTransition();

  async function handleClick() {
    startLoginWithGoogle(async () => {
      try {
        await loginWithGoogle();

        toast({
          title: 'Success',
          description: 'You have successfully logged in with Google.',
          variant: 'default',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to log in with Google. Please try again.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Button
      onClick={handleClick}
      type='button'
      className='w-full'
      disabled={disabled || isLoggingIn}
    >
      {isLoggingIn ? (
        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
      ) : (
        <Image src={Google} alt='google' />
      )}{' '}
      Login with Google
    </Button>
  );
}

export default LoginWithGoogleButton;
