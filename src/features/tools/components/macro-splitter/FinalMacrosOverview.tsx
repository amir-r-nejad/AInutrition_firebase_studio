'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollBar
import SectionHeader from '@/components/ui/SectionHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNumber } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { CalculatedMealMacros } from '../../types/toolsGlobalTypes';

type FinalMacroProps = {
  calculatedSplit: CalculatedMealMacros[] | null;
  isCoachPreview?: boolean;
};

function FinalMacrosOverview({
  calculatedSplit,
  isCoachPreview = false,
}: FinalMacroProps) {
  if (!calculatedSplit) return null;

  return (
    <Card className='shadow-lg mt-8'>
      <SectionHeader
        className='text-2xl'
        title='Final Meal Macros (Snapshot)'
        description='This was the calculated split when you last clicked "Save &amp; Show Final Split".'
      />

      <CardContent>
        <ScrollArea className='w-full'>
          <Table className='min-w-[700px]'>
            <TableHeader>
              <TableRow>
                <TableHead className='sticky left-0 bg-card z-10 w-[150px] px-2 py-2 text-left text-xs font-medium'>
                  Meal
                </TableHead>
                <TableHead className='px-2 py-2 text-right text-xs font-medium'>
                  Calories (kcal)
                </TableHead>
                <TableHead className='px-2 py-2 text-right text-xs font-medium'>
                  Protein (g)
                </TableHead>
                <TableHead className='px-2 py-2 text-right text-xs font-medium'>
                  Carbs (g)
                </TableHead>
                <TableHead className='px-2 py-2 text-right text-xs font-medium'>
                  Fat (g)
                </TableHead>
                {!isCoachPreview && (
                  <TableHead className='px-2 py-2 text-right text-xs font-medium w-[180px]'>
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculatedSplit.map((mealData) => (
                <TableRow key={mealData.mealName}>
                  <TableCell className='font-medium sticky left-0 bg-card z-10 px-2 py-1 text-sm'>
                    {mealData.mealName}
                  </TableCell>
                  <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                    {formatNumber(mealData.Calories, {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                    {formatNumber(mealData['Protein (g)'], {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </TableCell>
                  <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                    {formatNumber(mealData['Carbs (g)'], {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </TableCell>
                  <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                    {formatNumber(mealData['Fat (g)'], {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </TableCell>
                  {!isCoachPreview && (
                    <TableCell className='px-2 py-1 text-right'>
                      <Link
                        href={{
                          pathname: '/tools/meal-suggestions',
                          query: {
                            mealName: mealData.mealName,
                            calories: mealData.Calories.toString(),
                            protein: mealData['Protein (g)'].toString(),
                            carbs: mealData['Carbs (g)'].toString(),
                            fat: mealData['Fat (g)'].toString(),
                          },
                        }}
                      >
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='h-8 text-xs'
                        >
                          <Lightbulb className='mr-1.5 h-3.5 w-3.5' />
                          Suggest Meals
                        </Button>
                      </Link>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow className='font-semibold border-t-2 text-sm bg-muted/70'>
                <TableCell className='sticky left-0 bg-muted/70 z-10 px-2 py-1'>
                  Total
                </TableCell>
                <TableCell className='px-2 py-1 text-right tabular-nums'>
                  {formatNumber(
                    calculatedSplit.reduce(
                      (sum, meal) => sum + meal.Calories,
                      0
                    ),
                    { maximumFractionDigits: 0 }
                  )}
                </TableCell>
                <TableCell className='px-2 py-1 text-right tabular-nums'>
                  {formatNumber(
                    calculatedSplit.reduce(
                      (sum, meal) => sum + meal['Protein (g)'],
                      0
                    ),
                    { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                  )}
                </TableCell>
                <TableCell className='px-2 py-1 text-right tabular-nums'>
                  {formatNumber(
                    calculatedSplit.reduce(
                      (sum, meal) => sum + meal['Carbs (g)'],
                      0
                    ),
                    { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                  )}
                </TableCell>
                <TableCell className='px-2 py-1 text-right tabular-nums'>
                  {formatNumber(
                    calculatedSplit.reduce(
                      (sum, meal) => sum + meal['Fat (g)'],
                      0
                    ),
                    { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                  )}
                </TableCell>
                <TableCell className='px-2 py-1'></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default FinalMacrosOverview;
