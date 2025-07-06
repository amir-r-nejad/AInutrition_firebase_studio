'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/clientApp';
import { User } from '@/types/globalTypes';
import { doc, setDoc } from 'firebase/firestore';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

function ResetOnboarding({ user }: { user: User | null }) {
  const { toast } = useToast();

  async function handleResetOnboarding() {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not found.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const userProfileRef = doc(db, 'users', user.uid);
      await setDoc(
        userProfileRef,
        { onboardingComplete: false },
        { merge: true }
      );
      toast({
        title: 'Onboarding Reset',
        description:
          'Your onboarding status has been reset. The app will now reload.',
      });

      window.location.reload();
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
      toast({
        title: 'Reset Failed',
        description: 'Could not reset onboarding status.',
        variant: 'destructive',
      });
    }
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
          variant='destructive'
          onClick={handleResetOnboarding}
          className='w-full'
        >
          <RefreshCcw className='mr-2 h-4 w-4' /> Reset Onboarding Status
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
