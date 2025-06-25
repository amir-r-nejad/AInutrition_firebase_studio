'use client';

import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { MouseEvent, useState } from 'react';
import Google from '../../../../public/google.svg';

type PropsType = {
  disabled: boolean;
};

function LoginWithGoogleButton({ disabled }: PropsType) {
  const [loading, setIsLoading] = useState<boolean>(false);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    signInWithGoogle();
    setIsLoading(true);
  }

  return (
    <Button
      onClick={handleClick}
      type='button'
      className='w-full'
      disabled={disabled}
    >
      {loading ? (
        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
      ) : (
        <Image src={Google} alt='google' />
      )}{' '}
      Login with Google
    </Button>
  );
}

export default LoginWithGoogleButton;
