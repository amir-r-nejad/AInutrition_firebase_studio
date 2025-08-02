import { CardContent } from '@/components/ui/card';
import { getMealPlan } from '@/lib/supabase/data-service';
import { formatDate } from 'date-fns';
import { getUserMealProgress } from '../lib/meal-progress-service';
import { generateChartData } from '../lib/utils';
import { DatePicker } from './DatePicker';
import { MealProgressGrid } from './MealProgressGrid';
import { ProgressChart } from './ProgressChart';

type MealProgressSectionProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  clientId?: string;
};

export async function MealProgressSection({
  searchParams,
  clientId,
}: MealProgressSectionProps) {
  const params = await searchParams;
  const isCoachView = !!clientId;

  const date = params.selected_day || new Date().toISOString();

  const mealPlan = await getMealPlan(clientId);
  const progressPlan = await getUserMealProgress(clientId);

  const selectedMeals = mealPlan.meal_data?.days.find(
    (meal) => meal.day_of_week === formatDate(date, 'EEEE')
  );

  const selectedProgressMeals = progressPlan.filter(
    (meal) => formatDate(meal.date, 'EEEE') === formatDate(date, 'EEEE')
  );

  const trackedDays = [...new Set(progressPlan?.map((meal) => meal.date))];

  if (!selectedMeals || !selectedProgressMeals) return;

  const chartData = generateChartData(
    selectedMeals.meals,
    selectedProgressMeals
  );

  return (
    <CardContent className='space-y-6'>
      <DatePicker selectedDays={trackedDays} />

      <ProgressChart data={chartData} />

      <div>
        <h3 className='text-xl font-semibold mb-4 text-primary'>
          {isCoachView ? "Client's Meal Tracking Overview" : 'Track Your Meals'}
        </h3>

        <MealProgressGrid
          meals={selectedMeals.meals}
          progressMeals={selectedProgressMeals}
        />
      </div>
    </CardContent>
  );
}
