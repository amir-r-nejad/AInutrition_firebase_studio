import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { MealProgressEntry } from '../types';
import AdherenceChart from './AdherenceChart';
import NutritionTotals from './NutritionTotals';
import OverallAdherence from './OverallAdherence';
import ProgressStats from './ProgressStats';

export function OverallProgressTab({
  progressPlan,
}: {
  progressPlan: MealProgressEntry[];
}) {
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
