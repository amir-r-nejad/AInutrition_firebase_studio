'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Alert, AlertDescription } from './alert';
import Link from 'next/link';

interface ErrorMessageProps {
  title?: string;
  message: string;
  showRetry?: boolean;
  showHomeLink?: boolean;
  onRetry?: () => void;
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  showRetry = false,
  showHomeLink = true,
  onRetry,
}: ErrorMessageProps) {
  return (
    <Card className='max-w-md mx-auto mt-8 border-destructive/20'>
      <CardContent className='pt-6'>
        <div className='flex flex-col items-center text-center space-y-4'>
          <div className='w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center'>
            <AlertTriangle className='w-8 h-8 text-destructive' />
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-semibold text-foreground'>{title}</h3>
            <Alert variant='destructive' className='text-left'>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </div>

          <div className='flex gap-3 pt-2'>
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                variant='outline'
                size='sm'
                className='flex items-center gap-2 bg-transparent'
              >
                <RefreshCw className='w-4 h-4' />
                Try Again
              </Button>
            )}

            {showHomeLink && (
              <Button asChild size='sm'>
                <Link href='/dashboard' className='flex items-center gap-2'>
                  <Home className='w-4 h-4' />
                  Go to Dashboard
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
