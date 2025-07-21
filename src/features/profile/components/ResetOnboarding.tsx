'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { useTransition } from 'react';
import { resetProfile } from '../actions/apiUserProfile';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function ResetOnboarding() {
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, startTransition] = useTransition();

  async function handleReset() {
    startTransition(async () => {
      try {
        await resetProfile();
        toast({
          title: 'Profile Reset',
          description: 'Your profile has been reset successfully.',
          variant: 'default',
        });
        router.push('/onboarding');
      } catch (error: any) {
        toast({
          title: 'Reset Failed',
          description: error,
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Card className='mt-12 border-destructive/50'>
      <CardHeader>
        <CardTitle className='text-lg flex items-center text-destructive'>
          <AlertTriangle className='mr-2 h-5 w-5' /> Developer Tools
        </CardTitle>
        <CardDescription>
          Use these tools for testing purposes only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          disabled={isLoading}
          variant='destructive'
          onClick={handleReset}
          className='w-full'
        >
          <RefreshCcw
            className={`${isLoading ? 'animate-spin' : ''} mr-2 h-4 w-4`}
          />
          {isLoading ? 'Reset...' : 'Reset Onboarding Status'}
        </Button>
        <p className='text-xs text-muted-foreground mt-2'>
          This will set your onboarding status to incomplete, allowing you to go
          through the onboarding flow again. The page will reload.
        </p>
      </CardContent>
    </Card>
  );
}

export default ResetOnboarding;
