import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import SignupForm from '@/features/auth/components/signup/SignupForm';
import { Leaf } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <Card className='w-full max-w-sm shadow-xl'>
      <CardHeader className='space-y-1 text-center'>
        <div className='flex justify-center items-center mb-4'>
          <Leaf className='h-10 w-10 text-primary' />
        </div>
        <CardTitle className='text-2xl font-bold'>Create Account</CardTitle>
        <CardDescription>
          Join NutriPlan to start your health journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className='flex flex-col items-center space-y-2'>
        <p className='text-sm text-muted-foreground'>
          Already have an account?{' '}
          <Link
            href='/login'
            className='font-medium text-primary hover:underline'
          >
            Login
          </Link>
        </p>
        <Link
          href='/forgot-password'
          className='text-xs text-primary hover:underline mt-2'
        >
          Forgot password?
        </Link>
      </CardFooter>
    </Card>
  );
}
