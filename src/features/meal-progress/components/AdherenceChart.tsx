'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { MealProgressEntry } from '../types';

type AdherenceChartProps = {
  progressPlan: MealProgressEntry[];
};

const chartConfig = {
  adherence: {
    label: 'Adherence %',
    color: 'hsl(var(--primary))',
  },
  calories: {
    label: 'Calories',
    color: 'hsl(var(--chart-2))',
  },
};

function AdherenceChart({ progressPlan }: AdherenceChartProps) {
  const dailyData = progressPlan.reduce((acc, entry) => {
    const date = entry.date;

    if (!acc[date]) {
      acc[date] = {
        date,
        totalMeals: 0,
        followedMeals: 0,
        totalCalories: 0,
      };
    }

    acc[date].totalMeals += 1;
    if (entry.followed_plan) {
      acc[date].followedMeals += 1;
    }
    acc[date].totalCalories += entry.consumed_calories || 0;

    return acc;
  }, {} as Record<string, { date: string; totalMeals: number; followedMeals: number; totalCalories: number }>);

  const chartData = Object.values(dailyData)
    .map((day) => ({
      date: day.date,
      adherence: +((day.followedMeals / day.totalMeals) * 100).toFixed(1),
      calories: day.totalCalories,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2 text-primary'>
          <TrendingUp className='h-5 w-5' />
          Adherence Trends
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
                dataKey='date'
                className='text-xs'
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className='text-xs'
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey='adherence'
                fill='var(--color-adherence)'
                name='Adherence %'
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default AdherenceChart;
