'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Award, CheckCircle, Target } from 'lucide-react';
import { MealProgress, PlannedMeal } from '../types';

interface TrackingStatusProps {
  plannedMeals: PlannedMeal[];
  dayProgress: MealProgress[];
  selectedDate: string;
}

export function TrackingStatus({
  plannedMeals,
  dayProgress,
  selectedDate,
}: TrackingStatusProps) {
  const totalMeals = plannedMeals.length;
  const trackedMeals = dayProgress.length;
  const followedMeals = dayProgress.filter((p) => p.followed_plan).length;

  const trackingPercentage =
    totalMeals > 0 ? Math.round((trackedMeals / totalMeals) * 100) : 0;
  const adherencePercentage =
    totalMeals > 0 ? Math.round((followedMeals / totalMeals) * 100) : 0;

  const getMotivationalMessage = () => {
    if (trackingPercentage === 100 && adherencePercentage >= 80) {
      return "Excellent! You're crushing your nutrition goals! 🎉";
    } else if (trackingPercentage >= 80) {
      return 'Great job staying on track! Keep it up! 💪';
    } else if (trackingPercentage >= 50) {
      return 'Good progress! Try to track all your meals for better insights.';
    } else if (trackingPercentage > 0) {
      return 'Nice start! Remember to track all your meals throughout the day.';
    } else {
      return 'Start tracking your meals to see your progress!';
    }
  };

  const getStatusColor = () => {
    if (adherencePercentage >= 80) return 'text-primary';
    if (adherencePercentage >= 60) return 'text-chart-4';
    return 'text-muted-foreground';
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <Card className='shadow-lg border-border/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold flex items-center gap-2 text-primary'>
          <Award className='h-5 w-5' />
          {isToday ? "Today's" : 'Daily'} Progress Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Tracking Progress */}
        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-semibold'>Meals Tracked</span>
            <Badge variant='outline' className='text-xs border-border/50'>
              {trackedMeals} of {totalMeals}
            </Badge>
          </div>
          <Progress value={trackingPercentage} className='h-3' />
          <p className='text-xs text-muted-foreground text-center'>
            {trackingPercentage}% of meals tracked
          </p>
        </div>

        {/* Plan Adherence */}
        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-semibold'>Plan Adherence</span>
            <Badge
              variant='outline'
              className={cn(
                'text-xs border-border/50',
                adherencePercentage >= 80 &&
                  'border-primary/30 text-primary bg-primary/5',
                adherencePercentage >= 60 &&
                  adherencePercentage < 80 &&
                  'border-chart-4/30 text-chart-4 bg-chart-4/5',
                adherencePercentage < 60 &&
                  'border-border/50 text-muted-foreground'
              )}
            >
              {followedMeals} of {totalMeals}
            </Badge>
          </div>
          <Progress
            value={adherencePercentage}
            className={cn(
              'h-3',
              adherencePercentage >= 80 && '[&>div]:bg-primary',
              adherencePercentage >= 60 &&
                adherencePercentage < 80 &&
                '[&>div]:bg-chart-4',
              adherencePercentage < 60 && '[&>div]:bg-muted-foreground'
            )}
          />
          <p className='text-xs text-muted-foreground text-center'>
            {adherencePercentage}% plan adherence
          </p>
        </div>

        {/* Motivational Message */}
        <div
          className={cn(
            'flex items-center gap-2 p-4 rounded-lg border',
            adherencePercentage >= 80 && 'bg-primary/5 border-primary/20',
            adherencePercentage >= 60 &&
              adherencePercentage < 80 &&
              'bg-chart-4/5 border-chart-4/20',
            adherencePercentage < 60 && 'bg-muted/30 border-border/50'
          )}
        >
          {adherencePercentage >= 80 ? (
            <CheckCircle className='h-5 w-5 text-primary' />
          ) : (
            <Target className='h-5 w-5 text-primary' />
          )}
          <span className={cn('text-sm font-semibold', getStatusColor())}>
            {getMotivationalMessage()}
          </span>
        </div>

        {/* Quick Stats */}
        <div className='grid grid-cols-3 gap-2 text-center'>
          <div className='p-3 bg-primary/10 rounded-md border border-primary/20'>
            <p className='text-xs text-muted-foreground font-medium'>Tracked</p>
            <p className='font-bold text-primary'>{trackedMeals}</p>
          </div>
          <div className='p-3 bg-primary/5 rounded-md border border-primary/10'>
            <p className='text-xs text-muted-foreground font-medium'>
              Followed
            </p>
            <p className='font-bold text-primary'>{followedMeals}</p>
          </div>
          <div className='p-3 bg-chart-4/10 rounded-md border border-chart-4/20'>
            <p className='text-xs text-muted-foreground font-medium'>Custom</p>
            <p className='font-bold text-chart-4'>
              {trackedMeals - followedMeals}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
