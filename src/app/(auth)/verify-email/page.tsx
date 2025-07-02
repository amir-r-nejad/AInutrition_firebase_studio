import VerifyEmailContent from '@/features/auth/components/signup/VerifyEmailContent';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center'>
          <Loader2 className='h-12 w-12 animate-spin text-primary' />
          <p className='ml-2'>Loading verification...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
