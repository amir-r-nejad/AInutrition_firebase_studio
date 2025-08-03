import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Award } from 'lucide-react';
import { MealProgressEntry } from '../types';

type OverallAdherenceProps = {
  progressPlan: MealProgressEntry[];
};

function OverallAdherence({ progressPlan }: OverallAdherenceProps) {
  const totalDays = progressPlan.length;
  const daysFollowed = progressPlan.filter((plan) => plan.followed_plan).length;
  const adherencePercentage = +((daysFollowed / totalDays) * 100).toFixed(1);

  const getAdherenceColor = () => {
    if (adherencePercentage >= 80) return 'text-primary';
    if (adherencePercentage >= 60) return 'text-chart-4';
    return 'text-destructive';
  };

  const getAdherenceMessage = () => {
    if (adherencePercentage >= 80) return 'Excellent adherence! Keep it up! 🎉';
    if (adherencePercentage >= 60)
      return 'Good progress! Room for improvement 💪';
    return "Let's work on consistency 📈";
  };

  const getProgressColor = () => {
    if (adherencePercentage >= 80) return '[&>div]:bg-primary';
    if (adherencePercentage >= 60) return '[&>div]:bg-chart-4';
    return '[&>div]:bg-destructive';
  };

  return (
    <Card className='border-primary/20'>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2 text-primary'>
          <Award className='h-5 w-5' />
          Overall Adherence Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='text-center space-y-4'>
          <div className={cn('text-6xl font-bold', getAdherenceColor())}>
            {adherencePercentage}%
          </div>
          <Progress
            value={adherencePercentage}
            className={cn('h-4', getProgressColor())}
          />
          <p className={cn('text-lg font-semibold', getAdherenceColor())}>
            {getAdherenceMessage()}
          </p>
        </div>

        <div className='grid grid-cols-3 gap-4 pt-4 border-t'>
          <div className='text-center'>
            <div className='text-sm text-muted-foreground font-medium'>
              Performance
            </div>
            <div className={cn('text-lg font-bold', getAdherenceColor())}>
              {adherencePercentage >= 80
                ? 'Excellent'
                : adherencePercentage >= 60
                ? 'Good'
                : 'Needs Work'}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-muted-foreground font-medium'>
              Consistency
            </div>
            <div className={cn('text-lg font-bold', getAdherenceColor())}>
              {adherencePercentage >= 80
                ? 'High'
                : adherencePercentage >= 60
                ? 'Medium'
                : 'Low'}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-muted-foreground font-medium'>
              Trend
            </div>
            <div className='text-lg font-bold text-chart-2'>Improving</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OverallAdherence;
