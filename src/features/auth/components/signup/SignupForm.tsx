'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { signupSchema } from '../../schemas/authSchema';
import LoginWithGoogleButton from '../shared/LoginWithGoogleButton';
import SubmitButton from '../../../../components/ui/SubmitButton';
import { useRouter } from 'next/navigation';
import { signupAction } from '../../actions/signup';

type SignupFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

function SignupForm() {
  const router = useRouter();

  const { toast } = useToast();
  const { register, formState, handleSubmit } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const isLoading = formState.isSubmitting;
  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    const { email, password } = data;
    const { isSuccess, userError } = await signupAction({ email, password });

    if (isSuccess) {
      toast({
        title: 'Sign Up Successful',
        description:
          'We’ve sent a verification link to your email. Please check your inbox.',
      });

      return router.push('/login');
    }

    if (!isSuccess)
      return toast({
        title: 'Signup Failed',
        description: userError,
        variant: 'destructive',
      });
  };

  useEffect(
    function () {
      const { password, confirmPassword, email } = formState.errors;

      if (password)
        toast({
          title: 'Signup Failed',
          description: password.message,
          variant: 'destructive',
        });
      if (email)
        toast({
          title: 'Signup Failed',
          description: email.message,
          variant: 'destructive',
        });
      if (confirmPassword)
        toast({
          title: 'Signup Failed',
          description: confirmPassword.message,
          variant: 'destructive',
        });
    },
    [formState.errors, toast]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='email'>Email</Label>
        <Input
          {...register('email')}
          id='email'
          type='email'
          placeholder='m@example.com'
          required
          disabled={isLoading}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='password'>Password</Label>
        <Input
          {...register('password')}
          id='password'
          type='password'
          required
          disabled={isLoading}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='confirm-password'>Confirm Password</Label>
        <Input
          {...register('confirmPassword')}
          id='confirm-password'
          type='password'
          required
          disabled={isLoading}
        />
      </div>

      <SubmitButton
        label='Sign Up'
        loadingLabel='Signing up...'
        icon={<UserPlus className='mr-2 h-4 w-4' />}
        isLoading={isLoading}
      />

      <LoginWithGoogleButton disabled={isLoading} />
    </form>
  );
}

export default SignupForm;
