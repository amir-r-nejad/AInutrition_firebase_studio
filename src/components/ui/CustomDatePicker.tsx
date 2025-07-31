import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker, { DatePickerProps } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function CustomDatePicker({ className, ...props }: DatePickerProps) {
  return (
    <DatePicker
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      wrapperClassName='w-full'
      popperClassName='!z-30'
      calendarClassName='bg-popover border rounded-md shadow-lg'
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className='flex items-center justify-between p-2'>
          <button
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            type='button'
            className='inline-flex items-center justify-center p-1 rounded-md text-popover-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50'
          >
            <ChevronLeft />
          </button>
          <span className='text-sm font-semibold text-popover-foreground'>
            {date.toLocaleString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            type='button'
            className='inline-flex items-center justify-center p-1 rounded-md text-popover-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50'
          >
            <ChevronRight />
          </button>
        </div>
      )}
      {...props}
    />
  );
}

export default CustomDatePicker;
