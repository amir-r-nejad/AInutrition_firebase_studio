'use client';

import { CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { TotalMacros } from '../../types/toolsGlobalTypes';

type DailyMacroSummaryProps = {
  targets: TotalMacros | null;
  message: string | null;
};

function DailyMacroSummary({ targets, message }: DailyMacroSummaryProps) {
  if (!targets)
    return (
      <CardContent>
        <div className='text-destructive text-center p-4 border border-destructive/50 rounded-md bg-destructive/10'>
          <p className='mb-2'>
            Could not load or calculate your total daily macros.
          </p>
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

  return (
    <CardContent>
      <h3 className='text-xl font-semibold mb-1 text-primary'>
        Your Estimated Total Daily Macros:
      </h3>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/50 mb-3'>
        <p>
          <span className='font-medium'>Calories:</span>{' '}
          {formatNumber(targets.calories, {
            maximumFractionDigits: 0,
          })}{' '}
          kcal
        </p>
        <p>
          <span className='font-medium'>Protein:</span>{' '}
          {formatNumber(targets.protein_g, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{' '}
          g
        </p>
        <p>
          <span className='font-medium'>Carbs:</span>{' '}
          {formatNumber(targets.carbs_g, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{' '}
          g
        </p>
        <p>
          <span className='font-medium'>Fat:</span>{' '}
          {formatNumber(targets.fat_g, {
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
}

export default DailyMacroSummary;
