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
  const selectedMonth = params?.selected_month || 'all_months';

  const selectedMonthData = selectedMonth
    ? availableMonths.find((m) => m.value === selectedMonth)
    : null;

  const entries = selectedMonthData
    ? getEntriesForMonth({ progress, ...selectedMonthData })
    : progress;

  return (
    <div className='space-y-6'>
      {/* Month Selector */}
      <div className='flex justify-between items-center'>
        <MonthSelector months={availableMonths} />
      </div>

      {/* Progress Chart */}
      <ProgressChart entries={entries} selectedMonth={selectedMonth} />

      {/* Weekly Entry Form */}
      <WeeklyEntryForm entries={progress} />

      {/* Progress Entries List */}
      <ProgressEntriesList entries={entries} selectedMonth={selectedMonth} />
    </div>
  );
}
