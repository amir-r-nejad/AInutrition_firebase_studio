'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useQueryParams } from '@/hooks/useQueryParams';
import { format } from 'date-fns';
import { Flame, Target, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartData } from '../types';
import { useParams } from 'next/navigation';

interface MealProgressChartProps {
  data: ChartData[];
}

const chartConfig = {
  target_calories: {
    label: 'Target Calories',
    color: 'hsl(var(--primary))',
  },
  consumed_calories: {
    label: 'Consumed Calories',
    color: 'hsl(var(--chart-2))',
  },
};

export function ProgressChart({ data }: MealProgressChartProps) {
  const params = useParams<{ clientId?: string }>();
  const isCoachView = !!params?.clientId;

  const { getQueryParams } = useQueryParams();
  const selectedDate =
    getQueryParams('selected_day') || new Date().toISOString();

  const chartData = data.map((item) => ({
    meal: item.meal_type,
    target: item.target_calories,
    consumed: item.consumed_calories,
  }));

  // Add total summary bar
  const totalTarget = data.reduce((sum, item) => sum + item.target_calories, 0);
  const totalConsumed = data.reduce(
    (sum, item) => sum + item.consumed_calories,
    0
  );

  chartData.push({
    meal: 'Total',
    target: totalTarget,
    consumed: totalConsumed,
  });

  return (
    <Card className='shadow-lg'>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2 text-primary'>
          <TrendingUp className='h-5 w-5' />
          {isCoachView
            ? `Client's Meal Progress - ${format(
                new Date(selectedDate),
                'EEEE, MMMM d, yyyy'
              )}`
            : `Daily Meal Progress - ${format(
                new Date(selectedDate),
                'EEEE, MMMM d, yyyy'
              )}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='h-80 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis
                dataKey='meal'
                className='text-xs'
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor='end'
                height={80}
              />
              <YAxis className='text-xs' tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey='target'
                fill='var(--color-target_calories)'
                name={isCoachView ? 'Client Target' : 'Target'}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey='consumed'
                fill='var(--color-consumed_calories)'
                name={isCoachView ? 'Client Consumed' : 'Consumed'}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className='mt-4 grid grid-cols-2 gap-2'>
          <div className='flex flex-col items-center justify-center bg-chart-1/10 rounded-lg py-2'>
            <div className='flex items-center gap-0.5'>
              <Target className='text-chart-1 size-7' />
              <p className='text-sm text-muted-foreground font-medium'>
                {isCoachView ? 'Target Calories (Client)' : 'Target Calories'}
              </p>
            </div>
            <p className='text-xl font-bold text-chart-1'>{totalTarget}</p>
          </div>

          <div className='flex flex-col items-center justify-center bg-chart-2/10 rounded-lg py-2'>
            <div className='flex items-center gap-0.5'>
              <Flame className='text-chart-2 size-7' />
              <p className='text-sm text-muted-foreground font-medium'>
                {isCoachView
                  ? 'Consumed Calories (Client)'
                  : 'Consumed Calories'}
              </p>
            </div>
            <p className='text-xl font-bold text-chart-2'>{totalConsumed}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
