'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw, Users } from 'lucide-react';
import Link from 'next/link';

export default function CoachError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='min-h-[60vh] flex items-center justify-center p-4'>
      <Card className='w-full max-w-md text-center border-destructive/20 shadow-lg'>
        <CardHeader className='pb-4'>
          <div className='flex justify-center mb-4'>
            <div className='relative'>
              <div className='h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center'>
                <AlertTriangle className='h-8 w-8 text-destructive' />
              </div>
            </div>
          </div>
          <CardTitle className='text-2xl font-bold text-foreground'>
            Coach Dashboard Error
          </CardTitle>
          <CardDescription className='text-base'>
            We encountered an error while loading your coaching tools. Your
            client data is safe.
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
            <p>You can try:</p>
            <ul className='list-disc list-inside space-y-1 text-left'>
              <li>Refreshing the coaching dashboard</li>
              <li>Checking your internet connection</li>
              <li>Verifying your coach permissions</li>
              <li>Contacting support if the issue persists</li>
            </ul>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 pt-4'>
            <Button
              onClick={reset}
              variant='outline'
              className='flex-1 border-primary/50 hover:bg-primary/5 bg-transparent'
            >
              <RefreshCw className='h-4 w-4 mr-2' />
              Try Again
            </Button>
            <Button asChild className='flex-1 bg-primary hover:bg-primary/90'>
              <Link href='/coach-dashboard' className='flex items-center gap-2'>
                <Home className='h-4 w-4' />
                Dashboard
              </Link>
            </Button>
          </div>

          <div className='pt-4 border-t border-border/50'>
            <div className='flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2'>
              <Users className='h-3 w-3' />
              <span>Coach tools temporarily unavailable</span>
            </div>
            <p className='text-xs text-muted-foreground'>
              Error ID: {error.digest || 'Unknown'} • Need help?{' '}
              <Link
                href='/support/chatbot'
                className='text-primary hover:underline'
              >
                Contact support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
