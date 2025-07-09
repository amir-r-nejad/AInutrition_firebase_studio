'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GlobalCalculatedTargets } from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';

function CustomizePlanTable({
  plan,
}: {
  plan: GlobalCalculatedTargets | null;
}) {
  if (!plan) return null;

  return (
    <div className='mt-6'>
      <h4 className='text-xl font-semibold mb-2 text-primary'>
        Your Custom Plan Breakdown
      </h4>

      <Table>
        <TableHeader>
          <TableRow>
            {/* */}
            <TableHead>Macronutrient</TableHead>
            {/* */}
            <TableHead className='text-right'>% of Daily Calories</TableHead>
            {/* */}
            <TableHead className='text-right'>Grams per Day</TableHead>
            {/* */}
            <TableHead className='text-right'>Calories per Day</TableHead>
            {/* */}
          </TableRow>
          {/* */}
        </TableHeader>
        <TableBody>
          <TableRow>
            {/* */}
            <TableCell className='font-medium'>Protein</TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.proteinTargetPct
                ? formatNumber(plan.proteinTargetPct)
                : 'N/A'}
              %
            </TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.proteinGrams ? formatNumber(plan.proteinGrams) : 'N/A'} g
            </TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.proteinCalories
                ? formatNumber(plan.proteinCalories)
                : 'N/A'}{' '}
              kcal
            </TableCell>
            {/* */}
          </TableRow>
          {/* */}
          <TableRow>
            {/* */}
            <TableCell className='font-medium'>Carbohydrates</TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.carbTargetPct ? formatNumber(plan.carbTargetPct) : 'N/A'}%
            </TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.carbGrams ? formatNumber(plan.carbGrams) : 'N/A'} g
            </TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.carbCalories ? formatNumber(plan.carbCalories) : 'N/A'} kcal
            </TableCell>
            {/* */}
          </TableRow>
          {/* */}
          <TableRow>
            {/* */}
            <TableCell className='font-medium'>Fat</TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.fatTargetPct ? formatNumber(plan.fatTargetPct) : 'N/A'}%
            </TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.fatGrams ? formatNumber(plan.fatGrams) : 'N/A'} g
            </TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.fatCalories ? formatNumber(plan.fatCalories) : 'N/A'} kcal
            </TableCell>
            {/* */}
          </TableRow>
          {/* */}
          <TableRow className='font-semibold bg-muted/50'>
            {/* */}
            <TableCell>Total</TableCell>
            {/* */}
            <TableCell className='text-right'>100%</TableCell>
            {/* */}
            <TableCell className='text-right'>-</TableCell>
            {/* */}
            <TableCell className='text-right'>
              {plan.finalTargetCalories
                ? formatNumber(plan.finalTargetCalories)
                : 'N/A'}{' '}
              kcal
            </TableCell>
            {/* */}
          </TableRow>
          {/* */}
        </TableBody>
      </Table>
    </div>
  );
}

export default CustomizePlanTable;
