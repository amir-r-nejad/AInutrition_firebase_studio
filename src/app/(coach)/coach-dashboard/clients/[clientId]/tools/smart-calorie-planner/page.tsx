import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PageLoadingSpinner from '@/components/ui/PageLoadingSpinner';
import SectionHeader from '@/components/ui/SectionHeader';
import CustomizePlanSection from '@/features/tools/components/calorie-planner/CustomizePlanSection';
import PlannerSection from '@/features/tools/components/calorie-planner/PlannerSection';
import { checkCoachAccess } from '@/lib/utils/access-control';
import { SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

async function CoachSmartCaloriePlannerPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { hasAccess, isCoach } = await checkCoachAccess(clientId);

  if (!hasAccess || !isCoach) notFound();

  return (
    <div className='container mx-auto py-4'>
      <Card className='max-w-3xl mx-auto shadow-xl'>
        <SectionHeader
          title='Client Smart Calorie & Macro Planner'
          description="Set your client's daily calorie and macronutrient targets based on their body stats and fitness goals. These values will automatically sync with other tools."
          className='text-3xl font-bold flex items-center'
          icon={<UtensilsCrossed className='mr-3 h-8 w-8 text-primary' />}
        />

        <CardContent>
          <Suspense
            fallback={
              <PageLoadingSpinner message='Loading planner section...' />
            }
          >
            <PlannerSection clientId={clientId} />
          </Suspense>

          <Card className='mt-8'>
            <CardHeader>
              <CardTitle className='text-2xl font-semibold flex items-center'>
                <SlidersHorizontal className='mr-2 h-6 w-6 text-primary' />
                Personalize the Plan
              </CardTitle>
              <CardDescription>
                Fine-tune the recommended plan to better fit your client&apos;s
                specific needs and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <PageLoadingSpinner message='Loading customization tools...' />
                }
              >
                <CustomizePlanSection clientId={clientId} />
              </Suspense>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachSmartCaloriePlannerPage;
