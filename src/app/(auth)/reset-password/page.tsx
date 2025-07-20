import LoadingScreen from '@/components/ui/LoadingScreen';
import ResetPasswordContent from '@/features/auth/components/resetPassword/ResetPasswordContent';
import { Suspense } from 'react';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}
