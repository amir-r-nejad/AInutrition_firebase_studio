import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import Spinner from '@/components/ui/Spinner';
import { TooltipProvider } from '@/components/ui/tooltip';
import CustomizePlanSection from '@/features/tools/components/calorie-planner/CustomizePlanSection';
import PlannerSection from '@/features/tools/components/calorie-planner/PlannerSection';
import { BrainCircuit, Edit3 } from 'lucide-react';
import { Suspense } from 'react';

export default function SmartCaloriePlannerPage() {
  return (
    <TooltipProvider>
      <div className='container mx-auto py-4'>
        <Card className='max-w-3xl mx-auto shadow-xl'>
          <SectionHeader
            title='Smart Calorie & Macro Planner'
            description='Calculate your daily targets based on your stats and goals. Saved data will be used across other tools.'
            className='text-3xl font-bold flex items-center'
            icon={<BrainCircuit className='mr-3 h-8 w-8 text-primary' />}
          />

          <CardContent>
            <Suspense fallback={<LoadingScreen />}>
              <PlannerSection />
            </Suspense>

            <Card className='mt-8'>
              <CardHeader>
                <CardTitle className='text-2xl font-semibold flex items-center'>
                  <Edit3 className='mr-2 h-6 w-6 text-primary' />
                  Customize Your Plan
                </CardTitle>
                <CardDescription>
                  Adjust the system-generated plan with your preferences.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Suspense
                  fallback={
                    <div className='flex items-start justify-center w-full gap-1 my-10'>
                      <Spinner />
                      <span>Loding...</span>
                    </div>
                  }
                >
                  <CustomizePlanSection />
                </Suspense>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
