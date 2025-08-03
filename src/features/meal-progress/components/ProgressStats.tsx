import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, CheckCircle, Flame, XCircle } from 'lucide-react';
import { MealProgressEntry } from '../types';

type ProgressStatsProps = {
  progressPlan: MealProgressEntry[];
};

function ProgressStats({ progressPlan }: ProgressStatsProps) {
  const totalDays = progressPlan.length;
  const totalCalories = progressPlan.reduce(
    (acc, plan) => (acc += plan.consumed_calories),
    0
  );
  const daysFollowed = progressPlan.filter((plan) => plan.followed_plan).length;
  const daysNotFollowed = progressPlan.filter(
    (plan) => !plan.followed_plan
  ).length;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      <Card className='border-primary/20 bg-primary/5'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-primary'>
            Days Followed
          </CardTitle>
          <CheckCircle className='h-4 w-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-primary'>{daysFollowed}</div>
          <p className='text-xs text-muted-foreground'>
            out of {totalDays} total days
          </p>
        </CardContent>
      </Card>

      <Card className='border-destructive/20 bg-destructive/5'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-destructive'>
            Days Missed
          </CardTitle>
          <XCircle className='h-4 w-4 text-destructive' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-destructive'>
            {daysNotFollowed}
          </div>
          <p className='text-xs text-muted-foreground'>
            {((daysNotFollowed / totalDays) * 100).toFixed(1)}% of total days
          </p>
        </CardContent>
      </Card>

      <Card className='border-chart-2/20 bg-chart-2/5'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-chart-2'>
            Total Calories
          </CardTitle>
          <Flame className='h-4 w-4 text-chart-2' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-chart-2'>
            {(totalCalories / 1000).toFixed(1)}k
          </div>
        </CardContent>
      </Card>

      <Card className='border-chart-3/20 bg-chart-3/5'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-chart-3'>
            Adherence Rate
          </CardTitle>
          <Award className='h-4 w-4 text-chart-3' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-chart-3'>
            {((daysFollowed / totalDays) * 100).toFixed(1)}%
          </div>
          <p className='text-xs text-muted-foreground'>plan adherence rate</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProgressStats;
