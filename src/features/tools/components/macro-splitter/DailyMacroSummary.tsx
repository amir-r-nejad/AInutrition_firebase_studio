import { CardContent } from '@/components/ui/card';
import { getUserPlan } from '@/lib/supabase/data-service';
import { formatNumber } from '@/lib/utils';
import { Info } from 'lucide-react';
import Link from 'next/link';

async function DailyMacroSummary({ clientId }: { clientId?: string }) {
  try {
    const plan = await getUserPlan(clientId);

    const hasCustomMacros =
      plan.custom_total_calories ||
      plan.custom_protein_g ||
      plan.custom_carbs_g ||
      plan.custom_fat_g;

    const message = hasCustomMacros
      ? 'Daily totals are based on your manual macro breakdown from the Smart Planner.'
      : 'Daily totals are calculated from your profile targets. Use the Smart Planner to set custom macros.';

    return (
      <CardContent>
        <h3 className='text-xl font-semibold mb-1 text-primary'>
          Your Estimated Total Daily Macros:
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/50 mb-3'>
          <p>
            <span className='font-medium'>Calories:</span>{' '}
            {formatNumber(
              plan.custom_total_calories || plan.target_daily_calories || 0,
              { maximumFractionDigits: 0 }
            )}{' '}
            kcal
          </p>
          <p>
            <span className='font-medium'>Protein:</span>{' '}
            {formatNumber(plan.custom_protein_g ?? plan.target_protein_g ?? 0, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{' '}
            g
          </p>
          <p>
            <span className='font-medium'>Carbs:</span>{' '}
            {formatNumber(plan.custom_carbs_g ?? plan.target_carbs_g ?? 0, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{' '}
            g
          </p>
          <p>
            <span className='font-medium'>Fat:</span>{' '}
            {formatNumber(plan.custom_fat_g ?? plan.target_fat_g ?? 0, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{' '}
            g
          </p>
        </div>
        {message && (
          <div className='text-sm text-muted-foreground flex items-center gap-2 p-2 rounded-md border border-dashed bg-background'>
            <Info className='h-4 w-4 text-accent shrink-0' />
            <span>{message}</span>
          </div>
        )}
      </CardContent>
    );
  } catch (error: any) {
    return (
      <CardContent>
        <div className='text-destructive text-center p-4 border border-destructive/50 rounded-md bg-destructive/10'>
          <p className='mb-2'>{error}</p>
          <p className='text-sm'>
            Please ensure your profile is complete or use the{' '}
            <Link
              href='/tools/smart-calorie-planner'
              className='underline hover:text-destructive/80'
            >
              Smart Calorie Planner
            </Link>{' '}
            to set your targets.
          </p>
        </div>
      </CardContent>
    );
  }
}

export default DailyMacroSummary;
