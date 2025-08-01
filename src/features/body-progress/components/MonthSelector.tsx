'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryParams } from '@/hooks/useQueryParams';
import { MonthOption } from '../types';

interface MonthSelectorProps {
  months: MonthOption[];
}

export function MonthSelector({ months }: MonthSelectorProps) {
  const { updateQueryParams, getQueryParams } = useQueryParams();
  const selectedMonth = getQueryParams('selected_month') ?? '';

  return (
    <div className='flex items-center gap-3'>
      <label className='text-sm font-medium text-foreground'>View Month:</label>
      <Select
        defaultValue={selectedMonth}
        onValueChange={(value) => updateQueryParams('selected_month', value)}
      >
        <SelectTrigger className='w-48'>
          <SelectValue placeholder='Select month' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={'all_months'}>All months</SelectItem>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
