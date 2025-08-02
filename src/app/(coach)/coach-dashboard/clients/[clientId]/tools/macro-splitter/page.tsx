import { Card, CardContent } from '@/components/ui/card';
import PageLoadingSpinner from '@/components/ui/PageLoadingSpinner';
import SectionHeader from '@/components/ui/SectionHeader';
import Spinner from '@/components/ui/Spinner';
import DailyMacroSummary from '@/features/tools/components/macro-splitter/DailyMacroSummary';
import MacroSection from '@/features/tools/components/macro-splitter/MacroSection';
import { checkCoachAccess } from '@/lib/utils/access-control';
import { SplitSquareHorizontal } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

async function CoachMacroSplitterPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { hasAccess, isCoach } = await checkCoachAccess(clientId);

  if (!hasAccess || !isCoach) return notFound();

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <Card className='shadow-lg'>
        <SectionHeader
          className='text-3xl font-bold flex items-center'
          title='Macro Splitter Tool'
          description='Distribute your total daily macros across your meals by percentage. Percentages must be whole numbers (e.g., 20, not 20.5).'
          icon={<SplitSquareHorizontal className='mr-3 h-8 w-8 text-primary' />}
        />

        <Suspense
          fallback={
            <CardContent>
              <div className='w-full flex items-center justify-center gap-1 p-4 border rounded-md bg-muted/50'>
                <Spinner />
                <p>Loading daily macro summary...</p>
              </div>
            </CardContent>
          }
        >
          <DailyMacroSummary clientId={clientId} />
        </Suspense>
      </Card>

      <Suspense
        fallback={
          <PageLoadingSpinner message='Loading macro distribution section...' />
        }
      >
        <MacroSection clientId={clientId} />
      </Suspense>
    </div>
  );
}

export default CoachMacroSplitterPage;
