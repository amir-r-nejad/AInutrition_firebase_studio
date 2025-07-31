import { getAvailableMonths, getEntriesForMonth } from '../lib/mockData';
import { getUserProgress } from '../lib/progress-service';
import { MonthSelector } from './MonthSelector';
import { ProgressChart } from './ProgressChart';
import { ProgressEntriesList } from './ProgressEntriesList';
import { WeeklyEntryForm } from './WeeklyEntryForm';

type ProgressTrackingParams = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function ProgressTrackingSection({
  searchParams,
}: ProgressTrackingParams) {
  const progress = await getUserProgress();

  const availableMonths = getAvailableMonths(progress);

  const params = await searchParams;
  const selectedMonth = params?.selected_month || '2025-1';

  const selectedMonthData = selectedMonth
    ? availableMonths.find((m) => m.value === selectedMonth)
    : null;

  const entries = selectedMonthData
    ? getEntriesForMonth({ progress, ...selectedMonthData })
    : [];

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <MonthSelector months={availableMonths} />
      </div>

      <ProgressChart entries={entries} selectedMonth={selectedMonth} />

      <WeeklyEntryForm />

      <ProgressEntriesList entries={entries} selectedMonth={selectedMonth} />
    </div>
  );
}
