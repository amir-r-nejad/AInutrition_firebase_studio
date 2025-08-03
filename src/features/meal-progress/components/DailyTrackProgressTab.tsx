import { Card, CardContent, CardHeader } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import SectionHeader from '@/components/ui/SectionHeader';
import { getMealPlan } from '@/lib/supabase/data-service';
import { formatDate } from 'date-fns';
import { TrainTrackIcon, UtensilsCrossed } from 'lucide-react';
import { generateChartData } from '../lib/utils';
import { MealProgressEntry } from '../types';
import { DatePicker } from './DatePicker';
import { MealProgressGrid } from './MealProgressGrid';
import { ProgressChart } from './ProgressChart';

type DailyTrackProgressTabProps = {
  progressPlan: MealProgressEntry[];
  searchParams: Promise<{ [key: string]: string | undefined }>;
  clientId?: string;
};

async function DailyTrackProgressTab({
  progressPlan,
  searchParams,
  clientId,
}: DailyTrackProgressTabProps) {
  const params = await searchParams;
  const mealPlan = await getMealPlan(clientId);

  const isCoachView = !!clientId;
  const date = params.selected_day || new Date().toISOString();
  const trackedDays = [...new Set(progressPlan?.map((meal) => meal.date))];

  const selectedMeals = mealPlan.meal_data?.days.find(
    (meal) => meal.day_of_week === formatDate(date, 'EEEE')
  );
  const selectedProgressMeals = progressPlan.filter(
    (meal) => formatDate(meal.date, 'EEEE') === formatDate(date, 'EEEE')
  );

  if (!selectedMeals || !selectedProgressMeals)
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title='No meal data available'
        description='We couldn’t find any meal plan or progress data for the selected day. Try picking another date or make sure your plan is properly set up.'
      />
    );

  const chartData = generateChartData(
    selectedMeals.meals,
    selectedProgressMeals
  );

  return (
    <Card>
      <CardHeader>
        <DatePicker selectedDays={trackedDays} />
      </CardHeader>

      <CardContent className='space-y-6'>
        <ProgressChart data={chartData} />

        <Card>
          <SectionHeader
            className='text-xl flex items-center gap-2 text-primary'
            icon={<TrainTrackIcon className='h-5 w-5 text-primary' />}
            title={
              isCoachView
                ? "Client's Meal Tracking Overview"
                : 'Track Your Meals'
            }
          />

          <CardContent>
            <MealProgressGrid
              meals={selectedMeals.meals}
              progressMeals={selectedProgressMeals}
            />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export default DailyTrackProgressTab;
