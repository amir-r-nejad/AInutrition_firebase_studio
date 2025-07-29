'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import SubmitButton from '@/components/ui/SubmitButton';
import { useRouter } from 'next/navigation';
import { loginAction } from '../../actions/login';
import { loginSchema } from '../../schemas/authSchema';
import LoginWithGoogleButton from '../shared/LoginWithGoogleButton';

type LoginFormValues = {
  email: string;
  password: string;
};

function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { formState, handleSubmit, register } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const isLoading = formState.isSubmitting;
  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    const { email, password } = data;

    const { isSuccess, error } = await loginAction({
      email,
      password,
    });

    if (isSuccess) {
      toast({ title: 'Login Successful', description: `Welcome back!!!` });
      return router.push('/onboarding');
    }

    if (!isSuccess)
      return toast({
        title: 'Login Failed',
        description: error,
        variant: 'destructive',
      });
  };

  useEffect(
    function () {
      const { email, password } = formState.errors;

      if (email)
        toast({
          title: 'Login Failed',
          description: email.message,
          variant: 'destructive',
        });

      if (password)
        toast({
          title: 'Login Failed',
          description: password.message,
          variant: 'destructive',
        });
    },
    [formState.errors, toast]
  );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            {...register('email')}
            id='email'
            type='email'
            required
            placeholder='m@example.com'
            disabled={isLoading}
          />
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='password'>Password</Label>
            <Link
              href='/forgot-password'
              className='text-xs text-primary hover:underline'
            >
              Forgot password?
            </Link>
          </div>
          <Input
            {...register('password')}
            id='password'
            type='password'
            required
            disabled={isLoading}
          />
        </div>

        <SubmitButton
          isLoading={isLoading}
          icon={<LogIn className='mr-2 h-4 w-4' />}
          loadingLabel='Logging in...'
          label='Login'
        />

        <LoginWithGoogleButton disabled={isLoading} />
      </form>
    </>
  );
}

export default LoginForm;
