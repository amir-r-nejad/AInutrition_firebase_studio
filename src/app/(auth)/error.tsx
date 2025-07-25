'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, LogIn, RefreshCw, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background p-4'>
      <div className='w-full max-w-md'>
        <Card className='text-center border-destructive/20 shadow-lg'>
          <CardHeader className='pb-4'>
            <div className='flex justify-center mb-4'>
              <div className='h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center'>
                <AlertTriangle className='h-8 w-8 text-destructive' />
              </div>
            </div>
            <CardTitle className='text-2xl font-bold text-foreground'>
              Authentication Error
            </CardTitle>
            <CardDescription className='text-base'>
              We encountered an issue with the authentication process. Please
              try again.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error.message && (
              <div className='p-3 bg-destructive/5 border border-destructive/20 rounded-md'>
                <p className='text-sm text-destructive font-medium'>
                  Error Details:
                </p>
                <p className='text-xs text-muted-foreground mt-1 break-words'>
                  {error.message}
                </p>
              </div>
            )}

            <div className='text-sm text-muted-foreground space-y-1'>
              <p>Common solutions:</p>
              <ul className='list-disc list-inside space-y-1 text-left'>
                <li>Check your internet connection</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try using a different browser</li>
                <li>Disable browser extensions temporarily</li>
              </ul>
            </div>

            <div className='flex flex-col gap-3 pt-4'>
              <Button
                onClick={reset}
                className='bg-primary hover:bg-primary/90'
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                Try Again
              </Button>
              <Button asChild variant='outline'>
                <Link href='/login' className='flex items-center gap-2'>
                  <LogIn className='h-4 w-4' />
                  Back to Login
                </Link>
              </Button>
            </div>

            <div className='pt-4 border-t border-border/50'>
              <div className='flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2'>
                <Shield className='h-3 w-3' />
                <span>Your data is secure</span>
              </div>
              <p className='text-xs text-muted-foreground'>
                Error ID: {error.digest || 'Unknown'} • Need help?{' '}
                <Link
                  href='/support/faq'
                  className='text-primary hover:underline'
                >
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
