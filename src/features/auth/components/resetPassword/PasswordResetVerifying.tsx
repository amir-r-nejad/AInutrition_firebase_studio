import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function PasswordResetVerifying() {
  return (
    <Card className='w-full max-w-sm shadow-xl text-center'>
      <CardHeader>
        <div className='flex justify-center items-center mb-4'>
          <Loader2 className='h-10 w-10 text-primary animate-spin' />
        </div>
        <CardTitle className='text-2xl font-bold'>Verifying Link...</CardTitle>
        <CardDescription>
          Please wait while we validate your password reset link.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default PasswordResetVerifying;
