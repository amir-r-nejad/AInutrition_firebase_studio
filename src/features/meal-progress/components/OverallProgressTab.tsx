import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, LineChart } from 'lucide-react';
import { MealProgressEntry } from '../types';
import AdherenceChart from './AdherenceChart';
import NutritionTotals from './NutritionTotals';
import OverallAdherence from './OverallAdherence';
import ProgressStats from './ProgressStats';
import EmptyState from '@/components/ui/EmptyState';

export function OverallProgressTab({
  progressPlan,
}: {
  progressPlan: MealProgressEntry[];
}) {
  if (!progressPlan || progressPlan.length === 0) {
    return (
      <EmptyState
        icon={LineChart}
        title='No progress tracked yet'
        description='Start tracking your meals to view your overall progress and adherence data here.'
      />
    );
  }

  return (
    <div className='space-y-6'>
      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2 text-primary'>
            <Calendar className='h-5 w-5' />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Progress Stats */}
          <ProgressStats progressPlan={progressPlan} />

          {/* Overall Adherence */}
          <OverallAdherence progressPlan={progressPlan} />

          {/* Nutrition Totals */}
          <NutritionTotals progressPlan={progressPlan} />

          {/* Adherence Chart */}
          <AdherenceChart progressPlan={progressPlan} />
        </CardContent>
      </Card>
    </div>
  );
}
