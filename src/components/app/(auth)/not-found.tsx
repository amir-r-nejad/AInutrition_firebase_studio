import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserX, ArrowLeft, LogIn, Leaf } from 'lucide-react';
import Link from 'next/link';

export default function AuthNotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background p-4'>
      <div className='w-full max-w-md'>
        <Card className='text-center border-border/50 shadow-lg'>
          <CardHeader className='pb-4'>
            <div className='flex justify-center mb-4'>
              <div className='relative'>
                <Leaf className='h-16 w-16 text-primary' />
                <UserX className='h-8 w-8 text-muted-foreground absolute -bottom-1 -right-1 bg-background rounded-full p-1' />
              </div>
            </div>
            <CardTitle className='text-2xl font-bold text-foreground'>
              Authentication Page Not Found
            </CardTitle>
            <CardDescription className='text-base'>
              The authentication page you&apos;re looking for doesn&apos;t
              exist.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-sm text-muted-foreground space-y-1'>
              <p>This might have happened because:</p>
              <ul className='list-disc list-inside space-y-1 text-left'>
                <li>The URL was typed incorrectly</li>
                <li>The authentication link has expired</li>
                <li>The page has been moved or removed</li>
              </ul>
            </div>

            <div className='flex flex-col gap-3 pt-4'>
              <Button asChild className='bg-primary hover:bg-primary/90'>
                <Link href='/login' className='flex items-center gap-2'>
                  <LogIn className='h-4 w-4' />
                  Go to Login
                </Link>
              </Button>
              <Button asChild variant='outline'>
                <Link href='/' className='flex items-center gap-2'>
                  <ArrowLeft className='h-4 w-4' />
                  Back to Home
                </Link>
              </Button>
            </div>

            <div className='pt-4 border-t border-border/50'>
              <p className='text-xs text-muted-foreground'>
                New to NutriPlan?{' '}
                <Link href='/signup' className='text-primary hover:underline'>
                  Create an account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
