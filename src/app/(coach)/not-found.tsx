import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserX, Home, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function CoachNotFound() {
  return (
    <div className='min-h-[60vh] flex items-center justify-center p-4'>
      <Card className='w-full max-w-md text-center border-border/50 shadow-lg'>
        <CardHeader className='pb-4'>
          <div className='flex justify-center mb-4'>
            <div className='relative'>
              <Users className='h-16 w-16 text-primary' />
              <UserX className='h-8 w-8 text-muted-foreground absolute -bottom-1 -right-1 bg-background rounded-full p-1' />
            </div>
          </div>
          <CardTitle className='text-2xl font-bold text-foreground'>
            Coach Page Not Found
          </CardTitle>
          <CardDescription className='text-base'>
            The coaching page you&apos;re looking for doesn&apos;t exist or has
            been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm text-muted-foreground space-y-1'>
            <p>This might have happened because:</p>
            <ul className='list-disc list-inside space-y-1 text-left'>
              <li>The URL was typed incorrectly</li>
              <li>The coaching feature has been moved</li>
              <li>You don&apos;t have coach permissions</li>
              <li>The page is temporarily unavailable</li>
            </ul>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 pt-4'>
            <Button asChild variant='outline' className='flex-1 bg-transparent'>
              <Link href='/coach-dashboard' className='flex items-center gap-2'>
                <ArrowLeft className='h-4 w-4' />
                Go Back
              </Link>
            </Button>
            <Button asChild className='flex-1 bg-primary hover:bg-primary/90'>
              <Link href='/coach-dashboard' className='flex items-center gap-2'>
                <Home className='h-4 w-4' />
                Coach Dashboard
              </Link>
            </Button>
          </div>

          <div className='pt-4 border-t border-border/50'>
            <p className='text-xs text-muted-foreground'>
              Need help with coaching features?{' '}
              <Link
                href='/support/faq'
                className='text-primary hover:underline'
              >
                Contact support
              </Link>{' '}
              or check our coaching guide.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
