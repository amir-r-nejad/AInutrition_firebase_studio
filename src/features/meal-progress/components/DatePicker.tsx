'use client';

import { Button } from '@/components/ui/button';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { useQueryParams } from '@/hooks/useQueryParams';

type DatePickerProps = {
  selectedDays: string[];
};

export function DatePicker({ selectedDays }: DatePickerProps) {
  const { getQueryParams, updateQueryParams } = useQueryParams();

  function handleSetToday() {
    updateQueryParams('selected_day', new Date().toISOString().slice(0, 10));
  }

  return (
    <div className='w-80 flex items-center gap-2'>
      <p className='min-w-max'>Select Date:</p>
      <CustomDatePicker
        highlightDates={selectedDays.map((date) => new Date(date))}
        maxDate={new Date()}
        selected={
          getQueryParams('selected_day')
            ? new Date(getQueryParams('selected_day')!)
            : new Date()
        }
        onChange={(date) =>
          updateQueryParams(
            'selected_day',
            date ? date.toISOString().slice(0, 10) : ''
          )
        }
      />
      <Button variant='outline' onClick={handleSetToday}>
        Today
      </Button>
    </div>
  );
}
