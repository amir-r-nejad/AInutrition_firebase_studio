'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Activity, Calendar, Ruler, TrendingDown, Weight } from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { BodyProgressEntry } from '../types';
import {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

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

  const monthLabel =
    selectedMonth === 'selectedMonth'
      ? 'All months status'
      : selectedMonth
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

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'transparent' }}
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
                tooltipType='none'
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    return (
      <div className='bg-card p-3 border border-border rounded shadow-lg'>
        <div className='flex items-center gap-0.5 text-foreground'>
          <Calendar className='size-3' />
          <p className='font-semibold'>{`Date: ${label}`}</p>
        </div>
        <div className='flex items-center gap-0.5 text-primary'>
          <Weight className='size-3' />
          <p className='font-semibold'>{`Weight: ${payload[0]?.value} kg`}</p>
        </div>
        <div className='flex items-center gap-0.5 text-ring'>
          <Ruler className='size-3' />
          <p className='font-semibold'>
            {`Waist: ${payload[0].payload?.waist ?? 'N/A'} Cm`}
          </p>
        </div>
        <div className='flex items-center gap-0.5 text-destructive'>
          <Activity className='size-3' />
          <p className='font-semibold'>
            {`Body Fat: ${payload[0].payload?.bodyFat ?? 'N/A'}%`}
          </p>
        </div>
      </div>
    );
  }
  return null;
}
