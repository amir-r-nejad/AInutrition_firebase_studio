import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LoginForm from '@/features/auth/components/login/LoginForm';
import { Leaf } from 'lucide-react';
import Link from 'next/link';

export default async function LoginPage() {
  return (
    <div className='w-full max-w-sm mx-auto'>
      <Card className='w-full shadow-xl'>
        <CardHeader className='space-y-1 text-center'>
          <div className='flex justify-center items-center mb-4'>
            <Leaf className='h-10 w-10 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>Welcome Back!!!</CardTitle>
          <CardDescription>
            Enter your credentials to access NutriPlan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className='flex flex-col items-center space-y-2'>
          <p className='text-sm text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link
              href='/signup'
              className='font-medium text-primary hover:underline'
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
      <p className='mt-4 text-center text-sm text-muted-foreground'>
        AI Nutritionist Inc. 2025
      </p>
    </div>
  );
}
