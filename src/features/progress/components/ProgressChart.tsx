'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendingDown } from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { BodyProgressEntry } from '../types';

interface ProgressChartProps {
  entries: BodyProgressEntry[];
  selectedMonth: string;
}

const chartConfig = {
  weight: {
    label: 'Weight (kg)',
    color: 'hsl(var(--primary))',
  },
  bodyFat: {
    label: 'Body Fat (%)',
    color: 'hsl(var(--chart-2))',
  },
  waist: {
    label: 'Waist (cm)',
    color: 'hsl(var(--chart-3))',
  },
};

export function ProgressChart({ entries, selectedMonth }: ProgressChartProps) {
  const chartData = entries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      weight: entry.weight_kg,
      bodyFat: entry.bf_percentage,
      waist: entry.waist_cm,
      fullDate: entry.date,
    }));

  const monthLabel = selectedMonth
    ? new Date(
        parseInt(selectedMonth.split('-')[0]),
        parseInt(selectedMonth.split('-')[1]) - 1
      ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  if (entries.length === 0) {
    return (
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2 text-primary'>
            <TrendingDown className='h-5 w-5' />
            Weight Progress - {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-64 text-muted-foreground'>
            <div className='text-center'>
              <TrendingDown className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p className='text-lg'>No progress data for {monthLabel}</p>
              <p className='text-sm'>
                Add your first weekly measurement below!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='shadow-lg'>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2 text-primary'>
          <TrendingDown className='h-5 w-5' />
          Weight Progress - {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='h-64 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    return `Date: ${payload[0].payload.fullDate}`;
                  }
                  return value;
                }}
              />
              <Line
                type='monotone'
                dataKey='weight'
                stroke='var(--color-weight)'
                strokeWidth={3}
                dot={{ fill: 'var(--color-weight)', strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: 'var(--color-weight)',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
