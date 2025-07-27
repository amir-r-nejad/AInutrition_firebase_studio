import { Card } from '@/components/ui/card';
import Spinner from '@/components/ui/Spinner';
import ApproveContent from '@/features/auth/components/approve/ApproveContent';
import { Suspense } from 'react';

export async function ApprovePage({
  searchParams,
}: {
  searchParams: Promise<{ token: string; requestId: string; coachId: string }>;
}) {
  return (
    <Card>
      <Suspense
        fallback={
          <div className='w-full my-8 flex items-center justify-center'>
            <Spinner />
          </div>
        }
      >
        <ApproveContent searchParams={searchParams} />
      </Suspense>
    </Card>
  );
}

export default ApprovePage;
