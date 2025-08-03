'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';

interface CalorieSummaryProps {
  totalTarget: number;
  totalConsumed: number;
  difference: number;
  percentage: number;
}

export function CalorieSummary({
  totalTarget,
  totalConsumed,
  difference,
  percentage,
}: CalorieSummaryProps) {
  const isOver = difference > 0;
  const isUnder = difference < 0;
  const isOnTarget = Math.abs(difference) <= totalTarget * 0.05; // Within 5%

  const getStatusColor = () => {
    if (isOnTarget) return 'text-primary';
    if (isOver) return 'text-destructive';
    return 'text-chart-4';
  };

  const getStatusIcon = () => {
    if (isOnTarget) return <Target className='h-5 w-5 text-primary' />;
    if (isOver) return <TrendingUp className='h-5 w-5 text-destructive' />;
    return <TrendingDown className='h-5 w-5 text-chart-4' />;
  };

  const getStatusMessage = () => {
    if (isOnTarget) return 'On target! Great job!';
    if (isOver) return `${Math.abs(difference)} kcal over target`;
    return `${Math.abs(difference)} kcal under target`;
  };

  return (
    <Card className='shadow-lg border-border/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold flex items-center gap-2 text-primary'>
          <Target className='h-5 w-5' />
          Daily Calorie Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='font-medium'>Progress</span>
            <span className={getStatusColor()}>{percentage}%</span>
          </div>
          <Progress
            value={Math.min(percentage, 150)} // Cap at 150% for visual purposes
            className={cn(
              'h-3',
              percentage > 105 && '[&>div]:bg-destructive',
              percentage < 95 && '[&>div]:bg-chart-4',
              percentage >= 95 && percentage <= 105 && '[&>div]:bg-primary'
            )}
          />
        </div>

        {/* Summary Stats */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center p-4 bg-muted/30 rounded-lg border border-border/30'>
            <p className='text-sm text-muted-foreground font-medium'>Target</p>
            <p className='text-xl font-bold text-primary'>{totalTarget}</p>
            <p className='text-xs text-muted-foreground'>kcal</p>
          </div>
          <div className='text-center p-4 bg-secondary/10 rounded-lg border border-secondary/20'>
            <p className='text-sm text-muted-foreground font-medium'>
              Consumed
            </p>
            <p className='text-xl font-bold text-secondary'>{totalConsumed}</p>
            <p className='text-xs text-muted-foreground'>kcal</p>
          </div>
        </div>

        {/* Status Message */}
        <div
          className={cn(
            'flex items-center justify-center gap-2 p-4 rounded-lg border',
            isOnTarget && 'bg-primary/5 border-primary/20',
            isOver && 'bg-destructive/10 border-destructive/20',
            isUnder && 'bg-chart-4/10 border-chart-4/20'
          )}
        >
          {getStatusIcon()}
          <span className={cn('font-semibold', getStatusColor())}>
            {getStatusMessage()}
          </span>
        </div>

        {/* Breakdown */}
        <div className='space-y-2'>
          <h4 className='font-semibold text-sm text-foreground'>Breakdown:</h4>
          <div className='grid grid-cols-3 gap-2 text-xs'>
            <div className='text-center p-3 bg-muted/30 rounded-md border border-border/30'>
              <p className='text-muted-foreground font-medium'>Difference</p>
              <p className={cn('font-bold', getStatusColor())}>
                {difference > 0 ? '+' : ''}
                {difference} kcal
              </p>
            </div>
            <div className='text-center p-3 bg-muted/30 rounded-md border border-border/30'>
              <p className='text-muted-foreground font-medium'>Remaining</p>
              <p className='font-bold text-foreground'>
                {Math.max(0, totalTarget - totalConsumed)} kcal
              </p>
            </div>
            <div className='text-center p-3 bg-muted/30 rounded-md border border-border/30'>
              <p className='text-muted-foreground font-medium'>Progress</p>
              <p className='font-bold text-foreground'>{percentage}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
