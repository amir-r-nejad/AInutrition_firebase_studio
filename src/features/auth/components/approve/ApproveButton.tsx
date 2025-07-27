'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { grantAccessAction } from '../../actions/grantAccess';
import Spinner from '@/components/ui/Spinner';

function ApproveButton({
  userId,
  coachId,
  reqId,
  token,
}: {
  userId: string;
  coachId: string;
  reqId: string;
  token: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, startTransition] = useTransition();

  async function handleGrantAccess() {
    startTransition(async () => {
      try {
        const result = await grantAccessAction(userId, coachId, reqId, token);

        if (result.success) {
          toast({
            title: 'Access Granted Successfully!',
            description:
              'You have successfully granted coaching access. Your coach can now help you with your nutrition journey.',
            variant: 'default',
          });

          // Redirect to dashboard after success
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          toast({
            title: 'Failed to Grant Access',
            description:
              result.error || 'Something went wrong. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        toast({
          title: 'Unexpected Error',
          description: error?.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Button
      variant='default'
      className='w-full'
      onClick={handleGrantAccess}
      disabled={isLoading}
    >
      {isLoading ? (
        <Spinner className='mr-2 h-4 w-4' />
      ) : (
        <ShieldCheck className='mr-2 h-4 w-4' />
      )}
      {isLoading ? 'Granting Access...' : 'Grant Coach Access'}
    </Button>
  );
}

export default ApproveButton;
