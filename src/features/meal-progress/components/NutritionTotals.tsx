import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { MealProgressEntry } from '../types';

type NutritionTotalsProps = {
  progressPlan: MealProgressEntry[];
};

function NutritionTotals({ progressPlan }: NutritionTotalsProps) {
  const totalCalories = progressPlan.reduce(
    (sum, plan) => (sum += plan.consumed_calories),
    0
  );
  const totalProtein = progressPlan.reduce(
    (sum, plan) => (sum += plan.consumed_protein),
    0
  );
  const totalCarbs = progressPlan.reduce(
    (sum, plan) => (sum += plan.consumed_carbs),
    0
  );
  const totalFat = progressPlan.reduce(
    (sum, plan) => (sum += plan.consumed_fat),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2 text-primary'>
          <Target className='h-5 w-5' />
          Nutrition Totals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center p-4 bg-primary/10 rounded-lg border border-primary/20'>
            <div className='text-2xl font-bold text-primary'>
              {(totalCalories / 1000).toFixed(1)}k
            </div>
            <p className='text-sm text-muted-foreground font-medium'>
              Total Calories
            </p>
          </div>
          <div className='text-center p-4 bg-chart-2/10 rounded-lg border border-chart-2/20'>
            <div className='text-2xl font-bold text-chart-2'>
              {(totalProtein / 1000).toFixed(1)}k
            </div>
            <p className='text-sm text-muted-foreground font-medium'>
              Protein (g)
            </p>
          </div>
          <div className='text-center p-4 bg-chart-3/10 rounded-lg border border-chart-3/20'>
            <div className='text-2xl font-bold text-chart-3'>
              {(totalCarbs / 1000).toFixed(1)}k
            </div>
            <p className='text-sm text-muted-foreground font-medium'>
              Carbs (g)
            </p>
          </div>
          <div className='text-center p-4 bg-chart-4/10 rounded-lg border border-chart-4/20'>
            <div className='text-2xl font-bold text-chart-4'>
              {(totalFat / 1000).toFixed(1)}k
            </div>
            <p className='text-sm text-muted-foreground font-medium'>Fat (g)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NutritionTotals;
