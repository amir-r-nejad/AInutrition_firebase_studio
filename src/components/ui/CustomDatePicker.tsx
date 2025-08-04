import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker, { DatePickerProps } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function CustomDatePicker({ className, ...props }: DatePickerProps) {
  return (
    <DatePicker
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      wrapperClassName='w-full'
      calendarClassName={cn(
        '!bg-background !border !border-border !rounded-md !shadow-md !p-0 !font-sans'
      )}
      dayClassName={(date) => {
        const isToday = date.toDateString() === new Date().toDateString();
        const isDisabled =
          (props.maxDate && date > props.maxDate) ||
          (props.excludeDates &&
            props.excludeDates.some(
              (excludedDate) =>
                excludedDate instanceof Date &&
                date.toDateString() === excludedDate.toDateString()
            ));

        const isSelected =
          props.selected &&
          date.toDateString() === props.selected.toDateString();

        const isHighlighted =
          props.highlightDates &&
          props.highlightDates.some(
            (selected) =>
              selected instanceof Date &&
              date.toDateString() === selected.toDateString()
          );

        return cn(
          'font-normal relative transition-all duration-200 rounded !border-0 !focus:outline-none !bg-transparent',

          !isDisabled &&
            !isSelected &&
            'hover:!bg-accent/5 hover:text-accent ring-2 ring-accent/0 hover:ring-accent/50',

          isToday &&
            !isSelected &&
            !isDisabled &&
            '!bg-accent !text-accent-foreground font-semibold ring-2 ring-accent/30 hover:!bg-accent/90 hover:!ring-accent/50',

          isSelected &&
            !isDisabled &&
            '!bg-primary !text-primary-foreground font-bold ring-2 ring-primary/30 hover:!bg-primary/80  hover:!ring-primary/50',

          isHighlighted &&
            !isSelected &&
            !isDisabled &&
            '!bg-secondary/10 !text-secondary font-bold ring-2 ring-secondary/70 hover:!bg-secondary/30 hover:!ring-secondary/90',

          isDisabled &&
            '!text-muted-foreground/40 !opacity-30 !hover:bg-transparent'
        );
      }}
      weekDayClassName={() =>
        '!text-muted-foreground !rounded-md !font-normal !text-[0.8rem]'
      }
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className='flex justify-center py-2 relative items-center'>
          <button
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            type='button'
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1'
            )}
          >
            <ChevronLeft className='h-4 w-4' />
          </button>

          <span className='text-sm font-medium'>
            {date.toLocaleString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>

          <button
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            type='button'
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1'
            )}
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>
      )}
      {...props}
    />
  );
}

export default CustomDatePicker;
