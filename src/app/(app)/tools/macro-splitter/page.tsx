import { Card, CardContent } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import Spinner from '@/components/ui/Spinner';
import DailyMacroSummary from '@/features/tools/components/macro-splitter/DailyMacroSummary';
import MacroSection from '@/features/tools/components/macro-splitter/MacroSection';
import { SplitSquareHorizontal } from 'lucide-react';
import { Suspense } from 'react';

export default function MacroSplitterPage() {
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
                <p>Loading your data...</p>
              </div>
            </CardContent>
          }
        >
          <DailyMacroSummary />
        </Suspense>
      </Card>

      <Suspense fallback={<LoadingScreen />}>
        <MacroSection />
      </Suspense>
    </div>
  );
}
